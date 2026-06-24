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

// The single AsyncStorage key where the array of logged items lives.
const LOGGED_ITEMS_KEY = "loggedItems";

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
// Used by a "reset day" button, or at midnight rollover later.
export async function clearLoggedItems(): Promise<void> {
    await AsyncStorage.removeItem(LOGGED_ITEMS_KEY);
}

// ── Calculate today's totals from the logged items ──
// Sums every item's macros into one DailyTotals object. This is what
// the dashboard displays instead of reading stored totals directly.
export async function getDailyTotals(): Promise<DailyTotals> {
    const items = await getLoggedItems();
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