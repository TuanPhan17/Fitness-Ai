// Import AsyncStorage to read saved user data
import AsyncStorage from "@react-native-async-storage/async-storage";
// useFocusEffect runs code every time this screen comes into focus
// useRouter lets us navigate between screens
import { useFocusEffect, useRouter } from "expo-router";
// useCallback and useState are React hooks
import { useCallback, useState } from "react";
// Import all the UI components we need from React Native
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

export default function Dashboard() {
    // Router lets us push to other screens like log-food
    const router = useRouter();

    // These are our state variables — they hold the data that shows on screen
    const [name, setName] = useState("");           // User's name
    const [calorieGoal, setCalorieGoal] = useState(0);     // Daily calorie goal
    const [proteinGoal, setProteinGoal] = useState(0);     // Daily protein goal
    const [caloriesLogged, setCaloriesLogged] = useState(0); // How many calories logged today
    const [proteinLogged, setProteinLogged] = useState(0);   // How much protein logged today
    const [currentWeight, setCurrentWeight] = useState("");  // User's current weight

    // useFocusEffect runs every time the dashboard screen is opened
    // This makes sure the data is always fresh when you navigate back here
    useFocusEffect(
        useCallback(() => {
            // Async function to load all saved data from AsyncStorage
            const load = async () => {
                // Get each value from storage using its key
                const n = await AsyncStorage.getItem("userName");
                const cg = await AsyncStorage.getItem("calorieGoal");
                const pg = await AsyncStorage.getItem("proteinGoal");
                const cl = await AsyncStorage.getItem("caloriesLogged");
                const pl = await AsyncStorage.getItem("proteinLogged");
                const cw = await AsyncStorage.getItem("currentWeight");

                // Only update state if the value actually exists
                if (n) setName(n);
                if (cg) setCalorieGoal(parseInt(cg));   // Convert string to number
                if (pg) setProteinGoal(parseInt(pg));
                if (cl) setCaloriesLogged(parseInt(cl));
                if (pl) setProteinLogged(parseInt(pl));
                if (cw) setCurrentWeight(cw);
            };
            load(); // Call the function
        }, [])
    );

    // Calculate how many calories and protein are left for the day
    const caloriesLeft = calorieGoal - caloriesLogged;
    const proteinLeft = proteinGoal - proteinLogged;

    return (
        // ScrollView makes the whole screen scrollable
        <ScrollView style={styles.container}>
            {/* Greeting at the top with user's name */}
            <Text style={styles.greeting}>Let's get it, {name} 💪</Text>
            <Text style={styles.subtitle}>Here's your goal for today</Text>

            {/* Main calorie card */}
            <View style={styles.mainCard}>
                <Text style={styles.mainLabel}>CALORIES REMAINING</Text>
                {/* Big number showing calories left */}
                <Text style={styles.mainValue}>{caloriesLeft}</Text>

                {/* Progress bar shows how much of your goal you've hit */}
                <View style={styles.progressBarBackground}>
                    <View style={[styles.progressBarFill, {
                        // Width is a percentage of calories logged vs goal
                        // Math.min caps it at 100% so it never overflows
                        width: `${Math.min((caloriesLogged / calorieGoal) * 100, 100)}%`
                    }]} />
                </View>

                {/* Shows goal and logged side by side */}
                <View style={styles.mainRow}>
                    <Text style={styles.mainSub}>Goal: {calorieGoal}</Text>
                    <Text style={styles.mainSub}>Logged: {caloriesLogged}</Text>
                </View>

                {/* Button to navigate to log food screen */}
                <TouchableOpacity style={styles.logButton} onPress={() => router.push("/log-food")}>
                    <Text style={styles.logButtonText}>+ LOG FOOD</Text>
                </TouchableOpacity>
            </View>

            {/* Two cards side by side — protein and weight */}
            <View style={styles.grid}>
                {/* Protein card */}
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>PROTEIN LEFT</Text>
                    <Text style={styles.cardValue}>{proteinLeft}g</Text>
                    <Text style={styles.cardSub}>Goal: {proteinGoal}g</Text>
                </View>

                {/* Current weight card */}
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>CURRENT WEIGHT</Text>
                    <Text style={styles.cardValue}>{currentWeight}</Text>
                    <Text style={styles.cardSub}>lbs</Text>
                </View>
            </View>
        </ScrollView>
    );
}

// All the styles for this screen
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0f0c29", // Dark purple background
        padding: 24,
    },
    greeting: {
        color: "#ffffff",
        fontSize: 26,
        fontWeight: "800",
        marginTop: 60, // Pushes content below the status bar
    },
    subtitle: {
        color: "rgba(255,255,255,0.4)", // Faded white
        fontSize: 14,
        marginTop: 4,
        marginBottom: 24,
    },
    mainCard: {
        backgroundColor: "rgba(255,107,53,0.1)", // Faint orange background
        borderWidth: 1,
        borderColor: "rgba(255,107,53,0.3)",     // Orange border
        borderRadius: 20,
        padding: 24,
        marginBottom: 16,
    },
    mainLabel: {
        color: "#FF6B35",   // Orange text
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 2,
        marginBottom: 8,
    },
    mainValue: {
        color: "#ffffff",
        fontSize: 64,       // Big bold calorie number
        fontWeight: "900",
    },
    progressBarBackground: {
        backgroundColor: "rgba(255,255,255,0.1)", // Gray empty bar
        borderRadius: 6,
        height: 8,
        marginBottom: 20,
    },
    progressBarFill: {
        backgroundColor: "#FF6B35", // Orange filled bar
        borderRadius: 6,
        height: 8,
    },
    mainRow: {
        flexDirection: "row",           // Side by side
        justifyContent: "space-between", // One on each side
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
        flexDirection: "row", // Cards sit side by side
        gap: 12,
        marginBottom: 40,
    },
    card: {
        flex: 1,            // Each card takes equal space
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