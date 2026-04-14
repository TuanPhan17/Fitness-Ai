// services/nutrition.ts
// =====================================================
// NUTRITION SERVICE — The single source for all food data.
//
// Right now this searches the USDA FoodData Central API (free).
// When you're ready for Layer 2 (AI), you swap the internals
// of searchFood() to call your Claude API endpoint instead.
// Your screens never need to change — they just call searchFood().
//
// No extra npm packages needed — uses built-in fetch().
// =====================================================

// ── Your free USDA API key ──
// Get one in 30 seconds at: https://fdc.nal.usda.gov/api-key-signup/
// They email it to you instantly. Paste it below.
const USDA_API_KEY = "YOUR_USDA_API_KEY_HERE";

// Base URL for all USDA FoodData Central API requests
const USDA_BASE = "https://api.nal.usda.gov/fdc/v1";

// ── Types ──
// These define the shape of our data.
// When you swap to AI later, keep these same types so nothing breaks.

export interface NutritionItem {
    id: string;          // Unique food ID from USDA
    name: string;        // Human-readable food name
    brand?: string;      // Brand name (for packaged foods)
    servingSize: string; // e.g. "100g" or "1 cup"
    calories: number;    // Energy in kcal
    protein: number;     // Protein in grams
    fats: number;        // Total fat in grams
    carbs: number;       // Total carbohydrates in grams
}

// ── USDA Nutrient ID mapping ──
// The USDA API returns nutrients as an array with numeric IDs.
// These are the IDs for the 4 macros we care about.
const NUTRIENT_IDS = {
    calories: 1008, // Energy (kcal)
    protein: 1003,  // Protein (g)
    fats: 1004,     // Total lipid / fat (g)
    carbs: 1005,    // Carbohydrate, by difference (g)
};

// ── Helper: extract a nutrient value from the USDA nutrients array ──
// Finds the nutrient by its ID and returns the rounded value.
// Returns 0 if the nutrient isn't found (some foods have incomplete data).
function extractNutrient(nutrients: any[], nutrientId: number): number {
    const found = nutrients.find((n: any) => n.nutrientId === nutrientId);
    return found ? Math.round(found.value) : 0;
}

// ── Helper: format food names ──
// USDA stores food names in ALL CAPS like "CHICKEN BREAST, ROASTED"
// This converts them to Title Case for a better user experience.
function formatFoodName(name: string): string {
    return name
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase())
        .replace(/\bUht\b/gi, "UHT")  // Fix common acronyms
        .replace(/\bUsa\b/gi, "USA");
}

// ── Main search function ──
// Takes a search query string (e.g. "chicken breast")
// Returns an array of NutritionItem objects with macros.
//
// LAYER 2 UPGRADE: Replace the body of this function with
// a fetch() call to your backend that calls Claude's API.
// Keep the return type the same — your UI won't need to change.
export async function searchFood(query: string): Promise<NutritionItem[]> {
    // ── Input validation ──
    // Don't make API calls for empty or whitespace-only queries
    const trimmed = query.trim();
    if (!trimmed) return [];

    // Reject queries that are too short (likely typos or accidental input)
    if (trimmed.length < 2) return [];

    try {
        const response = await fetch(`${USDA_BASE}/foods/search?api_key=${USDA_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: trimmed,
                pageSize: 15,  // Limit results to 15 — enough to scroll, not overwhelming
                // Search across these USDA data types:
                // Foundation = basic whole foods (chicken, rice, etc.)
                // SR Legacy = the classic USDA nutrition database
                // Branded = packaged foods with brand names
                dataType: ["Foundation", "SR Legacy", "Branded"],
            }),
        });

        // Handle HTTP errors (bad API key, rate limit, server issues)
        if (!response.ok) {
            console.error(`USDA API error: ${response.status}`);
            return [];
        }

        const data = await response.json();

        // If no foods matched the search, return empty array
        if (!data.foods || data.foods.length === 0) return [];

        // Transform each USDA food object into our clean NutritionItem shape
        return data.foods.map((food: any) => ({
            id: String(food.fdcId),
            name: formatFoodName(food.description),
            brand: food.brandName || food.brandOwner || undefined,
            servingSize: food.servingSize
                ? `${food.servingSize}${food.servingSizeUnit || "g"}`
                : "100g", // Default to 100g if no serving size provided
            calories: extractNutrient(food.foodNutrients, NUTRIENT_IDS.calories),
            protein: extractNutrient(food.foodNutrients, NUTRIENT_IDS.protein),
            fats: extractNutrient(food.foodNutrients, NUTRIENT_IDS.fats),
            carbs: extractNutrient(food.foodNutrients, NUTRIENT_IDS.carbs),
        }));
    } catch (error) {
        // Network errors, JSON parse failures, etc.
        console.error("Food search failed:", error);
        return [];
    }
}