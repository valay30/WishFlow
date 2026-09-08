import cron from "node-cron";
import { runPriceDrop } from "./priceDropJob.js";
import { supabase } from "../config/supabase.js";

// Default: 1:00 AM IST = 19:30 UTC
const DEFAULT_CRON = "30 19 * * *";

let currentTask = null;
let currentExpression = DEFAULT_CRON;
let schedulerEnabled = true;  // persisted: loaded from DB at boot

async function loadScheduleFromDb() {
    try {
        const { data } = await supabase
            .from("app_settings")
            .select("value")
            .eq("key", "price_drop_cron")
            .single();
        if (data?.value && cron.validate(data.value)) {
            return data.value;
        }
    } catch (e) {
        console.warn("[Scheduler] Could not load cron from DB, using default:", e.message);
    }
    return DEFAULT_CRON;
}

export function reschedule(newExpression) {
    if (!cron.validate(newExpression)) {
        throw new Error(`Invalid cron expression: "${newExpression}"`);
    }
    if (currentTask) {
        currentTask.stop();
        currentTask = null;
    }
    currentExpression = newExpression;
    currentTask = cron.schedule(newExpression, async () => {
        if (!schedulerEnabled) {
            console.log('[Scheduler] Job skipped — scheduler is paused.');
            return;
        }
        console.log(`[Scheduler] Running price drop job (schedule: ${newExpression})`);
        await runPriceDrop();
    }, { timezone: 'UTC' });
    console.log(`[Scheduler] Price drop job scheduled: "${newExpression}" (enabled: ${schedulerEnabled})`);
}

export function pauseScheduler() {
    schedulerEnabled = false;
    console.log('[Scheduler] Paused — job will be skipped at next trigger.');
}

export function resumeScheduler() {
    schedulerEnabled = true;
    console.log('[Scheduler] Resumed — job will run at next trigger.');
}

export function isSchedulerEnabled() {
    return schedulerEnabled;
}

export function getCurrentSchedule() {
    return currentExpression;
}

export async function initScheduler() {
    const expression = await loadScheduleFromDb();
    // Load enabled state from DB
    try {
        const { data } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'price_drop_enabled')
            .single();
        if (data?.value === 'false') schedulerEnabled = false;
    } catch { }
    reschedule(expression);
}
