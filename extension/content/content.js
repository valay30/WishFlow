// ── WishFlow Content Script ────────────────────────────────────────────────────
// Injected into every page. Reads product data from the DOM and responds
// to messages from popup.js with { title, price, image, url }.

(function () {
  'use strict';

  // ── Utility: clean a string ──────────────────────────────────────────────────
  function clean(str) {
    if (!str) return '';
    return str.replace(/\s+/g, ' ').trim();
  }

  // ── Utility: parse a price string like "₹1,499" or "$29.99" ────────────────
  function parsePrice(str) {
    if (!str) return null;
    const match = str.match(/[\d,]+(?:\.\d+)?/);
    if (!match) return null;
    const num = parseFloat(match[0].replace(/,/g, ''));
    return isNaN(num) ? null : num;
  }

  // ── Site-specific extractors ─────────────────────────────────────────────────

  function extractAmazon() {
    const title = clean(
      document.querySelector('#productTitle')?.textContent ||
      document.querySelector('.product-title-word-break')?.textContent ||
      ''
    );

    // Price: try multiple selectors in priority order
    const priceSelectors = [
      '.a-price .a-offscreen',
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '#corePrice_feature_div .a-offscreen',
      '.reinventPricePriceToPayMargin .a-offscreen',
      '#price_inside_buybox',
      '#apex_offerDisplay_desktop .a-price .a-offscreen',
    ];
    let rawPrice = '';
    for (const sel of priceSelectors) {
      const el = document.querySelector(sel);
      if (el) { rawPrice = el.textContent; break; }
    }
    const price = parsePrice(rawPrice);

    // Image: try landing image first, then carousel
    const imageSelectors = [
      '#landingImage',
      '#imgBlkFront',
      '#main-image',
      '.a-dynamic-image',
    ];
    let image = null;
    for (const sel of imageSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        // Amazon sometimes stores the full-res URL in data-old-hires
        image = el.getAttribute('data-old-hires') || el.getAttribute('src');
        if (image) break;
      }
    }

    return { title, price, image, url: window.location.href };
  }

  function extractFlipkart() {
    const title = clean(
      document.querySelector('span.B_NuCI')?.textContent ||
      document.querySelector('h1.yhB1nd span')?.textContent ||
      document.querySelector('h1._6EBuvT')?.textContent ||
      document.querySelector('h1[class*="title"]')?.textContent ||
      ''
    );

    const rawPrice =
      document.querySelector('div._30jeq3._16Jk6d')?.textContent ||
      document.querySelector('div._30jeq3')?.textContent ||
      document.querySelector('._16Jk6d')?.textContent ||
      '';
    const price = parsePrice(rawPrice);

    const image =
      document.querySelector('div._2r_T1I img._396cs4')?.getAttribute('src') ||
      document.querySelector('img._396cs4')?.getAttribute('src') ||
      document.querySelector('div._2r_T1I img')?.getAttribute('src') ||
      null;

    return { title, price, image, url: window.location.href };
  }

  function extractMyntra() {
    const title = clean(
      document.querySelector('h1.pdp-title')?.textContent ||
      document.querySelector('.pdp-name')?.textContent ||
      document.querySelector('h1[class*="title"]')?.textContent ||
      ''
    );
    const subtitle = clean(
      document.querySelector('h1.pdp-name')?.textContent ||
      ''
    );
    const fullTitle = subtitle ? `${title} ${subtitle}` : title;

    const rawPrice =
      document.querySelector('span.pdp-price strong')?.textContent ||
      document.querySelector('.pdp-discount-container span')?.textContent ||
      document.querySelector('[class*="selling-price"]')?.textContent ||
      '';
    const price = parsePrice(rawPrice);

    const image =
      document.querySelector('div.image-grid-image img')?.getAttribute('src') ||
      document.querySelector('.pdp-sliderContainer img')?.getAttribute('src') ||
      null;

    return { title: fullTitle, price, image, url: window.location.href };
  }

  function extractMeesho() {
    const title = clean(
      document.querySelector('h1[class*="ProductTitle"]')?.textContent ||
      document.querySelector('p[class*="ProductTitle"]')?.textContent ||
      ''
    );
    const rawPrice =
      document.querySelector('h4[class*="price"]')?.textContent ||
      document.querySelector('[class*="Price"]')?.textContent ||
      '';
    const price = parsePrice(rawPrice);
    const image = document.querySelector('img[class*="ProductImage"]')?.getAttribute('src') || null;
    return { title, price, image, url: window.location.href };
  }

  function extractAjio() {
    // Brand + title combined (e.g. "DNMX Men Regular Fit Classic Shirt")
    const brand = clean(
      document.querySelector('.brand-name')?.textContent ||
      document.querySelector('.brand-header')?.textContent ||
      ''
    );
    const prodTitle = clean(
      document.querySelector('h1.prod-title')?.textContent ||
      document.querySelector('.prod-title')?.textContent ||
      ''
    );
    const title = brand && prodTitle ? `${brand} ${prodTitle}` : (prodTitle || brand);

    // Price: .prod-sp is the selling price; .prod-cp is MRP (avoid that)
    const rawPrice =
      document.querySelector('.prod-sp')?.textContent ||
      document.querySelector('span.prod-sp')?.textContent ||
      document.querySelector('[class*="prod-sp"]')?.textContent ||
      document.querySelector('.price-val')?.textContent ||
      '';
    const price = parsePrice(rawPrice);

    // Image: main product image uses img-alignment class
    const image =
      document.querySelector('img.img-alignment')?.getAttribute('src') ||
      document.querySelector('img[alt^="Product image of"]')?.getAttribute('src') ||
      document.querySelector('.rilrtl-lazy-img')?.getAttribute('src') ||
      null;

    return { title, price, image, url: window.location.href };
  }

  // ── JSON-LD / OpenGraph generic fallback ─────────────────────────────────────

  function extractJsonLd() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const el of scripts) {
      try {
        const data = JSON.parse(el.textContent);
        const items = Array.isArray(data) ? data : [data];
        for (const item of items) {
          const target = item['@type'] === 'Product' ? item
            : item['@graph']?.find(g => g['@type'] === 'Product');
          if (!target) continue;
          const title = target.name || '';
          const image = typeof target.image === 'string' ? target.image
            : Array.isArray(target.image) ? target.image[0]
            : target.image?.url || null;
          const offers = target.offers || target.Offers;
          const offer = Array.isArray(offers) ? offers[0] : offers;
          const price = offer?.price ? parseFloat(offer.price) : null;
          if (title || image) return { title, price, image, url: window.location.href };
        }
      } catch { /* ignore bad JSON */ }
    }
    return null;
  }

  function extractOpenGraph() {
    const get = (name) =>
      document.querySelector(`meta[property="${name}"]`)?.getAttribute('content') ||
      document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') ||
      '';

    const title = clean(get('og:title') || get('twitter:title') || document.title);
    const image = get('og:image') || get('twitter:image') || null;
    const rawPrice = get('product:price:amount') || get('og:price:amount') || '';
    const price = parsePrice(rawPrice) || null;

    return { title, price, image, url: window.location.href };
  }

  // ── Main extractor: pick the right strategy by hostname ─────────────────────

  function extractProductData() {
    const hostname = window.location.hostname.toLowerCase();

    let data = null;

    if (/amazon\.(in|com|co\.uk|de|fr|co\.jp|com\.au|ca|ae)/.test(hostname)) {
      data = extractAmazon();
    } else if (/flipkart\.com/.test(hostname)) {
      data = extractFlipkart();
    } else if (/myntra\.com/.test(hostname)) {
      data = extractMyntra();
    } else if (/meesho\.com/.test(hostname)) {
      data = extractMeesho();
    } else if (/ajio\.com/.test(hostname)) {
      data = extractAjio();
    }

    // Fill in any gaps with JSON-LD, then OG tags
    const jsonLd = extractJsonLd();
    const og = extractOpenGraph();

    return {
      title: data?.title || jsonLd?.title || og?.title || '',
      price: data?.price ?? jsonLd?.price ?? og?.price ?? null,
      image: data?.image || jsonLd?.image || og?.image || null,
      url: window.location.href,
    };
  }

  // ── Message listener ─────────────────────────────────────────────────────────

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'GET_PRODUCT_DATA') {
      try {
        const data = extractProductData();
        sendResponse({ success: true, data });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    }
    // Return true to indicate we'll respond asynchronously (not needed here,
    // but good practice for MV3)
    return true;
  });

})();
