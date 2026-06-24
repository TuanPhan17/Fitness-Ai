// log-history.tsx
// =====================================================
// LOG HISTORY — See everything you've logged today.
//
// This is the screen that makes the item-based storage pay off.
// It reads the array of logged foods and shows each one as a card.
//
// On each card you can:
//   - DELETE the food (removes it, dashboard totals drop)
//   - EDIT the food (opens a modal to change its macro values)
//
// Because the dashboard calculates totals by summing these items,
// any delete or edit here is reflected on the dashboard the moment
// you navigate back to it.
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

// All reads/writes go through the storage helper — same source of
// truth the dashboard and log-food screen use.
import {
    deleteLoggedItem,
    getLoggedItems,
    updateLoggedItem,
    type LoggedItem
} from "../services/storage";

export default function LogHistory() {
    const router = useRouter();

    // The list of foods logged today.
    const [items, setItems] = useState<LoggedItem[]>([]);

    // ── Edit modal state ──
    // Which item is being edited (null = modal closed), plus the working
    // copies of its macro values while the user types.
    const [editing, setEditing] = useState<LoggedItem | null>(null);
    const [editName, setEditName] = useState("");
    const [editCalories, setEditCalories] = useState("");
    const [editProtein, setEditProtein] = useState("");
    const [editFats, setEditFats] = useState("");
    const [editCarbs, setEditCarbs] = useState("");
    const [editError, setEditError] = useState("");

    // ── Load logged items whenever this screen comes into focus ──
    // Newest items show first (sorted by timestamp descending).
    const loadItems = useCallback(async () => {
        const stored = await getLoggedItems();
        const sorted = [...stored].sort((a, b) => b.loggedAt - a.loggedAt);
        setItems(sorted);
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadItems();
        }, [loadItems])
    );

    // ── Delete a food (with a confirm dialog) ──
    // Destructive actions always confirm first, so a mis-tap doesn't
    // silently wipe an entry.
    const handleDelete = (item: LoggedItem) => {
        Alert.alert(
            "Delete this food?",
            `Remove "${item.name}" from today's log?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await deleteLoggedItem(item.id);
                        loadItems(); // Refresh the list after deleting
                    },
                },
            ]
        );
    };

    // ── Open the edit modal for a food ──
    // Copies the item's current values into the working edit fields.
    const handleOpenEdit = (item: LoggedItem) => {
        setEditing(item);
        setEditName(item.name);
        setEditCalories(String(item.calories));
        setEditProtein(String(item.protein));
        setEditFats(String(item.fats));
        setEditCarbs(String(item.carbs));
        setEditError("");
    };

    // ── Save the edited food ──
    // Validates the inputs, writes the update, refreshes, closes the modal.
    const handleSaveEdit = async () => {
        if (!editing) return;

        // Name can't be blank.
        if (!editName.trim()) {
            setEditError("Food name can't be empty.");
            return;
        }

        // Parse the macro fields, treating blanks as 0.
        const cals = parseInt(editCalories || "0");
        const pro = parseInt(editProtein || "0");
        const fat = parseInt(editFats || "0");
        const carb = parseInt(editCarbs || "0");

        // Reject anything that isn't a valid, non-negative number.
        if ([cals, pro, fat, carb].some((n) => isNaN(n) || n < 0)) {
            setEditError("Macros must be valid, non-negative numbers.");
            return;
        }

        await updateLoggedItem(editing.id, {
            name: editName.trim(),
            calories: cals,
            protein: pro,
            fats: fat,
            carbs: carb,
        });

        setEditing(null); // Close the modal
        loadItems();      // Refresh the list with updated values
    };

    // ── Render one logged food card ──
    const renderItem = ({ item }: { item: LoggedItem }) => (
        <View style={styles.card}>
            {/* Top row: name/brand on the left, calories on the right */}
            <View style={styles.cardHeader}>
                <View style={styles.cardTitleWrap}>
                    <Text style={styles.cardName} numberOfLines={1}>
                        {item.name}
                    </Text>
                    {item.brand && (
                        <Text style={styles.cardBrand} numberOfLines={1}>
                            {item.brand}
                        </Text>
                    )}
                </View>
                <Text style={styles.cardCalories}>{item.calories} cal</Text>
            </View>

            {/* Macro row */}
            <View style={styles.macroRow}>
                <Text style={[styles.macro, { color: "#4A9EFF" }]}>
                    {item.protein}g protein
                </Text>
                <Text style={[styles.macro, { color: "#FFB84D" }]}>
                    {item.fats}g fat
                </Text>
                <Text style={[styles.macro, { color: "#4DDB8F" }]}>
                    {item.carbs}g carbs
                </Text>
            </View>

            {/* Action buttons: Edit + Delete */}
            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleOpenEdit(item)}
                >
                    <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(item)}
                >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* ── Header ── */}
            <Text style={styles.title}>Today's Log</Text>
            <Text style={styles.subtitle}>
                {items.length === 0
                    ? "Nothing logged yet"
                    : `${items.length} ${items.length === 1 ? "item" : "items"} logged`}
            </Text>

            {/* ── Empty state ── */}
            {items.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No foods logged today</Text>
                    <Text style={styles.emptyHint}>
                        Tap below to log your first meal
                    </Text>
                    <TouchableOpacity
                        style={styles.logButton}
                        onPress={() => router.push("/log-food")}
                    >
                        <Text style={styles.logButtonText}>+ LOG FOOD</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                // ── The list of logged foods ──
                <FlatList
                    data={items}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
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

            {/* ══════════════════════════════════════════════
          EDIT MODAL — opens when the user taps "Edit"
          ══════════════════════════════════════════════ */}
            <Modal
                visible={editing !== null}
                transparent
                animationType="slide"
                onRequestClose={() => setEditing(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Edit Food</Text>

                        {/* Validation error inside the modal */}
                        {editError !== "" && (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>{editError}</Text>
                            </View>
                        )}

                        {/* Name */}
                        <Text style={styles.inputLabel}>Name</Text>
                        <TextInput
                            style={styles.input}
                            value={editName}
                            onChangeText={(t) => { setEditName(t); setEditError(""); }}
                            placeholder="Food name"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                        />

                        {/* Calories */}
                        <Text style={styles.inputLabel}>Calories</Text>
                        <TextInput
                            style={styles.input}
                            value={editCalories}
                            onChangeText={(t) => { setEditCalories(t); setEditError(""); }}
                            keyboardType="numeric"
                            placeholder="0"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                        />

                        {/* Macros row — three inputs side by side */}
                        <View style={styles.macroInputRow}>
                            <View style={styles.macroInputCol}>
                                <Text style={styles.inputLabel}>Protein (g)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editProtein}
                                    onChangeText={(t) => { setEditProtein(t); setEditError(""); }}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                />
                            </View>
                            <View style={styles.macroInputCol}>
                                <Text style={styles.inputLabel}>Fats (g)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editFats}
                                    onChangeText={(t) => { setEditFats(t); setEditError(""); }}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                />
                            </View>
                            <View style={styles.macroInputCol}>
                                <Text style={styles.inputLabel}>Carbs (g)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editCarbs}
                                    onChangeText={(t) => { setEditCarbs(t); setEditError(""); }}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                />
                            </View>
                        </View>

                        {/* Save + Cancel */}
                        <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
                            <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => setEditing(null)}
                        >
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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

    // ── Logged food card ──
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
    cardTitleWrap: {
        flex: 1,
        marginRight: 12,
    },
    cardName: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "700",
    },
    cardBrand: {
        color: "rgba(255,255,255,0.35)",
        fontSize: 13,
        marginTop: 2,
    },
    cardCalories: {
        color: "#FF6B35",
        fontSize: 16,
        fontWeight: "800",
    },
    macroRow: {
        flexDirection: "row",
        gap: 14,
        marginTop: 10,
    },
    macro: {
        fontSize: 13,
        fontWeight: "600",
    },

    // ── Action buttons ──
    actionRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 14,
    },
    editButton: {
        flex: 1,
        backgroundColor: "rgba(255,107,53,0.12)",
        borderWidth: 1,
        borderColor: "rgba(255,107,53,0.3)",
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: "center",
    },
    editButtonText: {
        color: "#FF6B35",
        fontSize: 14,
        fontWeight: "700",
    },
    deleteButton: {
        flex: 1,
        backgroundColor: "rgba(255,70,70,0.1)",
        borderWidth: 1,
        borderColor: "rgba(255,70,70,0.25)",
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: "center",
    },
    deleteButtonText: {
        color: "#FF6B6B",
        fontSize: 14,
        fontWeight: "700",
    },

    // ── Empty state ──
    emptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    emptyText: {
        color: "rgba(255,255,255,0.5)",
        fontSize: 17,
        fontWeight: "600",
    },
    emptyHint: {
        color: "rgba(255,255,255,0.25)",
        fontSize: 14,
        marginTop: 6,
        marginBottom: 24,
    },
    logButton: {
        backgroundColor: "#FF6B35",
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
    },
    logButtonText: {
        color: "#ffffff",
        fontSize: 14,
        fontWeight: "800",
        letterSpacing: 2,
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

    // ── Edit modal ──
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
        fontWeight: "600",
        marginBottom: 6,
        marginTop: 4,
    },
    input: {
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        borderRadius: 12,
        padding: 14,
        color: "#ffffff",
        fontSize: 16,
        marginBottom: 12,
    },
    macroInputRow: {
        flexDirection: "row",
        gap: 8,
    },
    macroInputCol: {
        flex: 1,
    },
    saveButton: {
        backgroundColor: "#FF6B35",
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: "center",
        marginTop: 8,
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

    // ── Error box (inside modal) ──
    errorBox: {
        backgroundColor: "rgba(255,70,70,0.15)",
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
