// AsyncStorage lets us read and update the saved calorie/protein totals
import AsyncStorage from "@react-native-async-storage/async-storage";
// useRouter lets us go back to the dashboard after logging
import { useRouter } from "expo-router";
// useState holds the form values as user types
import { useState } from "react";
// Import UI components
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity
} from "react-native";

export default function LogFood() {
    const router = useRouter();

    // State for each input field
    const [food, setFood] = useState("");       // Food name
    const [calories, setCalories] = useState(""); // Calories in this food
    const [protein, setProtein] = useState("");   // Protein in this food

    // Runs when user hits LOG IT
    const handleLog = async () => {
        // Get the current logged totals from storage
        const prevCalories = await AsyncStorage.getItem("caloriesLogged");
        const prevProtein = await AsyncStorage.getItem("proteinLogged");

        // Add the new food's calories to the existing total
        const newCalories =
            (parseInt(prevCalories || "0") + parseInt(calories || "0")).toString();
        // Add the new food's protein to the existing total
        const newProtein =
            (parseInt(prevProtein || "0") + parseInt(protein || "0")).toString();

        // Save the updated totals back to storage
        await AsyncStorage.setItem("caloriesLogged", newCalories);
        await AsyncStorage.setItem("proteinLogged", newProtein);

        // Go back to dashboard — it will reload the updated numbers
        router.back();
    };

    return (
        // Pushes content up when keyboard opens on iOS
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <Text style={styles.title}>Log Food</Text>
            <Text style={styles.subtitle}>What did you eat?</Text>

            {/* Food name input */}
            <TextInput
                style={styles.input}
                placeholder="Food name (e.g. 2 eggs and rice)"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={food}
                onChangeText={setFood}
            />

            {/* Calories input — numeric keyboard */}
            <TextInput
                style={styles.input}
                placeholder="Calories"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="numeric"
                value={calories}
                onChangeText={setCalories}
            />

            {/* Protein input — numeric keyboard */}
            <TextInput
                style={styles.input}
                placeholder="Protein (g)"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="numeric"
                value={protein}
                onChangeText={setProtein}
            />

            {/* Submit button — adds food to daily totals */}
            <TouchableOpacity style={styles.button} onPress={handleLog}>
                <Text style={styles.buttonText}>LOG IT →</Text>
            </TouchableOpacity>

            {/* Cancel — goes back without saving */}
            <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0f0c29",
        padding: 24,
        justifyContent: "center", // Centers everything vertically
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
        marginBottom: 32,
    },
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
    cancel: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 15,
        textAlign: "center",
    },
});