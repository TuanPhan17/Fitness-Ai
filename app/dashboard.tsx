// dashboard.tsx
// =====================================================
// DASHBOARD — Your daily nutrition overview.
//
// Shows:
// - Calories remaining (big card with progress bar)
// - Protein, Fats, Carbs left (3 cards in a row)
// - Current weight
// - Log food button → navigates to log-food screen
//
// All data is loaded from AsyncStorage every time this
// screen comes into focus, so it's always up to date
// after logging food.
// =====================================================

// Import AsyncStorage to read saved user data (name, goals, weight)
import AsyncStorage from "@react-native-async-storage/async-storage";
// useFocusEffect runs code every time this screen comes into focus
// useRouter lets us navigate between screens
import { useFocusEffect, useRouter } from "expo-router";
// useCallback and useState are React hooks
import { useCallback, useState } from "react";
// Import all the UI components we need from React Native
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

// Import the storage helper. Daily totals (calories/protein/fats/carbs)
// are now CALCULATED by summing every logged food item, instead of being
// read from separate stored totals. This keeps the dashboard in sync with
// the log history automatically — delete a food and the totals drop.
//
// checkAndRolloverDay() handles the daily reset: if it's a new day, it
// archives yesterday's log and starts today fresh.
import {
    checkAndRolloverDay,
    clearLoggedItems,
    getDailyTotals
} from "../services/storage";

export default function Dashboard() {
    // Router lets us push to other screens like log-food
    const router = useRouter();

    // ── State variables ──
    // These hold the data that shows on screen
    const [name, setName] = useState("");              // User's name from onboarding
    const [calorieGoal, setCalorieGoal] = useState(0);      // Daily calorie goal
    const [proteinGoal, setProteinGoal] = useState(0);      // Daily protein goal
    const [caloriesLogged, setCaloriesLogged] = useState(0); // Calories logged today
    const [proteinLogged, setProteinLogged] = useState(0);   // Protein logged today
    const [fatsLogged, setFatsLogged] = useState(0);         // Fats logged today
    const [carbsLogged, setCarbsLogged] = useState(0);       // Carbs logged today
    const [currentWeight, setCurrentWeight] = useState("");   // User's current weight

    // ── Load all dashboard data ──
    // Pulled out as its own function so it can be called both on screen
    // focus AND after the user resets the day (to refresh the numbers).
    const loadData = useCallback(async () => {
        try {
            // First, check if a new day has begun. If so, this archives
            // yesterday's log and clears today so we start fresh.
            await checkAndRolloverDay();

            // Profile + goals still live as simple stored values.
            const n = await AsyncStorage.getItem("userName");
            const cg = await AsyncStorage.getItem("calorieGoal");
            const pg = await AsyncStorage.getItem("proteinGoal");
            const cw = await AsyncStorage.getItem("currentWeight");

            if (n) setName(n);
            if (cg) setCalorieGoal(parseInt(cg));
            if (pg) setProteinGoal(parseInt(pg));
            if (cw) setCurrentWeight(cw);

            // Today's logged macros are CALCULATED from the items array,
            // so they always match what's in the log history screen.
            const totals = await getDailyTotals();
            setCaloriesLogged(totals.calories);
            setProteinLogged(totals.protein);
            setFatsLogged(totals.fats);
            setCarbsLogged(totals.carbs);
        } catch (err) {
            console.error("Failed to load dashboard data:", err);
        }
    }, []);

    // ── Load data on every screen focus ──
    // useFocusEffect runs every time the dashboard screen is opened.
    // This makes sure the data is always fresh when you navigate back
    // from the log-food screen.
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    // ── Manually reset today's log ──
    // Clears every food logged today (after a confirm dialog), then
    // reloads the dashboard so the numbers drop back to zero. Useful when
    // you want a fresh start mid-day. Does NOT touch archived history.
    const handleResetDay = () => {
        Alert.alert(
            "Reset today's log?",
            "This clears all foods you've logged today. This can't be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reset",
                    style: "destructive",
                    onPress: async () => {
                        await clearLoggedItems();
                        loadData(); // Refresh — totals go back to zero
                    },
                },
            ]
        );
    };

    // ── Reset the entire app (profile + all data) ──
    // Wipes everything from storage and sends the user back to the very
    // start (the welcome/onboarding flow). This is how you re-run
    // onboarding or start completely fresh. Later this will live in a
    // proper Settings screen.
    const handleResetApp = () => {
        Alert.alert(
            "Reset everything?",
            "This erases your profile, goals, and all logged food. You'll start over from onboarding. This can't be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Erase & Restart",
                    style: "destructive",
                    onPress: async () => {
                        await AsyncStorage.clear();
                        // replace() so the dashboard isn't left in history
                        router.replace("/");
                    },
                },
            ]
        );
    };

    // ── Calculated values ──
    // How many calories and protein are left for the day
    const caloriesLeft = calorieGoal - caloriesLogged;
    const proteinLeft = proteinGoal - proteinLogged;

    // Calculate calorie progress percentage (capped at 100%)
    const calorieProgress =
        calorieGoal > 0
            ? Math.min((caloriesLogged / calorieGoal) * 100, 100)
            : 0;

    return (
        <ScrollView style={styles.container}>
            {/* ── Greeting ── */}
            <Text style={styles.greeting}>Let's get it, {name} 💪</Text>
            <Text style={styles.subtitle}>Here's your goal for today</Text>

            {/* ── Main calorie card ── */}
            <View style={styles.mainCard}>
                <Text style={styles.mainLabel}>CALORIES REMAINING</Text>

                {/* Big number showing calories left for the day */}
                <Text style={styles.mainValue}>{caloriesLeft}</Text>

                {/* Progress bar — fills orange as calories are logged */}
                <View style={styles.progressBarBackground}>
                    <View
                        style={[
                            styles.progressBarFill,
                            { width: `${calorieProgress}%` },
                        ]}
                    />
                </View>

                {/* Goal vs logged side by side */}
                <View style={styles.mainRow}>
                    <Text style={styles.mainSub}>Goal: {calorieGoal}</Text>
                    <Text style={styles.mainSub}>Logged: {caloriesLogged}</Text>
                </View>

                {/* Navigate to log food screen */}
                <TouchableOpacity
                    style={styles.logButton}
                    onPress={() => router.push("/log-food")}
                >
                    <Text style={styles.logButtonText}>+ LOG FOOD</Text>
                </TouchableOpacity>

                {/* Navigate to the log history screen to view/edit/delete entries */}
                <TouchableOpacity
                    style={styles.viewLogButton}
                    onPress={() => router.push("/log-history")}
                >
                    <Text style={styles.viewLogButtonText}>VIEW TODAY'S LOG</Text>
                </TouchableOpacity>

                {/* Navigate to the history screen to see past days */}
                <TouchableOpacity
                    style={styles.viewLogButton}
                    onPress={() => router.push("/history")}
                >
                    <Text style={styles.viewLogButtonText}>VIEW HISTORY</Text>
                </TouchableOpacity>
            </View>

            {/* ── Macro cards — Protein, Fats, Carbs ── */}
            {/* Three cards in a row showing each macro logged today */}
            <View style={styles.macroGrid}>
                {/* Protein card */}
                <View style={styles.macroCard}>
                    <Text style={[styles.macroLabel, { color: "#4A9EFF" }]}>PROTEIN</Text>
                    <Text style={styles.macroValue}>{proteinLogged}g</Text>
                    <Text style={styles.macroSub}>Goal: {proteinGoal}g</Text>
                </View>

                {/* Fats card */}
                <View style={styles.macroCard}>
                    <Text style={[styles.macroLabel, { color: "#FFB84D" }]}>FATS</Text>
                    <Text style={styles.macroValue}>{fatsLogged}g</Text>
                    <Text style={styles.macroSub}>logged</Text>
                </View>

                {/* Carbs card */}
                <View style={styles.macroCard}>
                    <Text style={[styles.macroLabel, { color: "#4DDB8F" }]}>CARBS</Text>
                    <Text style={styles.macroValue}>{carbsLogged}g</Text>
                    <Text style={styles.macroSub}>logged</Text>
                </View>
            </View>

            {/* ── Bottom row — Weight ── */}
            <View style={styles.grid}>
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>PROTEIN LEFT</Text>
                    <Text style={styles.cardValue}>{proteinLeft}g</Text>
                    <Text style={styles.cardSub}>of {proteinGoal}g goal</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardLabel}>CURRENT WEIGHT</Text>
                    <Text style={styles.cardValue}>{currentWeight}</Text>
                    <Text style={styles.cardSub}>lbs</Text>
                </View>
            </View>

            {/* ── Reset today's log ──
                A low-emphasis action at the bottom — clears today's foods
                after a confirm dialog. The daily rollover handles this
                automatically each new day, so this is just for a manual
                fresh start. */}
            <TouchableOpacity
                style={styles.resetButton}
                onPress={handleResetDay}
            >
                <Text style={styles.resetButtonText}>Reset Today's Log</Text>
            </TouchableOpacity>

            {/* Full reset — wipes profile + data and returns to onboarding.
                Useful for starting fresh or re-running onboarding. Will move
                into a Settings screen later. */}
            <TouchableOpacity
                style={styles.resetAppButton}
                onPress={handleResetApp}
            >
                <Text style={styles.resetAppButtonText}>Reset Everything</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

// ── Styles ──
// Same dark purple + orange theme as the rest of the app
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0f0c29",
        padding: 24,
    },
    greeting: {
        color: "#ffffff",
        fontSize: 26,
        fontWeight: "800",
        marginTop: 60,
    },
    subtitle: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 14,
        marginTop: 4,
        marginBottom: 24,
    },

    // ── Main calorie card ──
    mainCard: {
        backgroundColor: "rgba(255,107,53,0.1)",
        borderWidth: 1,
        borderColor: "rgba(255,107,53,0.3)",
        borderRadius: 20,
        padding: 24,
        marginBottom: 16,
    },
    mainLabel: {
        color: "#FF6B35",
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 2,
        marginBottom: 8,
    },
    mainValue: {
        color: "#ffffff",
        fontSize: 64,
        fontWeight: "900",
    },
    progressBarBackground: {
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 6,
        height: 8,
        marginBottom: 20,
    },
    progressBarFill: {
        backgroundColor: "#FF6B35",
        borderRadius: 6,
        height: 8,
    },
    mainRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 4,
        marginBottom: 20,
    },
    mainSub: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 13,
    },
    logButton: {
        backgroundColor: "#FF6B35",
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
    },
    logButtonText: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "800",
        letterSpacing: 2,
    },
    viewLogButton: {
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 10,
    },
    viewLogButtonText: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 2,
    },
    resetButton: {
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 8,
        marginBottom: 32,
    },
    resetButtonText: {
        color: "rgba(255,107,53,0.7)",
        fontSize: 14,
        fontWeight: "600",
    },
    resetAppButton: {
        paddingVertical: 12,
        alignItems: "center",
        marginBottom: 32,
    },
    resetAppButtonText: {
        color: "rgba(255,70,70,0.6)",
        fontSize: 13,
        fontWeight: "500",
    },

    // ── Macro cards row (Protein / Fats / Carbs) ──
    macroGrid: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 16,
    },
    macroCard: {
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 16,
        padding: 16,
        alignItems: "center",
    },
    macroLabel: {
        fontSize: 9,
        fontWeight: "700",
        letterSpacing: 2,
        marginBottom: 6,
    },
    macroValue: {
        color: "#ffffff",
        fontSize: 22,
        fontWeight: "800",
    },
    macroSub: {
        color: "rgba(255,255,255,0.3)",
        fontSize: 11,
        marginTop: 4,
    },

    // ── Bottom cards (Protein Left / Weight) ──
    grid: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 40,
    },
    card: {
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 20,
        padding: 20,
    },
    cardLabel: {
        color: "#FF6B35",
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 2,
        marginBottom: 8,
    },
    cardValue: {
        color: "#ffffff",
        fontSize: 32,
        fontWeight: "800",
    },
    cardSub: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 12,
        marginTop: 4,
    },
});
