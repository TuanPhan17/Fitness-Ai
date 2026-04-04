import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

export default function Onboarding() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [name, setName] = useState("");
    const [currentWeight, setCurrentWeight] = useState("");
    const [goalWeight, setGoalWeight] = useState("");
    const [activity, setActivity] = useState("");

    const handleFinish = async () => {
        const protein = Math.round(parseFloat(goalWeight) * 0.8);
        const calories = Math.round(parseFloat(currentWeight) * 15 - 500);

        await AsyncStorage.setItem("userName", name);
        await AsyncStorage.setItem("currentWeight", currentWeight);
        await AsyncStorage.setItem("goalWeight", goalWeight);
        await AsyncStorage.setItem("activity", activity);
        await AsyncStorage.setItem("proteinGoal", protein.toString());
        await AsyncStorage.setItem("calorieGoal", calories.toString());

        router.push("/dashboard");
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            {step === 1 && (
                <View style={styles.stepContainer}>
                    <Text style={styles.stepLabel}>STEP 1 OF 4</Text>
                    <Text style={styles.question}>What's your name?</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter your name"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        value={name}
                        onChangeText={setName}
                    />
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => setStep(2)}
                    >
                        <Text style={styles.buttonText}>NEXT →</Text>
                    </TouchableOpacity>
                </View>
            )}

            {step === 2 && (
                <View style={styles.stepContainer}>
                    <Text style={styles.stepLabel}>STEP 2 OF 4</Text>
                    <Text style={styles.question}>What's your current weight?</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Weight in lbs"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        keyboardType="numeric"
                        value={currentWeight}
                        onChangeText={setCurrentWeight}
                    />
                    <Text style={styles.question}>What's your goal weight?</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Goal weight in lbs"
                        placeholderTextColor="rgba(255,255,255,0.3)"
                        keyboardType="numeric"
                        value={goalWeight}
                        onChangeText={setGoalWeight}
                    />
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => setStep(3)}
                    >
                        <Text style={styles.buttonText}>NEXT →</Text>
                    </TouchableOpacity>
                </View>
            )}

            {step === 3 && (
                <View style={styles.stepContainer}>
                    <Text style={styles.stepLabel}>STEP 3 OF 4</Text>
                    <Text style={styles.question}>How active are you?</Text>
                    {["Sedentary", "Lightly Active", "Very Active"].map((option) => (
                        <TouchableOpacity
                            key={option}
                            style={[
                                styles.optionButton,
                                activity === option && styles.optionSelected,
                            ]}
                            onPress={() => setActivity(option)}
                        >
                            <Text style={styles.optionText}>{option}</Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => setStep(4)}
                    >
                        <Text style={styles.buttonText}>NEXT →</Text>
                    </TouchableOpacity>
                </View>
            )}

            {step === 4 && (
                <View style={styles.stepContainer}>
                    <Text style={styles.stepLabel}>STEP 4 OF 4</Text>
                    <Text style={styles.question}>You're all set, {name}.</Text>
                    <Text style={styles.summary}>
                        Goal weight: {goalWeight} lbs{"\n"}
                        Daily protein: {Math.round(parseFloat(goalWeight) * 0.8)}g{"\n"}
                        Daily calories: {Math.round(parseFloat(currentWeight) * 15 - 500)}
                    </Text>
                    <TouchableOpacity style={styles.button} onPress={handleFinish}>
                        <Text style={styles.buttonText}>LET'S GO →</Text>
                    </TouchableOpacity>
                </View>
            )}
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
    stepContainer: {
        flex: 1,
        justifyContent: "center",
    },
    stepLabel: {
        color: "#FF6B35",
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 3,
        marginBottom: 16,
    },
    question: {
        color: "#ffffff",
        fontSize: 26,
        fontWeight: "800",
        marginBottom: 20,
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
    },
    buttonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "800",
        letterSpacing: 2,
    },
    optionButton: {
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    optionSelected: {
        borderColor: "#FF6B35",
        backgroundColor: "rgba(255,107,53,0.1)",
    },
    optionText: {
        color: "#ffffff",
        fontSize: 16,
    },
    summary: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 18,
        lineHeight: 32,
        marginBottom: 24,
    },
});