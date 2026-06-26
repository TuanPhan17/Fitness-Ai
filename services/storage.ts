// services/storage.ts
// =====================================================
// STORAGE SERVICE — The single source of truth for logged food.
//
// Before this, the app only stored daily TOTALS (caloriesLogged,
// proteinLogged, etc). That meant you could never see, edit, or
// delete individual foods — just the combined numbers.
//
// Now we store an ARRAY of every food item logged today. Totals
// are calculated by summing that array. This unlocks:
//   - A log history screen (show every food eaten)
//   - Editing a logged item (change quantity, fix a mistake)
//   - Deleting a logged item (undo a log)
//   - Layer 2 AI input (parse a meal → push multiple items)
//
// Every screen reads/writes through these functions, so the
// storage shape lives in ONE place. If you ever change how data
// is stored, you only change it here.
// =====================================================

import AsyncStorage from "@react-native-async-storage/async-storage";

// ── The shape of one logged food item ──
// This is what gets saved for every food the user logs.
export interface LoggedItem {
    id: string;        // Unique ID for this log entry (so we can edit/delete it)
    name: string;      // Food name, e.g. "Chicken Breast"
    brand?: string;    // Optional brand name for packaged foods
    calories: number;  // Calories for this entry
    protein: number;   // Protein in grams
    fats: number;      // Fats in grams
    carbs: number;     // Carbs in grams
    loggedAt: number;  // Timestamp (ms) of when it was logged — used for sorting
}

// ── The shape of the day's running totals ──
// Calculated by summing all LoggedItems. Screens use this for display.
export interface DailyTotals {
    calories: number;
    protein: number;
    fats: number;
    carbs: number;
}

// ── The shape of one archived day ──
// When a new day begins, the previous day's items are rolled into one
// of these and stored in history. This powers future "progress over
// time" features (weekly trends, streaks, etc.) and means a day's data
// is never silently thrown away.
export interface DayLog {
    date: string;          // The day this log belongs to, as "YYYY-MM-DD"
    items: LoggedItem[];   // Every food logged that day
    totals: DailyTotals;   // Pre-computed totals for that day
}

// ── AsyncStorage keys ──
// Keeping every key in one place avoids typos and makes the storage
// shape easy to see at a glance.
const LOGGED_ITEMS_KEY = "loggedItems";   // Today's array of LoggedItem
const CURRENT_DATE_KEY = "currentLogDate"; // The "YYYY-MM-DD" today's log belongs to
const HISTORY_KEY = "dayHistory";          // Array of archived DayLog objects
const WEIGH_INS_KEY = "weighIns";          // Array of WeighIn entries over time

// ── Get today's date as a "YYYY-MM-DD" string ──
// We compare DATES (not timestamps) to decide if a new day has begun.
// Using local time means the day rolls over at the user's midnight, not UTC.
function getTodayKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// ── Generate a unique ID for a new log entry ──
// Combines the current time with a random suffix so two foods logged
// in the same millisecond still get different IDs.
function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Read every logged item from storage ──
// Returns an empty array if nothing has been logged yet (or on error),
// so callers never have to handle null.
export async function getLoggedItems(): Promise<LoggedItem[]> {
    try {
        const raw = await AsyncStorage.getItem(LOGGED_ITEMS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        // Defensive check — if storage somehow holds bad data, don't crash.
        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        console.error("Failed to read logged items:", err);
        return [];
    }
}

// ── Add a new food to today's log ──
// Takes the food details (without an id/timestamp — we generate those),
// appends it to the stored array, and saves. Returns the created item.
export async function addLoggedItem(
    food: Omit<LoggedItem, "id" | "loggedAt">
): Promise<LoggedItem> {
    // Make sure today's log is stamped with today's date. This covers the
    // case where the very first food is logged before any rollover check.
    const storedDate = await AsyncStorage.getItem(CURRENT_DATE_KEY);
    if (!storedDate) {
        await AsyncStorage.setItem(CURRENT_DATE_KEY, getTodayKey());
    }

    const items = await getLoggedItems();

    // Build the full entry with a generated id + timestamp.
    const newItem: LoggedItem = {
        ...food,
        id: generateId(),
        loggedAt: Date.now(),
    };

    items.push(newItem);
    await AsyncStorage.setItem(LOGGED_ITEMS_KEY, JSON.stringify(items));
    return newItem;
}

// ── Delete a logged item by its id ──
// Filters the array to remove the matching entry, then saves.
export async function deleteLoggedItem(id: string): Promise<void> {
    const items = await getLoggedItems();
    const filtered = items.filter((item) => item.id !== id);
    await AsyncStorage.setItem(LOGGED_ITEMS_KEY, JSON.stringify(filtered));
}

// ── Update a logged item by its id ──
// Merges the given fields into the matching entry. Used when the user
// edits a food (e.g. changes calories or macro values).
export async function updateLoggedItem(
    id: string,
    updates: Partial<Omit<LoggedItem, "id" | "loggedAt">>
): Promise<void> {
    const items = await getLoggedItems();
    const updated = items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
    );
    await AsyncStorage.setItem(LOGGED_ITEMS_KEY, JSON.stringify(updated));
}

// ── Clear the entire day's log ──
// Used by the manual "reset day" button. Wipes today's items but does
// NOT touch archived history.
export async function clearLoggedItems(): Promise<void> {
    await AsyncStorage.removeItem(LOGGED_ITEMS_KEY);
    // Re-stamp the current date so a fresh start still belongs to today.
    await AsyncStorage.setItem(CURRENT_DATE_KEY, getTodayKey());
}

// ── Read the archived day history ──
// Returns every past day that's been rolled over, newest handling left
// to the caller. Empty array if there's no history yet.
export async function getDayHistory(): Promise<DayLog[]> {
    try {
        const raw = await AsyncStorage.getItem(HISTORY_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        console.error("Failed to read day history:", err);
        return [];
    }
}

// ── Archive a day's items into history ──
// Internal helper. Wraps the items in a DayLog (with date + totals) and
// prepends it to the stored history array (newest first).
async function archiveDay(date: string, items: LoggedItem[]): Promise<void> {
    // Nothing logged that day? Don't clutter history with an empty entry.
    if (items.length === 0) return;

    const history = await getDayHistory();
    const dayLog: DayLog = {
        date,
        items,
        totals: calculateTotals(items),
    };

    // Newest day first so a future history screen reads top-to-bottom.
    history.unshift(dayLog);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// ── Check for a new day and roll over if needed ──
// THIS IS THE HEART OF THE DAILY RESET.
//
// Call this once when the app loads (and when the dashboard refocuses).
// It compares the date stamped on today's log to the real today:
//
//   • First ever launch  → just stamp today's date, nothing to archive.
//   • Still the same day  → do nothing, keep the current log.
//   • A NEW day has begun → archive yesterday's items into history,
//                           clear the live log, stamp the new date.
//
// Returns true if a rollover happened (useful if a screen wants to react).
export async function checkAndRolloverDay(): Promise<boolean> {
    const today = getTodayKey();
    const storedDate = await AsyncStorage.getItem(CURRENT_DATE_KEY);

    // First launch ever — no date stored yet. Stamp today and stop.
    if (!storedDate) {
        await AsyncStorage.setItem(CURRENT_DATE_KEY, today);
        return false;
    }

    // Same day — nothing to do.
    if (storedDate === today) {
        return false;
    }

    // It's a new day. Archive the old day's items, then clear for today.
    const yesterdayItems = await getLoggedItems();
    await archiveDay(storedDate, yesterdayItems);

    await AsyncStorage.removeItem(LOGGED_ITEMS_KEY);
    await AsyncStorage.setItem(CURRENT_DATE_KEY, today);
    return true;
}

// ── Calculate totals from any array of logged items ──
// Pure helper (no storage access) so it can be reused — both for today's
// totals and for pre-computing an archived day's totals during rollover.
export function calculateTotals(items: LoggedItem[]): DailyTotals {
    return items.reduce<DailyTotals>(
        (totals, item) => ({
            calories: totals.calories + item.calories,
            protein: totals.protein + item.protein,
            fats: totals.fats + item.fats,
            carbs: totals.carbs + item.carbs,
        }),
        { calories: 0, protein: 0, fats: 0, carbs: 0 }
    );
}

// ── Calculate today's totals from the logged items ──
// Sums every item's macros into one DailyTotals object. This is what
// the dashboard displays instead of reading stored totals directly.
export async function getDailyTotals(): Promise<DailyTotals> {
    const items = await getLoggedItems();
    return calculateTotals(items);
}

// =====================================================
// WEIGHT TRACKING
//
// Each weigh-in is stored as its own entry with a date, so the app can
// show progress over time (starting → current → goal) and a history of
// every measurement. Same array-based pattern as the food log.
// =====================================================

// ── The shape of one weigh-in ──
export interface WeighIn {
    id: string;       // Unique id (so we can delete a specific entry)
    weight: number;   // Body weight in lbs
    date: string;     // "YYYY-MM-DD" the weigh-in was recorded
    loggedAt: number; // Timestamp (ms) for precise sorting
}

// ── Read every weigh-in (oldest → newest by time) ──
// Returns an empty array if none recorded yet (or on error).
export async function getWeighIns(): Promise<WeighIn[]> {
    try {
        const raw = await AsyncStorage.getItem(WEIGH_INS_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        // Always hand back in chronological order so callers don't have to.
        return parsed.sort((a, b) => a.loggedAt - b.loggedAt);
    } catch (err) {
        console.error("Failed to read weigh-ins:", err);
        return [];
    }
}

// ── Add a new weigh-in ──
// Saves the weight stamped with today's date + a timestamp. Also mirrors
// the value into "currentWeight" so the dashboard's weight card and any
// other screen reading that key stay in sync with the latest measurement.
export async function addWeighIn(weight: number): Promise<WeighIn> {
    const entries = await getWeighIns();

    const newEntry: WeighIn = {
        id: generateId(),
        weight,
        date: getTodayKey(),
        loggedAt: Date.now(),
    };

    entries.push(newEntry);
    await AsyncStorage.setItem(WEIGH_INS_KEY, JSON.stringify(entries));
    // Keep the simple "currentWeight" value pointing at the latest weigh-in.
    await AsyncStorage.setItem("currentWeight", weight.toString());
    return newEntry;
}

// ── Delete a weigh-in by id ──
// After deleting, re-point "currentWeight" at whatever the newest
// remaining weigh-in is (or leave it if none remain).
export async function deleteWeighIn(id: string): Promise<void> {
    const entries = await getWeighIns();
    const filtered = entries.filter((e) => e.id !== id);
    await AsyncStorage.setItem(WEIGH_INS_KEY, JSON.stringify(filtered));

    // Keep currentWeight accurate after a deletion.
    if (filtered.length > 0) {
        const latest = filtered[filtered.length - 1];
        await AsyncStorage.setItem("currentWeight", latest.weight.toString());
    }
}

// ── The shape of a weight progress summary ──
export interface WeightProgress {
    starting: number | null;  // First recorded weight (or onboarding weight)
    current: number | null;   // Most recent weigh-in
    goal: number | null;      // Goal weight from onboarding
    changeFromStart: number;  // current − starting (negative = lost weight)
    toGoal: number;           // current − goal (how far left)
}

// ── Build a progress summary for the weight screen + dashboard ──
// "Starting" prefers the earliest weigh-in; if there are none yet, it
// falls back to the weight entered during onboarding so the very first
// view still shows something meaningful.
export async function getWeightProgress(): Promise<WeightProgress> {
    const entries = await getWeighIns();

    const onboardingWeightRaw = await AsyncStorage.getItem("currentWeight");
    const goalRaw = await AsyncStorage.getItem("goalWeight");

    const goal = goalRaw ? parseFloat(goalRaw) : null;

    // Starting weight: earliest weigh-in, else the onboarding value.
    let starting: number | null = null;
    let current: number | null = null;

    if (entries.length > 0) {
        starting = entries[0].weight;
        current = entries[entries.length - 1].weight;
    } else if (onboardingWeightRaw) {
        // No weigh-ins yet — use onboarding weight as both start + current.
        starting = parseFloat(onboardingWeightRaw);
        current = parseFloat(onboardingWeightRaw);
    }

    const changeFromStart =
        starting !== null && current !== null ? current - starting : 0;
    const toGoal =
        current !== null && goal !== null ? current - goal : 0;

    return { starting, current, goal, changeFromStart, toGoal };
}