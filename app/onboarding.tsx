// Import AsyncStorage to save user data after onboarding
import AsyncStorage from "@react-native-async-storage/async-storage";
// useRouter lets us navigate to the dashboard after finishing
import { useRouter } from "expo-router";
// useState holds all the form values as the user types
import { useState } from "react";
// Import UI components
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

export default function Onboarding() {
    const router = useRouter();

    // State for every field in the form
    const [name, setName] = useState("");
    const [age, setAge] = useState("");
    const [gender, setGender] = useState("");
    const [height, setHeight] = useState("");
    const [currentWeight, setCurrentWeight] = useState("");
    const [goalWeight, setGoalWeight] = useState("");
    const [activity, setActivity] = useState("");
    const [deficit, setDeficit] = useState("");

    // Deficit options — label is what user sees, value is how many calories we subtract
    const deficitOptions = [
        { label: "Maintaining", value: "0" },
        { label: "Mild", value: "300" },
        { label: "Moderate", value: "500" },
        { label: "Aggressive", value: "750" },
    ];

    // Activity options — label is what user sees, description explains it, multiplier affects calorie calc
    const activityOptions = [
        { label: "Sedentary", description: "Desk job, little to no exercise", multiplier: 1.2 },
        { label: "Lightly Active", description: "Light exercise 1-3 days a week", multiplier: 1.375 },
        { label: "Moderately Active", description: "Moderate exercise 3-5 days a week", multiplier: 1.55 },
        { label: "Very Active", description: "Hard exercise + 10k+ steps daily", multiplier: 1.725 },
        { label: "Extremely Active", description: "Athlete level, physical job", multiplier: 1.9 },
    ];

    // This runs when user hits LET'S GO
    const handleFinish = async () => {
        // Convert weight from lbs to kg for the formula
        const weightKg = parseFloat(currentWeight) * 0.453592;
        // Convert height from feet to cm for the formula
        const heightCm = parseFloat(height) * 30.48;
        const ageNum = parseInt(age);
        const deficitNum = parseInt(deficit || "0");

        // Mifflin-St Jeor formula — calculates base metabolic rate (BMR)
        // Male and female have different formulas because of different metabolism
        const bmr = gender === "Male"
            ? (10 * weightKg) + (6.25 * heightCm) - (5 * ageNum) + 5
            : (10 * weightKg) + (6.25 * heightCm) - (5 * ageNum) - 161;

        // Activity multiplier adjusts calories based on how active the user is
        const activityMultiplier =
            activity === "Sedentary" ? 1.2 :
                activity === "Lightly Active" ? 1.375 :
                    activity === "Moderately Active" ? 1.55 :
                        activity === "Very Active" ? 1.725 : 1.9;

        // Final calorie goal = BMR x activity level - deficit
        const calories = Math.round((bmr * activityMultiplier) - deficitNum);
        // Protein goal = 0.8g per pound of goal body weight
        const protein = Math.round(parseFloat(goalWeight) * 0.8);

        // Save everything to AsyncStorage so dashboard can read it
        await AsyncStorage.setItem("userName", name);
        await AsyncStorage.setItem("age", age);
        await AsyncStorage.setItem("gender", gender);
        await AsyncStorage.setItem("height", height);
        await AsyncStorage.setItem("currentWeight", currentWeight);
        await AsyncStorage.setItem("goalWeight", goalWeight);
        await AsyncStorage.setItem("activity", activity);
        await AsyncStorage.setItem("deficit", deficit);
        await AsyncStorage.setItem("proteinGoal", protein.toString());
        await AsyncStorage.setItem("calorieGoal", calories.toString());

        // Navigate to the dashboard
        router.push("/dashboard");
    };

    return (
        // KeyboardAvoidingView pushes content up when keyboard opens
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            {/* keyboardShouldPersistTaps prevents keyboard from blocking button taps */}
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>Let's build{"\n"}your plan.</Text>
                <Text style={styles.subtitle}>Tell us about yourself</Text>

                {/* Name input */}
                <Text style={styles.label}>NAME</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Your name"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={name}
                    onChangeText={setName}
                />

                {/* Age input */}
                <Text style={styles.label}>AGE</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Your age"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="numeric"
                    value={age}
                    onChangeText={setAge}
                />

                {/* Gender selection — two buttons side by side */}
                <Text style={styles.label}>GENDER</Text>
                <View style={styles.row}>
                    {["Male", "Female"].map((option) => (
                        <TouchableOpacity
                            key={option}
                            // If this option is selected, add the orange highlight style
                            style={[styles.optionButton, gender === option && styles.optionSelected]}
                            onPress={() => setGender(option)}
                        >
                            <Text style={styles.optionText}>{option}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Height input */}
                <Text style={styles.label}>HEIGHT</Text>
                <TextInput
                    style={styles.input}
                    placeholder="e.g. 5ft 10in"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    value={height}
                    onChangeText={setHeight}
                />

                {/* Current weight input */}
                <Text style={styles.label}>CURRENT WEIGHT (lbs)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Current weight"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="numeric"
                    value={currentWeight}
                    onChangeText={setCurrentWeight}
                />

                {/* Goal weight input */}
                <Text style={styles.label}>GOAL WEIGHT (lbs)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Goal weight"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="numeric"
                    value={goalWeight}
                    onChangeText={setGoalWeight}
                />

                {/* Activity level buttons — loops through activityOptions array */}
                <Text style={styles.label}>ACTIVITY LEVEL</Text>
                {activityOptions.map((option) => (
                    <TouchableOpacity
                        key={option.label}
                        // Highlight the selected option in orange
                        style={[styles.fullOptionButton, activity === option.label && styles.optionSelected]}
                        onPress={() => setActivity(option.label)}
                    >
                        <View style={styles.deficitRow}>
                            <Text style={styles.optionText}>{option.label}</Text>
                            <Text style={styles.deficitSub}>{option.description}</Text>
                        </View>
                    </TouchableOpacity>
                ))}

                {/* Deficit goal buttons — loops through deficitOptions array */}
                <Text style={styles.label}>DEFICIT GOAL</Text>
                {deficitOptions.map((option) => (
                    <TouchableOpacity
                        key={option.label}
                        // Highlight the selected option in orange
                        style={[styles.fullOptionButton, deficit === option.value && styles.optionSelected]}
                        onPress={() => setDeficit(option.value)}
                    >
                        <View style={styles.deficitRow}>
                            <Text style={styles.optionText}>{option.label}</Text>
                            <Text style={styles.deficitSub}>
                                {/* Show 'No deficit' for maintaining, otherwise show cal deficit */}
                                {option.value === "0" ? "No deficit" : `${option.value} cal deficit`}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}

                {/* Final submit button */}
                <TouchableOpacity style={styles.button} onPress={handleFinish}>
                    <Text style={styles.buttonText}>LET'S GO →</Text>
                </TouchableOpacity>

                {/* Empty space at bottom so content isn't cut off */}
                <View style={{ height: 60 }} />
            </ScrollView>
        </KeyboardAvoidingView>
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
        fontSize: 36,
        fontWeight: "900",
        marginBottom: 8,
    },
    subtitle: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 15,
        marginBottom: 32,
    },
    label: {
        color: "#FF6B35",       // Orange section labels
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 2,
        marginBottom: 10,
        marginTop: 20,
    },
    input: {
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        borderRadius: 12,
        padding: 16,
        color: "#ffffff",
        fontSize: 16,
    },
    row: {
        flexDirection: "row", // Side by side
        gap: 12,
    },
    optionButton: {
        flex: 1,              // Equal width buttons
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
    },
    fullOptionButton: {
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
    },
    optionSelected: {
        borderColor: "#FF6B35",                    // Orange border when selected
        backgroundColor: "rgba(255,107,53,0.1)",   // Faint orange background when selected
    },
    optionText: {
        color: "#ffffff",
        fontSize: 16,
    },
    deficitRow: {
        flexDirection: "row",
        justifyContent: "space-between", // Label on left, description on right
        alignItems: "center",
    },
    deficitSub: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 13,
    },
    button: {
        backgroundColor: "#FF6B35",
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: "center",
        marginTop: 32,
    },
    buttonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "800",
        letterSpacing: 2,
    },
});