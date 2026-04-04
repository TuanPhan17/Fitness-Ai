import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
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
    const [food, setFood] = useState("");
    const [calories, setCalories] = useState("");
    const [protein, setProtein] = useState("");

    const handleLog = async () => {
        const prevCalories = await AsyncStorage.getItem("caloriesLogged");
        const prevProtein = await AsyncStorage.getItem("proteinLogged");

        const newCalories =
            (parseInt(prevCalories || "0") + parseInt(calories || "0")).toString();
        const newProtein =
            (parseInt(prevProtein || "0") + parseInt(protein || "0")).toString();

        await AsyncStorage.setItem("caloriesLogged", newCalories);
        await AsyncStorage.setItem("proteinLogged", newProtein);

        router.back();
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <Text style={styles.title}>Log Food</Text>
            <Text style={styles.subtitle}>What did you eat?</Text>

            <TextInput
                style={styles.input}
                placeholder="Food name (e.g. 2 eggs and rice)"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={food}
                onChangeText={setFood}
            />

            <TextInput
                style={styles.input}
                placeholder="Calories"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="numeric"
                value={calories}
                onChangeText={setCalories}
            />

            <TextInput
                style={styles.input}
                placeholder="Protein (g)"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="numeric"
                value={protein}
                onChangeText={setProtein}
            />

            <TouchableOpacity style={styles.button} onPress={handleLog}>
                <Text style={styles.buttonText}>LOG IT →</Text>
            </TouchableOpacity>

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
        justifyContent: "center",
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