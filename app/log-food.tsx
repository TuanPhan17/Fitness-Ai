// log-food.tsx
// =====================================================
// LOG FOOD SCREEN — Now with USDA food search!
//
// Two ways to log food:
// 1. SEARCH MODE (default) — Type a food name, see results from
//    the USDA database with real nutrition data, tap to log.
// 2. MANUAL MODE — Toggle to manual entry if the food isn't
//    in the database (or user just wants to type numbers).
//
// All data saved to AsyncStorage so dashboard picks it up.
// Matches the existing dark purple + orange theme.
// =====================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

// Import our USDA search service
// Make sure to create: services/nutrition.ts (included in this project)
import { searchFood, type NutritionItem } from "../services/nutrition";

export default function LogFood() {
    const router = useRouter();

    // ── State ──

    // Controls which mode the user is in: "search" or "manual"
    const [mode, setMode] = useState<"search" | "manual">("search");

    // Search mode state
    const [query, setQuery] = useState("");                        // What the user typed in search
    const [results, setResults] = useState<NutritionItem[]>([]);   // Search results from USDA
    const [loading, setLoading] = useState(false);                 // Shows spinner while searching
    const [hasSearched, setHasSearched] = useState(false);         // Tracks if user has searched yet
    const [successMessage, setSuccessMessage] = useState("");      // "Logged!" confirmation message

    // Manual mode state
    const [food, setFood] = useState("");       // Food name (manual entry)
    const [calories, setCalories] = useState(""); // Calories (manual entry)
    const [protein, setProtein] = useState("");   // Protein in grams (manual entry)
    const [fats, setFats] = useState("");         // Fat in grams (manual entry)
    const [carbs, setCarbs] = useState("");       // Carbs in grams (manual entry)

    // Validation error message — shown when user tries to submit invalid data
    const [error, setError] = useState("");

    // ── Debounce timer ref ──
    // We use a ref (not state) because we don't want re-renders when the timer changes.
    // This prevents spamming the USDA API on every keystroke — waits 400ms after
    // the user stops typing before actually searching.
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Search handler with debounce ──
    // Called every time the search input text changes.
    // Clears the previous timer and sets a new one.
    const handleSearchChange = useCallback((text: string) => {
        setQuery(text);
        setError(""); // Clear any previous errors

        // Clear the old timer so we don't fire stale searches
        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        // If input is empty, clear results immediately (no API call needed)
        if (!text.trim()) {
            setResults([]);
            setHasSearched(false);
            return;
        }

        // Wait 400ms after user stops typing, then search
        debounceTimer.current = setTimeout(async () => {
            setLoading(true);
            const foods = await searchFood(text);
            setResults(foods);
            setHasSearched(true);
            setLoading(false);
        }, 400);
    }, []);

    // ── Log a food item from search results ──
    // When user taps a search result, add its macros to daily totals.
    const handleLogFromSearch = async (item: NutritionItem) => {
        try {
            // Read current totals from storage (default to "0" if nothing saved yet)
            const prevCalories = await AsyncStorage.getItem("caloriesLogged");
            const prevProtein = await AsyncStorage.getItem("proteinLogged");
            const prevFats = await AsyncStorage.getItem("fatsLogged");
            const prevCarbs = await AsyncStorage.getItem("carbsLogged");

            // Add the selected food's macros to the running totals
            const newCalories = (parseInt(prevCalories || "0") + item.calories).toString();
            const newProtein = (parseInt(prevProtein || "0") + item.protein).toString();
            const newFats = (parseInt(prevFats || "0") + item.fats).toString();
            const newCarbs = (parseInt(prevCarbs || "0") + item.carbs).toString();

            // Save updated totals back to storage
            await AsyncStorage.setItem("caloriesLogged", newCalories);
            await AsyncStorage.setItem("proteinLogged", newProtein);
            await AsyncStorage.setItem("fatsLogged", newFats);
            await AsyncStorage.setItem("carbsLogged", newCarbs);

            // Show success feedback — briefly flash "Logged!" on the tapped item
            setSuccessMessage(item.id);
            setTimeout(() => setSuccessMessage(""), 1500);
        } catch (err) {
            console.error("Failed to log food:", err);
            setError("Something went wrong saving. Try again.");
        }
    };

    // ── Log from manual entry ──
    // Validates all fields, then saves to AsyncStorage.
    const handleLogManual = async () => {
        // Clear previous errors
        setError("");

        // ── Input validation ──
        // Check that the food name isn't empty
        if (!food.trim()) {
            setError("Enter a food name.");
            return;
        }

        // Check that calories is a valid positive number
        const calNum = parseInt(calories);
        if (!calories || isNaN(calNum) || calNum < 0) {
            setError("Enter a valid calorie amount.");
            return;
        }

        // Check that protein is a valid number (0 is OK — some foods have no protein)
        const proNum = parseInt(protein || "0");
        if (isNaN(proNum) || proNum < 0) {
            setError("Enter a valid protein amount.");
            return;
        }

        // Validate fats
        const fatNum = parseInt(fats || "0");
        if (isNaN(fatNum) || fatNum < 0) {
            setError("Enter a valid fat amount.");
            return;
        }

        // Validate carbs
        const carbNum = parseInt(carbs || "0");
        if (isNaN(carbNum) || carbNum < 0) {
            setError("Enter a valid carb amount.");
            return;
        }

        // Sanity check — calories shouldn't be unreasonably high for a single food
        if (calNum > 5000) {
            setError("That seems like a lot of calories for one food. Double-check?");
            return;
        }

        try {
            // Read current totals and add the new values
            const prevCalories = await AsyncStorage.getItem("caloriesLogged");
            const prevProtein = await AsyncStorage.getItem("proteinLogged");
            const prevFats = await AsyncStorage.getItem("fatsLogged");
            const prevCarbs = await AsyncStorage.getItem("carbsLogged");

            await AsyncStorage.setItem(
                "caloriesLogged",
                (parseInt(prevCalories || "0") + calNum).toString()
            );
            await AsyncStorage.setItem(
                "proteinLogged",
                (parseInt(prevProtein || "0") + proNum).toString()
            );
            await AsyncStorage.setItem(
                "fatsLogged",
                (parseInt(prevFats || "0") + fatNum).toString()
            );
            await AsyncStorage.setItem(
                "carbsLogged",
                (parseInt(prevCarbs || "0") + carbNum).toString()
            );

            // Navigate back to dashboard — it will reload with updated numbers
            router.back();
        } catch (err) {
            console.error("Failed to log food:", err);
            setError("Something went wrong saving. Try again.");
        }
    };

    // ── Render a single search result card ──
    // Each card shows the food name, brand (if any), and all 4 macros.
    // Tapping it logs the food immediately.
    const renderResult = ({ item }: { item: NutritionItem }) => {
        // Check if this item was just logged (for the success flash)
        const justLogged = successMessage === item.id;

        return (
            <TouchableOpacity
                style={[styles.resultCard, justLogged && styles.resultCardLogged]}
                onPress={() => handleLogFromSearch(item)}
                activeOpacity={0.7}
            >
                {/* Food name and brand */}
                <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
                {item.brand && (
                    <Text style={styles.resultBrand} numberOfLines={1}>{item.brand}</Text>
                )}

                {/* Macro pills row — shows all 4 macros at a glance */}
                <View style={styles.macroRow}>
                    <View style={styles.macroPill}>
                        <Text style={[styles.macroValue, { color: "#FF6B35" }]}>{item.calories}</Text>
                        <Text style={styles.macroUnit}>cal</Text>
                    </View>
                    <View style={styles.macroPill}>
                        <Text style={[styles.macroValue, { color: "#4A9EFF" }]}>{item.protein}g</Text>
                        <Text style={styles.macroUnit}>protein</Text>
                    </View>
                    <View style={styles.macroPill}>
                        <Text style={[styles.macroValue, { color: "#FFB84D" }]}>{item.fats}g</Text>
                        <Text style={styles.macroUnit}>fat</Text>
                    </View>
                    <View style={styles.macroPill}>
                        <Text style={[styles.macroValue, { color: "#4DDB8F" }]}>{item.carbs}g</Text>
                        <Text style={styles.macroUnit}>carbs</Text>
                    </View>
                </View>

                {/* Serving size + tap hint */}
                <View style={styles.resultFooter}>
                    <Text style={styles.servingText}>per {item.servingSize}</Text>
                    {justLogged ? (
                        <Text style={styles.loggedText}>✓ Logged!</Text>
                    ) : (
                        <Text style={styles.tapHint}>Tap to log</Text>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            {/* ── Header ── */}
            <Text style={styles.title}>Log Food</Text>
            <Text style={styles.subtitle}>What did you eat?</Text>

            {/* ── Mode toggle — Search vs Manual ── */}
            <View style={styles.toggleRow}>
                <TouchableOpacity
                    style={[styles.toggleButton, mode === "search" && styles.toggleActive]}
                    onPress={() => { setMode("search"); setError(""); }}
                >
                    <Text style={[styles.toggleText, mode === "search" && styles.toggleTextActive]}>
                        Search
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.toggleButton, mode === "manual" && styles.toggleActive]}
                    onPress={() => { setMode("manual"); setError(""); }}
                >
                    <Text style={[styles.toggleText, mode === "manual" && styles.toggleTextActive]}>
                        Manual
                    </Text>
                </TouchableOpacity>
            </View>

            {/* ── Error message (shown for both modes) ── */}
            {error !== "" && (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            )}

            {/* ══════════════════════════════════════════════
          SEARCH MODE — Type to search USDA database
          ══════════════════════════════════════════════ */}
            {mode === "search" && (
                <View style={styles.searchContainer}>
                    {/* Search input */}
                    <TextInput
                        style={styles.input}
                        placeholder="Search foods... (e.g. chicken breast)"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={query}
                        onChangeText={handleSearchChange}
                        autoFocus
                        returnKeyType="search"
                    />

                    {/* Loading spinner while API call is in flight */}
                    {loading && (
                        <ActivityIndicator
                            size="large"
                            color="#FF6B35"
                            style={styles.loader}
                        />
                    )}

                    {/* Search results list */}
                    {!loading && results.length > 0 && (
                        <FlatList
                            data={results}
                            renderItem={renderResult}
                            keyExtractor={(item) => item.id}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                            style={styles.resultsList}
                        />
                    )}

                    {/* Empty state — shown after a search returns nothing */}
                    {!loading && hasSearched && results.length === 0 && (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>No results for "{query}"</Text>
                            <Text style={styles.emptyHint}>
                                Try a simpler term, or switch to Manual entry
                            </Text>
                        </View>
                    )}

                    {/* Initial state — shown before user searches anything */}
                    {!loading && !hasSearched && (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>Search the USDA database</Text>
                            <Text style={styles.emptyHint}>
                                Try "eggs", "oatmeal", or "greek yogurt"
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {/* ══════════════════════════════════════════════
          MANUAL MODE — Type calories/protein/fats/carbs by hand
          ══════════════════════════════════════════════ */}
            {mode === "manual" && (
                <View>
                    {/* Food name input */}
                    <TextInput
                        style={styles.input}
                        placeholder="Food name (e.g. 2 eggs and rice)"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={food}
                        onChangeText={(text) => { setFood(text); setError(""); }}
                    />

                    {/* Calories input — numeric keyboard */}
                    <TextInput
                        style={styles.input}
                        placeholder="Calories"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        keyboardType="numeric"
                        value={calories}
                        onChangeText={(text) => { setCalories(text); setError(""); }}
                    />

                    {/* Protein input */}
                    <TextInput
                        style={styles.input}
                        placeholder="Protein (g)"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        keyboardType="numeric"
                        value={protein}
                        onChangeText={(text) => { setProtein(text); setError(""); }}
                    />

                    {/* Fats input */}
                    <TextInput
                        style={styles.input}
                        placeholder="Fats (g)"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        keyboardType="numeric"
                        value={fats}
                        onChangeText={(text) => { setFats(text); setError(""); }}
                    />

                    {/* Carbs input */}
                    <TextInput
                        style={styles.input}
                        placeholder="Carbs (g)"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        keyboardType="numeric"
                        value={carbs}
                        onChangeText={(text) => { setCarbs(text); setError(""); }}
                    />

                    {/* Submit button */}
                    <TouchableOpacity style={styles.button} onPress={handleLogManual}>
                        <Text style={styles.buttonText}>LOG IT →</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* ── Cancel button — goes back without saving ── */}
            <TouchableOpacity
                onPress={() => router.back()}
                style={styles.cancelButton}
            >
                <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
}

// ── Styles ──
// Matches the existing dark purple (#0f0c29) + orange (#FF6B35) theme.
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0f0c29",
        padding: 24,
        paddingTop: 60,
    },
    title: {
        color: "#ffffff",
        fontSize: 32,
        fontWeight: "800",
        marginBottom: 8,
    },
    subtitle: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 15,
        marginBottom: 20,
    },

    // ── Mode toggle (Search / Manual) ──
    toggleRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 20,
    },
    toggleButton: {
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: "center",
    },
    toggleActive: {
        borderColor: "#FF6B35",
        backgroundColor: "rgba(255,107,53,0.1)",
    },
    toggleText: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 14,
        fontWeight: "600",
    },
    toggleTextActive: {
        color: "#FF6B35",
    },

    // ── Error box ──
    errorBox: {
        backgroundColor: "rgba(255,70,70,0.15)",
        borderWidth: 1,
        borderColor: "rgba(255,70,70,0.3)",
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
    },
    errorText: {
        color: "#FF6B6B",
        fontSize: 14,
        textAlign: "center",
    },

    // ── Inputs ──
    input: {
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        borderRadius: 12,
        padding: 16,
        color: "#ffffff",
        fontSize: 16,
        marginBottom: 16,
    },

    // ── Search mode ──
    searchContainer: {
        flex: 1,
    },
    loader: {
        marginTop: 32,
    },
    resultsList: {
        marginTop: 8,
    },

    // ── Search result cards ──
    resultCard: {
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
    },
    resultCardLogged: {
        // Green flash when a food is successfully logged
        borderColor: "#4DDB8F",
        backgroundColor: "rgba(77,219,143,0.1)",
    },
    resultName: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "600",
    },
    resultBrand: {
        color: "rgba(255,255,255,0.35)",
        fontSize: 13,
        marginTop: 2,
    },
    macroRow: {
        flexDirection: "row",
        gap: 8,
        marginTop: 12,
    },
    macroPill: {
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 10,
        paddingVertical: 8,
        alignItems: "center",
    },
    macroValue: {
        fontSize: 15,
        fontWeight: "700",
    },
    macroUnit: {
        fontSize: 10,
        color: "rgba(255,255,255,0.3)",
        marginTop: 2,
    },
    resultFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 10,
    },
    servingText: {
        color: "rgba(255,255,255,0.25)",
        fontSize: 12,
    },
    tapHint: {
        color: "rgba(255,107,53,0.6)",
        fontSize: 12,
        fontWeight: "600",
    },
    loggedText: {
        color: "#4DDB8F",
        fontSize: 12,
        fontWeight: "700",
    },

    // ── Empty states ──
    emptyState: {
        alignItems: "center",
        marginTop: 48,
    },
    emptyText: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 16,
        textAlign: "center",
    },
    emptyHint: {
        color: "rgba(255,255,255,0.25)",
        fontSize: 14,
        textAlign: "center",
        marginTop: 6,
    },

    // ── Buttons ──
    button: {
        backgroundColor: "#FF6B35",
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: "center",
        marginTop: 8,
        marginBottom: 16,
    },
    buttonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "800",
        letterSpacing: 2,
    },
    cancelButton: {
        paddingVertical: 12,
        alignItems: "center",
    },
    cancel: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 15,
        textAlign: "center",
    },
});
