// dashboard.tsx
// =====================================================
// DASHBOARD — Your daily nutrition command center.
//
// The hero is a large calorie ring: the single commanding element that
// shows, at a glance, how much fuel is left in the day. Everything else
// (macros, weight, actions) stays quiet and disciplined around it.
//
// All data is loaded from AsyncStorage every time this screen comes into
// focus, so it's always fresh after logging food. Daily totals are summed
// from individual logged items (see services/storage.ts), and a new day
// automatically rolls the previous day into history.
// =====================================================

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
// Svg powers the calorie progress ring (clean stroke-based arc).
import Svg, { Circle } from "react-native-svg";

import {
    checkAndRolloverDay,
    clearLoggedItems,
    getDailyTotals,
    getWeightProgress
} from "../services/storage";

// =====================================================
// CalorieRing — the hero element.
//
// A circular progress ring drawn with SVG. A background track circle sits
// under an orange progress arc. The arc length is controlled by
// strokeDasharray/strokeDashoffset: as more calories are logged, the
// orange sweeps clockwise from the top. Rounded caps keep it premium.
// =====================================================
function CalorieRing({
    progress,    // 0–100, how much of the goal is logged
    centerValue, // big number in the middle (calories left)
    centerLabel, // small label under the number
}: {
    progress: number;
    centerValue: number;
    centerLabel: string;
}) {
    const size = 240;        // Overall ring diameter
    const stroke = 18;       // Ring band thickness
    const r = (size - stroke) / 2;        // Radius (inset by half the stroke)
    const circumference = 2 * Math.PI * r;
    const clamped = Math.max(0, Math.min(progress, 100));
    // How much of the circle to "hide" — the remainder shows as orange.
    const dashOffset = circumference - (clamped / 100) * circumference;

    return (
        <View style={[ringStyles.wrap, { width: size, height: size }]}>
            <Svg width={size} height={size}>
                {/* Track — faint full ring */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    stroke="rgba(255,255,255,0.07)"
                    strokeWidth={stroke}
                    fill="none"
                />
                {/* Progress arc — sweeps from the top (rotated -90°) */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    stroke="#FF6B35"
                    strokeWidth={stroke}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
            </Svg>

            {/* Center content — absolutely centered over the ring */}
            <View style={ringStyles.center}>
                <Text style={ringStyles.centerValue}>{centerValue}</Text>
                <Text style={ringStyles.centerLabel}>{centerLabel}</Text>
            </View>
        </View>
    );
}

// ── A single macro progress bar (protein / fats / carbs) ──
function MacroBar({
    label,
    logged,
    goal,
    color,
}: {
    label: string;
    logged: number;
    goal: number;
    color: string;
}) {
    // If there's a goal, show progress against it; otherwise just show logged.
    const pct = goal > 0 ? Math.min((logged / goal) * 100, 100) : 0;

    return (
        <View style={styles.macroBarRow}>
            <View style={styles.macroBarHeader}>
                <Text style={styles.macroBarLabel}>{label}</Text>
                <Text style={styles.macroBarValue}>
                    <Text style={{ color }}>{logged}g</Text>
                    {goal > 0 ? (
                        <Text style={styles.macroBarGoal}> / {goal}g</Text>
                    ) : null}
                </Text>
            </View>
            <View style={styles.macroBarTrack}>
                <View
                    style={[
                        styles.macroBarFill,
                        { width: `${goal > 0 ? pct : 100}%`, backgroundColor: color },
                    ]}
                />
            </View>
        </View>
    );
}

export default function Dashboard() {
    const router = useRouter();

    // ── State ──
    const [name, setName] = useState("");
    const [calorieGoal, setCalorieGoal] = useState(0);
    const [proteinGoal, setProteinGoal] = useState(0);
    const [caloriesLogged, setCaloriesLogged] = useState(0);
    const [proteinLogged, setProteinLogged] = useState(0);
    const [fatsLogged, setFatsLogged] = useState(0);
    const [carbsLogged, setCarbsLogged] = useState(0);
    const [currentWeight, setCurrentWeight] = useState("");
    // How much weight has changed since the start (negative = lost). Shown
    // as a small progress note on the weight card.
    const [weightChange, setWeightChange] = useState(0);

    // ── Load all dashboard data ──
    const loadData = useCallback(async () => {
        try {
            // If a new day began, archive yesterday + start fresh.
            await checkAndRolloverDay();

            const n = await AsyncStorage.getItem("userName");
            const cg = await AsyncStorage.getItem("calorieGoal");
            const pg = await AsyncStorage.getItem("proteinGoal");

            if (n) setName(n);
            if (cg) setCalorieGoal(parseInt(cg));
            if (pg) setProteinGoal(parseInt(pg));

            // Weight: pull the progress summary so the card shows the latest
            // weigh-in plus how much has changed since the start.
            const wp = await getWeightProgress();
            if (wp.current !== null) setCurrentWeight(String(wp.current));
            setWeightChange(wp.changeFromStart);

            // Totals are summed from logged items, so they always match
            // the log history.
            const totals = await getDailyTotals();
            setCaloriesLogged(totals.calories);
            setProteinLogged(totals.protein);
            setFatsLogged(totals.fats);
            setCarbsLogged(totals.carbs);
        } catch (err) {
            console.error("Failed to load dashboard data:", err);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    // ── Manually reset today's log ──
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
                        loadData();
                    },
                },
            ]
        );
    };

    // ── Reset the entire app (profile + all data) → back to onboarding ──
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
                        router.replace("/");
                    },
                },
            ]
        );
    };

    // ── Derived values ──
    const caloriesLeft = calorieGoal - caloriesLogged;
    const calorieProgress =
        calorieGoal > 0 ? Math.min((caloriesLogged / calorieGoal) * 100, 100) : 0;
    // Whether the user has gone over their goal (drives the "over" message).
    const isOver = caloriesLeft < 0;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
        >
            {/* ── Header ── */}
            <View style={styles.header}>
                <Text style={styles.eyebrow}>TODAY</Text>
                <Text style={styles.greeting}>
                    Let's get it, {name || "champ"}.
                </Text>
            </View>

            {/* ── Hero: calorie ring ── */}
            <View style={styles.heroCard}>
                <CalorieRing
                    progress={calorieProgress}
                    centerValue={Math.abs(caloriesLeft)}
                    centerLabel={isOver ? "CALORIES OVER" : "CALORIES LEFT"}
                />

                {/* Goal vs logged, sitting under the ring */}
                <View style={styles.heroStatsRow}>
                    <View style={styles.heroStat}>
                        <Text style={styles.heroStatValue}>{calorieGoal}</Text>
                        <Text style={styles.heroStatLabel}>GOAL</Text>
                    </View>
                    <View style={styles.heroDivider} />
                    <View style={styles.heroStat}>
                        <Text style={styles.heroStatValue}>{caloriesLogged}</Text>
                        <Text style={styles.heroStatLabel}>LOGGED</Text>
                    </View>
                </View>

                {/* Primary action */}
                <TouchableOpacity
                    style={styles.logButton}
                    onPress={() => router.push("/log-food")}
                    activeOpacity={0.85}
                >
                    <Text style={styles.logButtonText}>+ LOG FOOD</Text>
                </TouchableOpacity>
            </View>

            {/* ── Macros ── */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>MACROS</Text>
                <View style={styles.macroCard}>
                    <MacroBar
                        label="Protein"
                        logged={proteinLogged}
                        goal={proteinGoal}
                        color="#4A9EFF"
                    />
                    <MacroBar
                        label="Fats"
                        logged={fatsLogged}
                        goal={0}
                        color="#FFB84D"
                    />
                    <MacroBar
                        label="Carbs"
                        logged={carbsLogged}
                        goal={0}
                        color="#4DDB8F"
                    />
                </View>
            </View>

            {/* ── Weight + quick links ── */}
            <View style={styles.section}>
                <View style={styles.dualRow}>
                    <TouchableOpacity
                        style={styles.weightCard}
                        onPress={() => router.push("/weight")}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.weightValue}>{currentWeight || "—"}</Text>
                        <Text style={styles.weightLabel}>LBS</Text>
                        {weightChange !== 0 && (
                            <Text
                                style={[
                                    styles.weightChange,
                                    { color: weightChange < 0 ? "#4DDB8F" : "#FF6B6B" },
                                ]}
                            >
                                {weightChange < 0 ? "▼" : "▲"} {Math.abs(weightChange)} lbs
                            </Text>
                        )}
                    </TouchableOpacity>
                    <View style={styles.linkColumn}>
                        <TouchableOpacity
                            style={styles.linkButton}
                            onPress={() => router.push("/log-history")}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.linkButtonText}>Today's Log</Text>
                            <Text style={styles.linkChevron}>›</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.linkButton}
                            onPress={() => router.push("/history")}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.linkButtonText}>History</Text>
                            <Text style={styles.linkChevron}>›</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* ── Low-emphasis utilities ── */}
            <TouchableOpacity style={styles.resetButton} onPress={handleResetDay}>
                <Text style={styles.resetButtonText}>Reset Today's Log</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetAppButton} onPress={handleResetApp}>
                <Text style={styles.resetAppButtonText}>Reset Everything</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

// ── Ring styles ──
const ringStyles = StyleSheet.create({
    wrap: {
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
    },
    center: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: "center",
        justifyContent: "center",
    },
    centerValue: {
        color: "#ffffff",
        fontSize: 60,
        fontWeight: "900",
        letterSpacing: -2,
    },
    centerLabel: {
        color: "rgba(255,255,255,0.45)",
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 3,
        marginTop: 2,
    },
});

// ── Screen styles ──
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0f0c29",
    },

    // Header
    header: {
        paddingHorizontal: 24,
        paddingTop: 64,
        marginBottom: 20,
    },
    eyebrow: {
        color: "#FF6B35",
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 4,
        marginBottom: 6,
    },
    greeting: {
        color: "#ffffff",
        fontSize: 30,
        fontWeight: "900",
        letterSpacing: -0.5,
    },

    // Hero card
    heroCard: {
        marginHorizontal: 20,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        borderRadius: 28,
        paddingVertical: 32,
        paddingHorizontal: 24,
        alignItems: "center",
    },
    heroStatsRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 28,
        marginBottom: 24,
    },
    heroStat: {
        alignItems: "center",
        paddingHorizontal: 28,
    },
    heroStatValue: {
        color: "#ffffff",
        fontSize: 24,
        fontWeight: "800",
    },
    heroStatLabel: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 2,
        marginTop: 4,
    },
    heroDivider: {
        width: 1,
        height: 36,
        backgroundColor: "rgba(255,255,255,0.1)",
    },
    logButton: {
        backgroundColor: "#FF6B35",
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: "center",
        alignSelf: "stretch",
        // A soft orange glow to make the CTA feel energetic.
        shadowColor: "#FF6B35",
        shadowOpacity: 0.5,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
    },
    logButtonText: {
        color: "#ffffff",
        fontSize: 15,
        fontWeight: "900",
        letterSpacing: 2,
    },

    // Sections
    section: {
        marginTop: 28,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 3,
        marginBottom: 14,
    },

    // Macro card
    macroCard: {
        backgroundColor: "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: 20,
    },
    macroBarRow: {
        marginBottom: 18,
    },
    macroBarHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    macroBarLabel: {
        color: "#ffffff",
        fontSize: 15,
        fontWeight: "700",
    },
    macroBarValue: {
        fontSize: 14,
        fontWeight: "700",
    },
    macroBarGoal: {
        color: "rgba(255,255,255,0.35)",
        fontWeight: "600",
    },
    macroBarTrack: {
        height: 8,
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 4,
        overflow: "hidden",
    },
    macroBarFill: {
        height: "100%",
        borderRadius: 4,
    },

    // Weight + links
    dualRow: {
        flexDirection: "row",
        gap: 12,
    },
    weightCard: {
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    weightValue: {
        color: "#ffffff",
        fontSize: 36,
        fontWeight: "900",
    },
    weightLabel: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 2,
        marginTop: 2,
    },
    weightChange: {
        fontSize: 13,
        fontWeight: "800",
        marginTop: 6,
    },
    linkColumn: {
        flex: 1,
        gap: 12,
    },
    linkButton: {
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        borderRadius: 16,
        paddingHorizontal: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    linkButtonText: {
        color: "#ffffff",
        fontSize: 15,
        fontWeight: "700",
    },
    linkChevron: {
        color: "#FF6B35",
        fontSize: 22,
        fontWeight: "700",
    },

    // Utilities
    resetButton: {
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 24,
    },
    resetButtonText: {
        color: "rgba(255,107,53,0.7)",
        fontSize: 14,
        fontWeight: "600",
    },
    resetAppButton: {
        paddingVertical: 8,
        alignItems: "center",
    },
    resetAppButtonText: {
        color: "rgba(255,70,70,0.55)",
        fontSize: 13,
        fontWeight: "500",
    },
});
