import * as cheerio from "cheerio";
import webpush from "web-push";
import { supabase } from "../config/supabase.js";
import { scrapePriceOnly } from "../controllers/scraper.controller.js";

webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || "admin@wishflow.app"}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);


async function notifyUser(userId, payload) {
    const { data: subs, error } = await supabase.from("push_subscriptions").select("*").eq("user_id", userId);
    if (error || !subs || subs.length === 0) return 0;
    let sent = 0;
    await Promise.all(subs.map(async (sub) => {
        const pushSub = { endpoint: sub.endpoint, keys: { p256dh: sub.keys_p256dh, auth: sub.keys_auth } };
        try {
            await webpush.sendNotification(pushSub, JSON.stringify(payload));
            sent++;
        } catch (err) {
            if (err.statusCode === 410 || err.statusCode === 404) {
                await supabase.from("push_subscriptions").delete().eq("id", sub.id);
            }
        }
    }));
    return sent;
}

async function runWithConcurrency(tasks, limit = 5) {
    const results = [];
    const executing = [];
    for (const task of tasks) {
        const p = Promise.resolve().then(task);
        results.push(p);
        const e = p.then(() => executing.splice(executing.indexOf(e), 1));
        executing.push(e);
        if (executing.length >= limit) await Promise.race(executing);
    }
    return Promise.all(results);
}

export async function runPriceDrop() {
    const startedAt = new Date().toISOString();
    console.log(`[PriceDrop] Job started at ${startedAt}`);

    const summary = { startedAt, itemsChecked: 0, dropsFound: 0, notificationsSent: 0, errors: 0, finishedAt: null };

    try {
        const { data: items, error } = await supabase
            .from("items")
            .select("id, name, link, price, user_id, image")
            .not("link", "is", null)
            .not("price", "is", null)
            .gt("price", 0);

        if (error) throw error;

        if (!items || items.length === 0) {
            summary.finishedAt = new Date().toISOString();
            await saveSummary(summary);
            return summary;
        }

        console.log(`[PriceDrop] Checking ${items.length} items...`);

        const tasks = items.map(item => async () => {
            summary.itemsChecked++;
            try {
                const newPrice = await scrapePriceOnly(item.link);
                if (!newPrice) return;

                const oldPrice = parseFloat(item.price);
                const dropPercent = ((oldPrice - newPrice) / oldPrice) * 100;

                // Protect against extreme drops which are usually currency mismatch bugs (e.g., INR to USD)
                if (dropPercent > 90) {
                    console.warn(`[PriceDrop] Ignored extreme drop for ${item.name}: Rs.${oldPrice} -> Rs.${newPrice} (${dropPercent.toFixed(1)}%). Likely currency mismatch.`);
                    return; // Skip updating this item
                }

                // Always update the price in the DB so it reflects reality
                if (oldPrice !== newPrice) {
                    await supabase.from("items").update({ price: newPrice }).eq("id", item.id);
                }

                if (dropPercent > 1) {
                    console.log(`[PriceDrop] Drop: ${item.name} — Rs.${oldPrice} -> Rs.${newPrice} (${dropPercent.toFixed(1)}%)`);
                    summary.dropsFound++;

                    await supabase.from("price_history").insert({ item_id: item.id, old_price: oldPrice, new_price: newPrice });

                    const sent = await notifyUser(item.user_id, {
                        title: "Price Drop Alert!",
                        body: `${item.name} dropped from Rs.${Math.round(oldPrice).toLocaleString("en-IN")} to Rs.${Math.round(newPrice).toLocaleString("en-IN")} (${dropPercent.toFixed(1)}% off!)`,
                        url: `/product/${item.id}`,
                        icon: item.image || "/icon-192x192.png",
                        badge: "/icon-192x192.png",
                        tag: `price-drop-${item.id}`,
                    });
                    summary.notificationsSent += sent;
                }
            } catch (err) {
                console.warn(`[PriceDrop] Error checking item ${item.id}:`, err.message);
                summary.errors++;
            }
        });

        await runWithConcurrency(tasks, 2);
    } catch (err) {
        console.error("[PriceDrop] Job failed:", err.message);
        summary.errors++;
    }

    summary.finishedAt = new Date().toISOString();
    console.log(`[PriceDrop] Done. Checked: ${summary.itemsChecked}, Drops: ${summary.dropsFound}, Sent: ${summary.notificationsSent}`);
    await saveSummary(summary);
    return summary;
}

async function saveSummary(summary) {
    try {
        await supabase.from("app_settings").upsert([
            { key: "price_drop_last_run", value: summary.startedAt, updated_at: new Date().toISOString() },
            { key: "price_drop_last_summary", value: JSON.stringify(summary), updated_at: new Date().toISOString() },
        ], { onConflict: "key" });
    } catch (e) {
        console.warn("[PriceDrop] Failed to save summary:", e.message);
    }
}
