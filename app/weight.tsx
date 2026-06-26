// weight.tsx
// =====================================================
// WEIGHT — Track your weigh-ins and progress over time.
//
// The top tells your progress story: where you started, where you are,
// and how far from your goal — with a progress bar showing how much of
// the journey is done. Below that, log a new weigh-in and browse the
// full history, with the change between each measurement.
//
// This is the "outcome" half of the app: food logging tracks what goes
// in, weight tracking shows the result.
// =====================================================

import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

import {
    addWeighIn,
    deleteWeighIn,
    getWeighIns,
    getWeightProgress,
    type WeighIn,
    type WeightProgress
} from "../services/storage";

export default function Weight() {
    const router = useRouter();

    // Progress summary (starting / current / goal) shown at the top.
    const [progress, setProgress] = useState<WeightProgress | null>(null);
    // Every weigh-in, newest first for the list.
    const [weighIns, setWeighIns] = useState<WeighIn[]>([]);

    // Log-weigh-in modal state.
    const [modalOpen, setModalOpen] = useState(false);
    const [newWeight, setNewWeight] = useState("");
    const [error, setError] = useState("");

    // ── Load progress + history on focus ──
    const loadData = useCallback(async () => {
        const prog = await getWeightProgress();
        const entries = await getWeighIns();
        setProgress(prog);
        // Newest first for display.
        setWeighIns([...entries].reverse());
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    // ── Save a new weigh-in ──
    const handleSave = async () => {
        const w = parseFloat(newWeight);
        if (!newWeight || isNaN(w) || w < 50 || w > 700) {
            setError("Enter a valid weight (50–700 lbs).");
            return;
        }
        await addWeighIn(w);
        setNewWeight("");
        setError("");
        setModalOpen(false);
        loadData();
    };

    // ── Delete a weigh-in (with confirm) ──
    const handleDelete = (entry: WeighIn) => {
        Alert.alert(
            "Delete weigh-in?",
            `Remove the ${entry.weight} lbs entry?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await deleteWeighIn(entry.id);
                        loadData();
                    },
                },
            ]
        );
    };

    // ── Format "YYYY-MM-DD" → "Jun 26" ──
    const formatDate = (dateStr: string): string => {
        try {
            const d = new Date(`${dateStr}T00:00:00`);
            return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        } catch {
            return dateStr;
        }
    };

    // ── Progress bar fill: how far from start toward goal ──
    const progressPct = (() => {
        if (!progress || progress.starting === null || progress.goal === null || progress.current === null) {
            return 0;
        }
        const totalToLose = progress.starting - progress.goal;
        if (totalToLose <= 0) return 0; // Goal is at/above start — avoid divide issues
        const lostSoFar = progress.starting - progress.current;
        return Math.max(0, Math.min((lostSoFar / totalToLose) * 100, 100));
    })();

    // Whether the user has lost weight overall (drives arrow + color).
    const lost = progress ? progress.changeFromStart < 0 : false;
    const changeAbs = progress ? Math.abs(progress.changeFromStart) : 0;

    // ── Render one weigh-in row ──
    const renderEntry = ({ item, index }: { item: WeighIn; index: number }) => {
        // weighIns is newest-first, so the "previous" measurement is the
        // NEXT item in the array. Change = this − previous.
        const prev = weighIns[index + 1];
        const change = prev ? item.weight - prev.weight : 0;
        const arrow = change < 0 ? "▼" : change > 0 ? "▲" : "—";
        const changeColor = change < 0 ? "#4DDB8F" : change > 0 ? "#FF6B6B" : "rgba(255,255,255,0.3)";

        return (
            <View style={styles.entryRow}>
                <Text style={styles.entryDate}>{formatDate(item.date)}</Text>
                <Text style={styles.entryWeight}>{item.weight} lbs</Text>
                <Text style={[styles.entryChange, { color: changeColor }]}>
                    {arrow} {change !== 0 ? Math.abs(change) : ""}
                </Text>
                <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={10}>
                    <Text style={styles.entryDelete}>✕</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* ── Header ── */}
            <Text style={styles.title}>Weight</Text>
            <Text style={styles.subtitle}>Track your progress</Text>

            {/* ── Progress story card ── */}
            <View style={styles.progressCard}>
                <View style={styles.progressTop}>
                    <View style={styles.progressStat}>
                        <Text style={styles.progressValue}>
                            {progress?.starting ?? "—"}
                        </Text>
                        <Text style={styles.progressLabel}>START</Text>
                    </View>
                    <View style={styles.progressStatCenter}>
                        <Text style={styles.progressCurrentValue}>
                            {progress?.current ?? "—"}
                        </Text>
                        <Text style={styles.progressLabel}>NOW</Text>
                    </View>
                    <View style={styles.progressStat}>
                        <Text style={styles.progressValue}>
                            {progress?.goal ?? "—"}
                        </Text>
                        <Text style={styles.progressLabel}>GOAL</Text>
                    </View>
                </View>

                {/* Progress bar from start → goal */}
                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
                </View>

                {/* Change + distance-to-goal summary line */}
                <View style={styles.progressSummary}>
                    <Text style={[styles.changeText, { color: lost ? "#4DDB8F" : "rgba(255,255,255,0.6)" }]}>
                        {lost ? "▼" : ""} {changeAbs > 0 ? `${changeAbs} lbs` : "No change yet"}
                        {lost ? " lost" : ""}
                    </Text>
                    {progress?.goal != null && progress?.current != null && (
                        <Text style={styles.toGoalText}>
                            {Math.abs(progress.toGoal)} lbs to goal
                        </Text>
                    )}
                </View>
            </View>

            {/* ── Log weigh-in button ── */}
            <TouchableOpacity
                style={styles.logButton}
                onPress={() => { setNewWeight(""); setError(""); setModalOpen(true); }}
                activeOpacity={0.85}
            >
                <Text style={styles.logButtonText}>+ LOG WEIGH-IN</Text>
            </TouchableOpacity>

            {/* ── History list ── */}
            <Text style={styles.historyTitle}>HISTORY</Text>
            {weighIns.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No weigh-ins yet</Text>
                    <Text style={styles.emptyHint}>
                        Log your first weigh-in to start tracking progress.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={weighIns}
                    renderItem={renderEntry}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    style={styles.list}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}

            {/* ── Back ── */}
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backText}>← Back to Dashboard</Text>
            </TouchableOpacity>

            {/* ── Log weigh-in modal ── */}
            <Modal
                visible={modalOpen}
                transparent
                animationType="slide"
                onRequestClose={() => setModalOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Log Weigh-In</Text>
                        {error !== "" && (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}
                        <Text style={styles.inputLabel}>WEIGHT (lbs)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 184"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            keyboardType="numeric"
                            value={newWeight}
                            onChangeText={(t) => { setNewWeight(t); setError(""); }}
                            maxLength={3}
                            autoFocus
                        />
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>SAVE</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setModalOpen(false)}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

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
        fontWeight: "900",
        marginBottom: 4,
    },
    subtitle: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 15,
        marginBottom: 24,
    },

    // Progress card
    progressCard: {
        backgroundColor: "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        borderRadius: 24,
        padding: 24,
    },
    progressTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        marginBottom: 20,
    },
    progressStat: {
        alignItems: "center",
    },
    progressStatCenter: {
        alignItems: "center",
    },
    progressValue: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 26,
        fontWeight: "800",
    },
    progressCurrentValue: {
        color: "#FF6B35",
        fontSize: 44,
        fontWeight: "900",
    },
    progressLabel: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 2,
        marginTop: 4,
    },
    progressTrack: {
        height: 10,
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 5,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#FF6B35",
        borderRadius: 5,
    },
    progressSummary: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 14,
    },
    changeText: {
        fontSize: 15,
        fontWeight: "700",
    },
    toGoalText: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 15,
        fontWeight: "600",
    },

    // Log button
    logButton: {
        backgroundColor: "#FF6B35",
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: "center",
        marginTop: 20,
        shadowColor: "#FF6B35",
        shadowOpacity: 0.4,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
    },
    logButtonText: {
        color: "#ffffff",
        fontSize: 15,
        fontWeight: "900",
        letterSpacing: 2,
    },

    // History
    historyTitle: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 3,
        marginTop: 28,
        marginBottom: 12,
    },
    list: {
        flex: 1,
    },
    entryRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginBottom: 10,
    },
    entryDate: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 14,
        fontWeight: "600",
        width: 60,
    },
    entryWeight: {
        color: "#ffffff",
        fontSize: 17,
        fontWeight: "800",
        flex: 1,
    },
    entryChange: {
        fontSize: 14,
        fontWeight: "700",
        width: 50,
        textAlign: "right",
    },
    entryDelete: {
        color: "rgba(255,255,255,0.3)",
        fontSize: 16,
        fontWeight: "700",
        marginLeft: 16,
    },

    // Empty state
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

    // Back
    backButton: {
        paddingVertical: 14,
        alignItems: "center",
    },
    backText: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 15,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "flex-end",
    },
    modalCard: {
        backgroundColor: "#1a1640",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalTitle: {
        color: "#ffffff",
        fontSize: 22,
        fontWeight: "800",
        marginBottom: 16,
    },
    inputLabel: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 1,
        marginBottom: 8,
    },
    input: {
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        borderRadius: 12,
        padding: 16,
        color: "#ffffff",
        fontSize: 18,
        marginBottom: 16,
    },
    saveButton: {
        backgroundColor: "#FF6B35",
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: "center",
    },
    saveButtonText: {
        color: "#ffffff",
        fontSize: 15,
        fontWeight: "800",
        letterSpacing: 1.5,
    },
    cancelButton: {
        paddingVertical: 12,
        alignItems: "center",
        marginTop: 4,
    },
    cancelText: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 15,
    },
    errorBox: {
        backgroundColor: "rgba(255,70,70,0.12)",
        borderWidth: 1,
        borderColor: "rgba(255,70,70,0.3)",
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    errorText: {
        color: "#FF6B6B",
        fontSize: 14,
        textAlign: "center",
    },
});
