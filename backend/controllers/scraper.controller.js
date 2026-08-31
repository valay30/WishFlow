import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ── Gemini candidate models — race them ALL in parallel, take first success ───
const CANDIDATE_MODELS = [
    'gemini-1.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
];

async function generateWithGemini(prompt) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const genAI = new GoogleGenerativeAI(apiKey);

    // Fire all models at the same time — return whichever responds first
    const modelRaces = CANDIDATE_MODELS.map(async (modelName) => {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const text = result.response.text().trim();
            if (text) return text;
            throw new Error('empty response');
        } catch (err) {
            throw new Error(`${modelName}: ${err.message}`);
        }
    });

    try {
        return await Promise.any(modelRaces);
    } catch {
        // All models failed
        return null;
    }
}

// ── Browser-like headers to bypass anti-bot detection ────────────────────────
const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'DNT': '1',
};

// ── (unshortenUrl removed as it is now combined with main fetch) ─────────────

// ── Proxy fallback for cloud datacenter IPs blocked by Amazon/Flipkart ───────
async function fetchViaProxy(targetUrl) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(`https://r.jina.ai/${targetUrl}`, {
            headers: {
                'Accept': 'application/json',
                'X-With-Generated-Alt': 'true',
            },
            signal: controller.signal,
        });
        clearTimeout(timeout);
        const json = await res.json();
        if (json?.data) {
            const content = json.data.content || '';
            const rawTitle = json.data.title || json.data.metadata?.title || '';

            // Clean Amazon page title prefix/suffix
            const cleanTitle = rawTitle
                .replace(/^Amazon\.in\s*:\s*/i, '')
                .replace(/:\s*Amazon\.in.*$/i, '')
                .trim();

            // Extract first meaningful product image from markdown: ![alt](url)
            let image = null;
            const imgMatches = content.matchAll(/!\[.*?\]\((https?:\/\/[^\s\)]+)\)/g);
            for (const m of imgMatches) {
                const imgUrl = m[1];
                if (imgUrl && !imgUrl.includes('logo') && !imgUrl.includes('icon') && !imgUrl.includes('sprite') && !imgUrl.includes('arrow') && (imgUrl.includes('media-amazon') || imgUrl.includes('images-amazon') || imgUrl.includes('flixcart') || imgUrl.includes('myntassets'))) {
                    image = resolveImageUrl(imgUrl, targetUrl);
                    break;
                }
            }

            // Extract price from content if available (e.g. ₹239.89 or Rs. 239)
            const priceMatch = content.match(/(?:₹|Rs\.?|INR|\$|€|£)\s*([\d,]+(?:\.\d{2})?)/i);
            const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null;

            return {
                title: cleanTitle && cleanTitle !== 'Page Not Found' && cleanTitle.toLowerCase() !== 'amazon.in' && !cleanTitle.toLowerCase().includes('robot check') ? cleanTitle : '',
                description: content.slice(0, 2500),
                image,
                price,
            };
        }
    } catch (err) {
        console.warn('Proxy fallback failed:', err.message);
    }
    return null;
}

// ── Fix relative image URLs and clean Amazon thumbnail params ─────────────────
function resolveImageUrl(src, baseUrl) {
    if (!src) return null;
    try {
        // Make relative URLs absolute
        if (src.startsWith('//')) return 'https:' + src;
        if (src.startsWith('/')) return new URL(baseUrl).origin + src;
        if (!src.startsWith('http')) return new URL(src, baseUrl).href;

        // Remove Amazon image resizing modifiers to get full HD image
        // e.g. ._AC_UY218_. or ._SX300_ → nothing → gets full size image
        src = src.replace(/\._[A-Z0-9_,]+_\./g, '.');
        return src;
    } catch {
        return src;
    }
}

// ── Extract from JSON-LD (Schema.org Product) — most accurate ─────────────────
function extractJsonLd($) {
    const result = {};
    $('script[type="application/ld+json"]').each((_, el) => {
        try {
            const raw = $(el).html();
            if (!raw) return;
            const data = JSON.parse(raw);
            const items = Array.isArray(data) ? data : [data];

            for (const item of items) {
                const target = item['@type'] === 'Product' ? item
                    : item['@graph']?.find(g => g['@type'] === 'Product');

                if (!target) continue;

                if (target.name) result.title = result.title || target.name;

                // Images
                if (!result.image) {
                    if (typeof target.image === 'string') result.image = target.image;
                    else if (Array.isArray(target.image)) result.image = target.image[0];
                    else if (target.image?.url) result.image = target.image.url;
                }

                // Price
                if (!result.price) {
                    const offers = target.offers || target.Offers;
                    if (offers) {
                        const offer = Array.isArray(offers) ? offers[0] : offers;
                        if (offer.price) result.price = parseFloat(offer.price);
                        if (offer.priceCurrency) result.currency = offer.priceCurrency;
                    }
                }

                if (result.title && result.image && result.price) return false; // break
            }
        } catch { /* malformed JSON-LD — skip */ }
    });
    return result;
}

// ── Extract from OpenGraph / Twitter Card meta tags ───────────────────────────
function extractMeta($) {
    const getMeta = (selectors) => {
        for (const sel of selectors) {
            const val = $(sel).attr('content');
            if (val && val.trim()) return val.trim();
        }
        return null;
    };

    return {
        title: getMeta([
            'meta[property="og:title"]',
            'meta[name="twitter:title"]',
            'meta[name="title"]',
        ]),
        image: getMeta([
            'meta[property="og:image:secure_url"]',
            'meta[property="og:image"]',
            'meta[name="twitter:image"]',
            'meta[name="twitter:image:src"]',
        ]),
        price: getMeta([
            'meta[property="og:price:amount"]',
            'meta[property="product:price:amount"]',
            'meta[name="og:price:amount"]',
        ]),
        currency: getMeta([
            'meta[property="og:price:currency"]',
            'meta[property="product:price:currency"]',
        ]),
        description: getMeta([
            'meta[property="og:description"]',
            'meta[name="description"]',
            'meta[name="twitter:description"]',
        ]),
    };
}

// ── Site-specific CSS selectors for major Indian & global shopping sites ──────
function extractSiteSpecific($, hostname, baseUrl) {
    const result = {};
    const host = (hostname || '').toLowerCase();

    // ── Amazon (amazon.in, amazon.com, amzn.in, amzn.to, a.co) ──
    if (host.includes('amazon') || host.includes('amzn') || host.includes('a.co')) {
        result.title = result.title ||
            $('#productTitle').text().trim() ||
            $('#title').text().trim() ||
            $('h1.product-title-word-break').text().trim() ||
            $('span#productTitle').text().trim();

        // Price: try multiple price selectors Amazon uses
        const priceSelectors = [
            '.a-price .a-offscreen',
            '#corePriceDisplay_desktop_feature_div .a-offscreen',
            '#corePrice_desktop .a-offscreen',
            '#corePrice_feature_div .a-offscreen',
            '.apexPriceToPay .a-offscreen',
            '#priceblock_ourprice',
            '#priceblock_dealprice',
            '#price_inside_buybox',
            '#priceblock_saleprice',
            '.reinventPriceMobileHeroPrice .a-offscreen',
            'span[data-asin-price]',
        ];
        for (const sel of priceSelectors) {
            const val = $(sel).first().text().trim();
            if (val) { result.priceText = result.priceText || val; break; }
        }

        // Image: get the main large image
        const imgData = $('#landingImage, #imgBlkFront, #main-image').attr('data-old-hires') ||
            $('#landingImage, #imgBlkFront, #main-image').attr('src') ||
            $('#landingImage').attr('data-a-dynamic-image');

        if (imgData) {
            if (imgData.startsWith('{')) {
                // Parse dynamic image JSON blob
                try {
                    const keys = Object.keys(JSON.parse(imgData));
                    if (keys.length) result.image = resolveImageUrl(keys[0], baseUrl);
                } catch { /* ignore */ }
            } else {
                result.image = result.image || resolveImageUrl(imgData, baseUrl);
            }
        }

        // Also check the image JSON blob Amazon embeds in scripts
        if (!result.image) {
            const scripts = $('script').map((_, el) => $(el).html()).get();
            for (const s of scripts) {
                const m = s.match(/"hiRes"\s*:\s*"(https?:\/\/[^"]+)"/) ||
                    s.match(/"large"\s*:\s*"(https?:\/\/[^"]+)"/);
                if (m) { result.image = resolveImageUrl(m[1], baseUrl); break; }
            }
        }
    }

    // ── Flipkart (flipkart.com, fkrt.it, dl.flipkart.com) ──
    if (host.includes('flipkart') || host.includes('fkrt')) {
        result.title = result.title || $('.B_NuCI').first().text().trim() ||
            $('span[class*="title"]').first().text().trim() ||
            $('h1').first().text().trim();
        result.priceText = result.priceText || $('._30jeq3').first().text().trim() ||
            $('._1vC4OE').first().text().trim();
        const imgEl = $('._396cs4, ._2r_T1I, img._396cs4').first();
        if (imgEl.length) result.image = result.image || resolveImageUrl(imgEl.attr('src'), baseUrl);
    }

    // ── Myntra (myntra.com, myntr.it) ──
    if (host.includes('myntra') || host.includes('myntr')) {
        result.title = result.title || $('.pdp-name').first().text().trim() ||
            $('h1.pdp-title').first().text().trim();
        result.priceText = result.priceText || $('.pdp-price strong').first().text().trim() ||
            $('span.pdp-mrp strong').first().text().trim();
    }

    // ── Meesho ──
    if (host.includes('meesho')) {
        result.title = result.title || $('p[class*="ProductTitle"]').first().text().trim() ||
            $('h1').first().text().trim();
        result.priceText = result.priceText || $('h5[class*="price"]').first().text().trim();
    }

    // ── Nykaa ──
    if (host.includes('nykaa')) {
        result.title = result.title || $('h1.product-title').first().text().trim() ||
            $('h1[class*="css-"]').first().text().trim();
        result.priceText = result.priceText || $('span.price').first().text().trim() ||
            $('strong[class*="price"]').first().text().trim();
    }

    // ── Nike ──
    if (host.includes('nike')) {
        result.title = result.title || $('h1[data-testid="product_title"]').first().text().trim() ||
            $('h1.headline-2').first().text().trim();
        result.priceText = result.priceText || $('div[data-testid="currentPrice-container"]').first().text().trim();
        const imgEl = $('figure img').first();
        if (imgEl.length) result.image = result.image || resolveImageUrl(imgEl.attr('src'), baseUrl);
    }

    // ── Generic fallbacks ──
    if (!result.title) {
        result.title = $('h1').first().text().trim() ||
            $('title').text().split(/[|\-–—]/)[0].trim();
    }
    if (!result.image) {
        // Try first meaningful product image (skip logos < 200px)
        $('img').each((_, el) => {
            const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
            const width = parseInt($(el).attr('width') || '0');
            const height = parseInt($(el).attr('height') || '0');
            if (src && (width === 0 || width > 150) && (height === 0 || height > 150)) {
                if (!src.includes('logo') && !src.includes('icon') && !src.includes('sprite') && !src.includes('banner')) {
                    result.image = result.image || resolveImageUrl(src, baseUrl);
                    return false; // break
                }
            }
        });
    }

    return result;
}

// ── Extract embedded Next.js / Preloaded State data ───────────────────────────
function extractNextData($) {
    const result = {};
    try {
        const nextDataEl = $('#__NEXT_DATA__');
        if (nextDataEl.length) {
            const data = JSON.parse(nextDataEl.html());
            const props = data?.props?.pageProps;
            if (props) {
                // Myntra / Meesho style
                const product = props.productData || props.product || props.pdpData?.product || props.data;
                if (product) {
                    result.title = result.title || product.name || product.title;
                    result.price = result.price || product.price?.discounted || product.sellingPrice || product.price;
                    if (product.images?.[0]) result.image = result.image || product.images[0].src || product.images[0];
                }
            }
        }
    } catch { /* ignore */ }
    return result;
}

// ── Parse price text to a number ─────────────────────────────────────────────
function parsePrice(priceText) {
    if (!priceText) return null;
    // Remove currency symbols, commas, and whitespace; keep digits + decimal
    const clean = priceText.replace(/[₹$€£¥₩,\s]/g, '').match(/[\d.]+/);
    return clean ? parseFloat(clean[0]) : null;
}

function trimTitle(title) {
    if (!title) return '';
    return title.trim().split(/\s+/).slice(0, 5).join(' ');
}

// ── Gemini AI: normalize + categorize + match collection ──────────────────
async function geminiNormalize(rawData, userCategories, userCollections) {
    const catNames = userCategories?.length
        ? userCategories.map(c => `${c.id}:${c.name}`).join(', ')
        : 'No categories';

    const colNames = userCollections?.length
        ? userCollections.map(c => `${c.id}:${c.name}`).join(', ')
        : 'No collections';

    const prompt = `You are a product data extractor for a wishlist app. Given raw scraped product data, return ONLY valid JSON.

Raw data:
- Title: ${rawData.title || 'unknown'}
- Price: ${rawData.price || rawData.priceText || 'unknown'}
- Currency: ${rawData.currency || 'unknown'}
- Image URL: ${rawData.image || 'none'}
- Description: ${rawData.description || 'none'}
- Site: ${rawData.site || 'unknown'}

User's categories (id:name): ${catNames}
User's custom collections (id:name): ${colNames}

Tasks:
1. Clean the title: strip the site/brand domain name, SEO junk, "Buy online", "Best price", "with warranty", sizes, colors, model numbers, and any filler words. Keep ONLY the core product identity — maximum 4-5 words. Examples: "Apple iPhone 15 Pro" NOT "Buy Apple iPhone 15 Pro 128GB Natural Titanium Online at Best Price in India". "Nike Air Force 1" NOT "Nike Air Force 1 '07 Men's Shoe White White Size 10". "boAt Airdopes 311 Pro" NOT "boAt Airdopes 311 Pro TWS Earbuds with 60H Playback".
2. Extract the numeric price (just the number, no symbols).
3. Detect currency code (INR, USD, EUR, GBP, etc.) from context.
4. Keep the image URL exactly as-is (do not modify).
5. Match the product to ONE of the user's categories by id. If no match, use id -1 (meaning "Other").
6. Match the product to ONE of the user's custom collections by id ONLY IF the product clearly and logically fits the collection name/purpose (e.g., gaming headset -> "Gaming Setup", shoes -> "Gym / Fitness"). If it does NOT clearly match any collection or there are no collections, set collectionId to null.

Return ONLY this JSON (no markdown, no explanation):
{
  "title": "cleaned product title",
  "price": 1234.56,
  "currency": "INR",
  "image": "https://...",
  "categoryId": 3,
  "collectionId": null
}`;

    try {
        const text = await generateWithGemini(prompt);
        if (!text) return null;

        // Strip any ```json ``` wrapping if Gemini adds it
        const jsonText = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
        const parsed = JSON.parse(jsonText);

        // ── HARD ENFORCE: max 5 words on title, no matter what Gemini returns ──
        if (parsed.title) {
            parsed.title = trimTitle(parsed.title);
        }

        return parsed;
    } catch (err) {
        console.error('Gemini normalization error:', err.message);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// IN-MEMORY CACHE (TTL: 10 minutes)
// ═══════════════════════════════════════════════════════════════════════════════
const scrapeCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

function getCached(url) {
    const entry = scrapeCache.get(url);
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL_MS) { scrapeCache.delete(url); return null; }
    return entry.data;
}

function setCached(url, data) {
    scrapeCache.set(url, { data, ts: Date.now() });
    // Prevent unbounded growth
    if (scrapeCache.size > 500) {
        const firstKey = scrapeCache.keys().next().value;
        scrapeCache.delete(firstKey);
    }
}

// ── Helper: fetch HTML directly ───────────────────────────────────────────────
async function fetchDirect(url, timeoutMs = 7000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            headers: BROWSER_HEADERS,
            redirect: 'follow',
            signal: controller.signal,
        });
        clearTimeout(timer);
        const finalUrl = res.url || url;
        const hostname = (() => { try { return new URL(finalUrl).hostname.toLowerCase(); } catch { return new URL(url).hostname.toLowerCase(); } })();
        const html = await res.text();
        return { html, finalUrl, hostname };
    } catch (err) {
        clearTimeout(timer);
        throw err;
    }
}

// ── Assemble raw data from parsed HTML ───────────────────────────────────────
function assembleRaw($, hostname, finalUrl) {
    const jsonLd = extractJsonLd($);
    const meta = extractMeta($);
    const siteSpecific = extractSiteSpecific($, hostname, finalUrl);
    const nextData = extractNextData($);

    const raw = {
        title: jsonLd.title || nextData.title || siteSpecific.title || meta.title || '',
        price: jsonLd.price || nextData.price || parsePrice(siteSpecific.priceText) || parsePrice(meta.price) || null,
        currency: jsonLd.currency || nextData.currency || meta.currency || null,
        image: jsonLd.image || nextData.image || siteSpecific.image || meta.image || null,
        description: meta.description || '',
        priceText: siteSpecific.priceText || '',
        site: hostname,
    };
    if (raw.image) raw.image = resolveImageUrl(raw.image, finalUrl);
    return raw;
}

// ── Check if the page looks blocked / CAPTCHA ────────────────────────────────
function isPageBlocked(raw, html) {
    return !raw.title ||
        raw.title.toLowerCase() === 'amazon.in' ||
        raw.title.toLowerCase().includes('robot check') ||
        html.includes('api-services-support@amazon.com') ||
        html.includes('Enter the characters you see below') ||
        (!raw.price && !raw.image);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════
export const extractMetadata = async (req, res) => {
    let { url, categories, collections } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    // ── Cache hit → instant response ─────────────────────────────────────────
    const cached = getCached(url);
    if (cached) {
        return res.json({ ...cached, source: 'cache' });
    }

    try {
        const isDifficultDomain = /amazon|amzn|a\.co|flipkart|fkrt|myntra/i.test(url);

        // ── Step 1: Start BOTH direct fetch and proxy fetch in parallel ───────
        // For difficult domains we race them — whoever returns usable data first wins.
        // For easy domains we only do a direct fetch (proxy is a costly no-op).
        const directPromise = fetchDirect(url, 7000).catch(() => null);
        const proxyPromise  = isDifficultDomain ? fetchViaProxy(url) : Promise.resolve(null);

        // ── Hard wall-clock timeout (13 s) — client should NEVER hang longer ──
        const HARD_TIMEOUT = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Hard timeout exceeded')), 13000)
        );

        // ── Step 2: Await the direct fetch (proxy continues in background) ────
        let directResult = null;
        try {
            directResult = await Promise.race([directPromise, HARD_TIMEOUT]);
        } catch {
            // Hard timeout hit or direct fetch failed
        }

        let html      = directResult?.html      || '';
        let finalUrl  = directResult?.finalUrl  || url;
        let hostname  = directResult?.hostname  || (() => { try { return new URL(url).hostname.toLowerCase(); } catch { return ''; } })();

        // ── Step 3: Parse HTML + check for meta-refresh redirect ─────────────
        let $ = cheerio.load(html);

        const metaRefresh = $('meta[http-equiv="refresh"]').attr('content');
        if (metaRefresh) {
            const match = metaRefresh.match(/url=['"]?([^'"\s>]+)/i);
            if (match && match[1]) {
                try {
                    const redirectTarget = new URL(match[1], finalUrl).href;
                    if (!redirectTarget.includes(finalUrl)) {
                        const rRes = await fetch(redirectTarget, { headers: BROWSER_HEADERS, redirect: 'follow' });
                        finalUrl = rRes.url || redirectTarget;
                        hostname = new URL(finalUrl).hostname.toLowerCase();
                        html = await rRes.text();
                        $ = cheerio.load(html);
                    }
                } catch { /* proceed with current html */ }
            }
        }

        // ── Step 4: Extract raw data from parsed HTML ────────────────────────
        let raw = assembleRaw($, hostname, finalUrl);

        // ── Step 5: If page looks blocked, merge in proxy data ───────────────
        // The proxy was already running in background — just await it (cheap, not a new call)
        if (isPageBlocked(raw, html)) {
            const proxyData = await Promise.race([proxyPromise, new Promise(res => setTimeout(() => res(null), 6000))]);
            if (proxyData) {
                const titleIsGarbage = !raw.title || raw.title.toLowerCase() === 'amazon.in' || raw.title.toLowerCase().includes('robot check');
                if (proxyData.title && titleIsGarbage)   raw.title       = proxyData.title;
                if (proxyData.description)               raw.description = proxyData.description;
                if (proxyData.image   && !raw.image)     raw.image       = proxyData.image;
                if (proxyData.price   && !raw.price)     raw.price       = proxyData.price;
            }
        }

        // ── Step 6: Run Gemini with a 6s deadline (fail-fast, not fail-slow) ──
        const geminiWithTimeout = Promise.race([
            geminiNormalize(raw, categories || [], collections || []),
            new Promise(resolve => setTimeout(() => resolve(null), 6000)),
        ]);

        const geminiResult = await geminiWithTimeout;

        // ── Step 7: Build and cache the response ─────────────────────────────
        const matchedCat = (categories || []).find(c => c.id === geminiResult?.categoryId);
        const matchedCol = (collections || []).find(c => String(c.id) === String(geminiResult?.collectionId));

        const finalTitle = trimTitle(geminiResult?.title || raw.title);
        const response = geminiResult
            ? {
                title:          finalTitle,
                price:          geminiResult.price       || raw.price,
                currency:       geminiResult.currency    || raw.currency || 'INR',
                image:          geminiResult.image       || raw.image,
                categoryId:     geminiResult.categoryId  ?? -1,
                categoryName:   matchedCat?.name         || 'Other',
                collectionId:   matchedCol ? matchedCol.id : null,
                collectionName: matchedCol?.name         || null,
                url:            finalUrl,
                source:         'gemini',
              }
            : {
                title:          trimTitle(raw.title),
                price:          raw.price,
                currency:       raw.currency             || 'INR',
                image:          raw.image,
                categoryId:     -1,
                collectionId:   null,
                url:            finalUrl,
                source:         'html',
              };

        // Only cache if we got something useful
        if (response.title || response.image) {
            setCached(url, response);
        }

        return res.json(response);

    } catch (err) {
        console.error('Scraper error:', err.message);
        return res.status(500).json({ error: 'Failed to extract product data: ' + err.message });
    }
};

