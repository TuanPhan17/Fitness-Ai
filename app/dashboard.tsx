import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

export default function Dashboard() {
    const [name, setName] = useState("");
    const [calorieGoal, setCalorieGoal] = useState(0);
    const [proteinGoal, setProteinGoal] = useState(0);
    const [caloriesLogged, setCaloriesLogged] = useState(0);
    const [proteinLogged, setProteinLogged] = useState(0);
    const [steps, setSteps] = useState(0);
    const [workout, setWorkout] = useState("Upper");

    useFocusEffect(
        useCallback(() => {
            const load = async () => {
                const n = await AsyncStorage.getItem("userName");
                const cg = await AsyncStorage.getItem("calorieGoal");
                const pg = await AsyncStorage.getItem("proteinGoal");
                const cl = await AsyncStorage.getItem("caloriesLogged");
                const pl = await AsyncStorage.getItem("proteinLogged");
                const st = await AsyncStorage.getItem("steps");
                const wo = await AsyncStorage.getItem("workout");

                if (n) setName(n);
                if (cg) setCalorieGoal(parseInt(cg));
                if (pg) setProteinGoal(parseInt(pg));
                if (cl) setCaloriesLogged(parseInt(cl));
                if (pl) setProteinLogged(parseInt(pl));
                if (st) setSteps(parseInt(st));
                if (wo) setWorkout(wo);
            };
            load();
        }, [])
    );

    const caloriesLeft = calorieGoal - caloriesLogged;
    const proteinLeft = proteinGoal - proteinLogged;

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.greeting}>Good morning, {name} 👋</Text>
            <Text style={styles.subtitle}>Here's your goal for today</Text>

            <View style={styles.mainCard}>
                <Text style={styles.mainLabel}>CALORIES REMAINING</Text>
                <Text style={styles.mainValue}>{caloriesLeft}</Text>
                <View style={styles.mainRow}>
                    <Text style={styles.mainSub}>Goal: {calorieGoal}</Text>
                    <Text style={styles.mainSub}>Logged: {caloriesLogged}</Text>
                </View>
                <TouchableOpacity style={styles.logButton}>
                    <Text style={styles.logButtonText}>+ LOG FOOD</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.grid}>
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>PROTEIN LEFT</Text>
                    <Text style={styles.cardValue}>{proteinLeft}g</Text>
                    <Text style={styles.cardSub}>Goal: {proteinGoal}g</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.cardLabel}>STEPS</Text>
                    <Text style={styles.cardValue}>{steps.toLocaleString()}</Text>
                    <Text style={styles.cardSub}>Daily goal: 10,000</Text>
                </View>
            </View>

            <View style={styles.workoutCard}>
                <Text style={styles.cardLabel}>TODAY'S WORKOUT</Text>
                <Text style={styles.workoutValue}>{workout} Day</Text>
            </View>
        </ScrollView>
    );
}

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
    grid: {
        flexDirection: "row",
        gap: 12,
        marginBottom: 16,
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
    workoutCard: {
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 20,
        padding: 20,
        marginBottom: 40,
    },
    workoutValue: {
        color: "#ffffff",
        fontSize: 32,
        fontWeight: "800",
    },
});