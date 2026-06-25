// history.tsx
// =====================================================
// HISTORY — Your past days of logging.
//
// When a new day begins, the dashboard's rollover archives the
// previous day into storage (see checkAndRolloverDay in storage.ts).
// This screen reads that archive and shows each past day as a card:
//
//   • A summary row: the date + that day's total calories.
//   • Tap a card to EXPAND it and see every food logged that day,
//     plus the full macro breakdown.
//
// This is what turns FitnessAI from a "today only" tracker into
// something that shows progress over time.
// =====================================================

import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

import { getDayHistory, type DayLog } from "../services/storage";

export default function History() {
    const router = useRouter();

    // The list of archived past days (newest first).
    const [days, setDays] = useState<DayLog[]>([]);

    // Which day card is currently expanded (by date string). Only one
    // is open at a time; null means all are collapsed.
    const [expandedDate, setExpandedDate] = useState<string | null>(null);

    // ── Load history whenever the screen comes into focus ──
    const loadHistory = useCallback(async () => {
        const history = await getDayHistory();
        setDays(history);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadHistory();
        }, [loadHistory])
    );

    // ── Toggle a day card open/closed ──
    // Tapping the open card closes it; tapping a closed one opens it
    // (and closes whatever was open before).
    const toggleExpand = (date: string) => {
        setExpandedDate((current) => (current === date ? null : date));
    };

    // ── Format a "YYYY-MM-DD" string into something friendly ──
    // e.g. "2026-06-24" → "Tue, Jun 24, 2026". Falls back to the raw
    // string if parsing ever fails.
    const formatDate = (dateStr: string): string => {
        try {
            // Append time so it's parsed in local time, not UTC midnight.
            const d = new Date(`${dateStr}T00:00:00`);
            return d.toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
            });
        } catch {
            return dateStr;
        }
    };

    // ── Render one day card ──
    const renderDay = ({ item: day }: { item: DayLog }) => {
        const isExpanded = expandedDate === day.date;

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => toggleExpand(day.date)}
                activeOpacity={0.8}
            >
                {/* Summary row — always visible */}
                <View style={styles.cardHeader}>
                    <View>
                        <Text style={styles.cardDate}>{formatDate(day.date)}</Text>
                        <Text style={styles.cardItemCount}>
                            {day.items.length}{" "}
                            {day.items.length === 1 ? "item" : "items"} logged
                        </Text>
                    </View>
                    <View style={styles.cardSummaryRight}>
                        <Text style={styles.cardCalories}>
                            {day.totals.calories}
                        </Text>
                        <Text style={styles.cardCaloriesLabel}>cal</Text>
                    </View>
                </View>

                {/* Macro summary chips — always visible */}
                <View style={styles.macroChips}>
                    <Text style={[styles.chip, { color: "#4A9EFF" }]}>
                        {day.totals.protein}g protein
                    </Text>
                    <Text style={[styles.chip, { color: "#FFB84D" }]}>
                        {day.totals.fats}g fat
                    </Text>
                    <Text style={[styles.chip, { color: "#4DDB8F" }]}>
                        {day.totals.carbs}g carbs
                    </Text>
                </View>

                {/* Expanded section — the individual foods for that day */}
                {isExpanded && (
                    <View style={styles.expandedSection}>
                        <View style={styles.divider} />
                        {day.items.map((food) => (
                            <View key={food.id} style={styles.foodRow}>
                                <View style={styles.foodRowLeft}>
                                    <Text style={styles.foodName} numberOfLines={1}>
                                        {food.name}
                                    </Text>
                                    {food.brand ? (
                                        <Text style={styles.foodBrand} numberOfLines={1}>
                                            {food.brand}
                                        </Text>
                                    ) : null}
                                </View>
                                <Text style={styles.foodCalories}>
                                    {food.calories} cal
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* A subtle hint that the card is tappable */}
                <Text style={styles.expandHint}>
                    {isExpanded ? "▲ Tap to collapse" : "▼ Tap to see foods"}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* ── Header ── */}
            <Text style={styles.title}>History</Text>
            <Text style={styles.subtitle}>
                {days.length === 0
                    ? "No past days yet"
                    : `${days.length} ${days.length === 1 ? "day" : "days"} tracked`}
            </Text>

            {/* ── Empty state ── */}
            {days.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No history yet</Text>
                    <Text style={styles.emptyHint}>
                        Your past days will appear here automatically once you've
                        logged food and a new day begins.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={days}
                    renderItem={renderDay}
                    keyExtractor={(day) => day.date}
                    showsVerticalScrollIndicator={false}
                    style={styles.list}
                    contentContainerStyle={{ paddingBottom: 24 }}
                />
            )}

            {/* ── Back button ── */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
            >
                <Text style={styles.backText}>← Back to Dashboard</Text>
            </TouchableOpacity>
        </View>
    );
}

// ── Styles ──
// Same dark purple (#0f0c29) + orange (#FF6B35) theme as the rest of the app.
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
        marginBottom: 4,
    },
    subtitle: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 15,
        marginBottom: 20,
    },
    list: {
        flex: 1,
    },

    // ── Day card ──
    card: {
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    cardDate: {
        color: "#ffffff",
        fontSize: 17,
        fontWeight: "700",
    },
    cardItemCount: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 13,
        marginTop: 2,
    },
    cardSummaryRight: {
        alignItems: "flex-end",
    },
    cardCalories: {
        color: "#FF6B35",
        fontSize: 22,
        fontWeight: "800",
    },
    cardCaloriesLabel: {
        color: "rgba(255,107,53,0.6)",
        fontSize: 12,
        fontWeight: "600",
        marginTop: -2,
    },

    // ── Macro chips ──
    macroChips: {
        flexDirection: "row",
        gap: 14,
        marginTop: 12,
    },
    chip: {
        fontSize: 13,
        fontWeight: "600",
    },

    // ── Expanded section ──
    expandedSection: {
        marginTop: 4,
    },
    divider: {
        height: 1,
        backgroundColor: "rgba(255,255,255,0.1)",
        marginVertical: 14,
    },
    foodRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
    },
    foodRowLeft: {
        flex: 1,
        marginRight: 12,
    },
    foodName: {
        color: "rgba(255,255,255,0.9)",
        fontSize: 15,
        fontWeight: "600",
    },
    foodBrand: {
        color: "rgba(255,255,255,0.35)",
        fontSize: 12,
        marginTop: 1,
    },
    foodCalories: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 14,
        fontWeight: "600",
    },

    // ── Expand hint ──
    expandHint: {
        color: "rgba(255,255,255,0.3)",
        fontSize: 12,
        textAlign: "center",
        marginTop: 12,
    },

    // ── Empty state ──
    emptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
    },
    emptyText: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 17,
        fontWeight: "600",
    },
    emptyHint: {
        color: "rgba(255,255,255,0.25)",
        fontSize: 14,
        marginTop: 8,
        textAlign: "center",
        lineHeight: 20,
    },

    // ── Back button ──
    backButton: {
        paddingVertical: 14,
        alignItems: "center",
    },
    backText: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 15,
    },
});
