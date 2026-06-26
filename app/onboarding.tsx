// onboarding.tsx
// =====================================================
// ONBOARDING — A guided, multi-step setup flow.
//
// Instead of one long scrolling form, the setup is broken into 4 steps
// with a progress bar. Each step validates its own fields before letting
// the user continue, so they can't reach the end with missing info.
//
//   Step 1: Profile      → name, age, gender
//   Step 2: Body stats   → height (ft/in), current + goal weight
//   Step 3: Activity     → how active they are
//   Step 4: Goal         → deficit (cut / maintain)
//
// On the final step we run the Mifflin-St Jeor formula to calculate the
// user's daily calorie + protein goals, save everything, and head to the
// dashboard. The formula and storage logic are unchanged — only the UI
// flow around them is new.
// =====================================================

// Import AsyncStorage to save user data after onboarding
import AsyncStorage from "@react-native-async-storage/async-storage";
// useRouter lets us navigate to the dashboard after finishing
import { useRouter } from "expo-router";
// useState holds all the form values + which step we're on
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

// How many steps the flow has. Used for the progress bar + "Step X of Y".
const TOTAL_STEPS = 4;

export default function Onboarding() {
    const router = useRouter();

    // ── Which step we're on (1-indexed) ──
    const [step, setStep] = useState(1);

    // ── An error message for the current step (empty = no error) ──
    const [error, setError] = useState("");

    // ── State for every field in the form ──
    const [name, setName] = useState("");
    const [age, setAge] = useState("");
    const [gender, setGender] = useState("");
    // Height is split into feet + inches so the math is accurate. A single
    // "5ft 10in" text box would lose the inches when parsed as a number.
    const [heightFeet, setHeightFeet] = useState("");
    const [heightInches, setHeightInches] = useState("");
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

    // ── Validate the CURRENT step ──
    // Returns an error string if something's wrong, or "" if the step is
    // good to advance. Keeping validation per-step means the user gets
    // immediate, specific feedback instead of one giant error at the end.
    const validateStep = (): string => {
        if (step === 1) {
            if (!name.trim()) return "Please enter your name.";
            const ageNum = parseInt(age);
            if (!age || isNaN(ageNum) || ageNum < 13 || ageNum > 100) {
                return "Please enter a valid age (13–100).";
            }
            if (!gender) return "Please select a gender.";
        }

        if (step === 2) {
            const ft = parseInt(heightFeet);
            const inch = parseInt(heightInches || "0");
            if (!heightFeet || isNaN(ft) || ft < 3 || ft > 8) {
                return "Please enter a valid height in feet (3–8).";
            }
            if (isNaN(inch) || inch < 0 || inch > 11) {
                return "Inches must be between 0 and 11.";
            }
            const cw = parseFloat(currentWeight);
            if (!currentWeight || isNaN(cw) || cw < 50 || cw > 700) {
                return "Please enter a valid current weight (50–700 lbs).";
            }
            const gw = parseFloat(goalWeight);
            if (!goalWeight || isNaN(gw) || gw < 50 || gw > 700) {
                return "Please enter a valid goal weight (50–700 lbs).";
            }
        }

        if (step === 3) {
            if (!activity) return "Please select your activity level.";
        }

        if (step === 4) {
            if (!deficit && deficit !== "0") return "Please select a goal.";
        }

        return "";
    };

    // ── Advance to the next step (or finish on the last one) ──
    const handleNext = () => {
        const validationError = validateStep();
        if (validationError) {
            setError(validationError);
            return;
        }
        setError("");

        if (step < TOTAL_STEPS) {
            setStep(step + 1);
        } else {
            handleFinish();
        }
    };

    // ── Go back to the previous step ──
    const handleBack = () => {
        setError("");
        if (step > 1) setStep(step - 1);
    };

    // ── Final step: calculate goals, save, go to dashboard ──
    const handleFinish = async () => {
        // Convert weight from lbs to kg for the formula
        const weightKg = parseFloat(currentWeight) * 0.453592;
        // Convert height to cm. Total inches = (feet × 12) + inches, then
        // × 2.54 cm/inch. This correctly accounts for the inches, which the
        // old single-field version silently dropped.
        const totalInches = parseInt(heightFeet || "0") * 12 + parseInt(heightInches || "0");
        const heightCm = totalInches * 2.54;
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
        // Store height as total inches (a clean single number) so other
        // screens can read it back without re-parsing "5ft 10in" text.
        await AsyncStorage.setItem("heightInches", totalInches.toString());
        await AsyncStorage.setItem("currentWeight", currentWeight);
        await AsyncStorage.setItem("goalWeight", goalWeight);
        await AsyncStorage.setItem("activity", activity);
        await AsyncStorage.setItem("deficit", deficit);
        await AsyncStorage.setItem("proteinGoal", protein.toString());
        await AsyncStorage.setItem("calorieGoal", calories.toString());

        // Navigate to the dashboard. replace() so the back button doesn't
        // return into the middle of onboarding.
        router.replace("/dashboard");
    };

    // ── A short title + subtitle for each step ──
    const stepHeaders: Record<number, { title: string; subtitle: string }> = {
        1: { title: "About you", subtitle: "Let's start with the basics" },
        2: { title: "Your body", subtitle: "We use these for accurate targets" },
        3: { title: "How active\nare you?", subtitle: "Pick what best describes your week" },
        4: { title: "Your goal", subtitle: "How fast do you want to move?" },
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            {/* ── Progress bar + step counter ── */}
            <View style={styles.progressWrap}>
                <View style={styles.progressTrack}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${(step / TOTAL_STEPS) * 100}%` },
                        ]}
                    />
                </View>
                <Text style={styles.stepCounter}>
                    Step {step} of {TOTAL_STEPS}
                </Text>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 24 }}
            >
                {/* ── Step header ── */}
                <Text style={styles.title}>{stepHeaders[step].title}</Text>
                <Text style={styles.subtitle}>{stepHeaders[step].subtitle}</Text>

                {/* ── Inline error for the current step ── */}
                {error !== "" && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {/* ═══════════ STEP 1: PROFILE ═══════════ */}
                {step === 1 && (
                    <View>
                        <Text style={styles.label}>NAME</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Your name"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={name}
                            onChangeText={(t) => { setName(t); setError(""); }}
                        />

                        <Text style={styles.label}>AGE</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Your age"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            keyboardType="numeric"
                            value={age}
                            onChangeText={(t) => { setAge(t); setError(""); }}
                            maxLength={3}
                        />

                        <Text style={styles.label}>GENDER</Text>
                        <View style={styles.row}>
                            {["Male", "Female"].map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={[styles.optionButton, gender === option && styles.optionSelected]}
                                    onPress={() => { setGender(option); setError(""); }}
                                >
                                    <Text style={styles.optionText}>{option}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* ═══════════ STEP 2: BODY STATS ═══════════ */}
                {step === 2 && (
                    <View>
                        <Text style={styles.label}>HEIGHT</Text>
                        <View style={styles.row}>
                            <View style={styles.heightField}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="5"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    keyboardType="numeric"
                                    value={heightFeet}
                                    onChangeText={(t) => { setHeightFeet(t); setError(""); }}
                                    maxLength={1}
                                />
                                <Text style={styles.unitLabel}>ft</Text>
                            </View>
                            <View style={styles.heightField}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="10"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    keyboardType="numeric"
                                    value={heightInches}
                                    onChangeText={(t) => { setHeightInches(t); setError(""); }}
                                    maxLength={2}
                                />
                                <Text style={styles.unitLabel}>in</Text>
                            </View>
                        </View>

                        <Text style={styles.label}>CURRENT WEIGHT (lbs)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Current weight"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            keyboardType="numeric"
                            value={currentWeight}
                            onChangeText={(t) => { setCurrentWeight(t); setError(""); }}
                            maxLength={3}
                        />

                        <Text style={styles.label}>GOAL WEIGHT (lbs)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Goal weight"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            keyboardType="numeric"
                            value={goalWeight}
                            onChangeText={(t) => { setGoalWeight(t); setError(""); }}
                            maxLength={3}
                        />
                    </View>
                )}

                {/* ═══════════ STEP 3: ACTIVITY ═══════════ */}
                {step === 3 && (
                    <View>
                        {activityOptions.map((option) => (
                            <TouchableOpacity
                                key={option.label}
                                style={[styles.fullOptionButton, activity === option.label && styles.optionSelected]}
                                onPress={() => { setActivity(option.label); setError(""); }}
                            >
                                <View style={styles.deficitRow}>
                                    <Text style={styles.optionText}>{option.label}</Text>
                                    <Text style={styles.deficitSub}>{option.description}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* ═══════════ STEP 4: GOAL ═══════════ */}
                {step === 4 && (
                    <View>
                        {deficitOptions.map((option) => (
                            <TouchableOpacity
                                key={option.label}
                                style={[styles.fullOptionButton, deficit === option.value && styles.optionSelected]}
                                onPress={() => { setDeficit(option.value); setError(""); }}
                            >
                                <View style={styles.deficitRow}>
                                    <Text style={styles.optionText}>{option.label}</Text>
                                    <Text style={styles.deficitSub}>
                                        {option.value === "0" ? "No deficit" : `${option.value} cal deficit`}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* ── Navigation buttons (fixed at bottom) ── */}
            <View style={styles.navRow}>
                {/* Back button — hidden on step 1 */}
                {step > 1 ? (
                    <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.backButtonSpacer} />
                )}

                {/* Next / Finish button */}
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                    <Text style={styles.nextButtonText}>
                        {step < TOTAL_STEPS ? "NEXT →" : "LET'S GO →"}
                    </Text>
                </TouchableOpacity>
            </View>
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

    // ── Progress bar ──
    progressWrap: {
        marginBottom: 28,
    },
    progressTrack: {
        height: 6,
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 3,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: "#FF6B35",
        borderRadius: 3,
    },
    stepCounter: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 13,
        fontWeight: "600",
        marginTop: 8,
    },

    // ── Headers ──
    title: {
        color: "#ffffff",
        fontSize: 34,
        fontWeight: "900",
        marginBottom: 8,
    },
    subtitle: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 15,
        marginBottom: 24,
    },
    label: {
        color: "#FF6B35",
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
        flexDirection: "row",
        gap: 12,
    },
    heightField: {
        flex: 1,
        position: "relative",
        justifyContent: "center",
    },
    unitLabel: {
        position: "absolute",
        right: 16,
        color: "rgba(255,255,255,0.4)",
        fontSize: 15,
        fontWeight: "600",
    },
    optionButton: {
        flex: 1,
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
        borderColor: "#FF6B35",
        backgroundColor: "rgba(255,107,53,0.1)",
    },
    optionText: {
        color: "#ffffff",
        fontSize: 16,
    },
    deficitRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    deficitSub: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 13,
    },

    // ── Error box ──
    errorBox: {
        backgroundColor: "rgba(255,70,70,0.12)",
        borderWidth: 1,
        borderColor: "rgba(255,70,70,0.3)",
        borderRadius: 12,
        padding: 14,
        marginBottom: 4,
    },
    errorText: {
        color: "#FF6B6B",
        fontSize: 14,
    },

    // ── Bottom nav row ──
    navRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingTop: 12,
    },
    backButton: {
        paddingVertical: 18,
        paddingHorizontal: 20,
    },
    backButtonText: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 15,
        fontWeight: "600",
    },
    backButtonSpacer: {
        width: 0,
    },
    nextButton: {
        flex: 1,
        backgroundColor: "#FF6B35",
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: "center",
    },
    nextButtonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "800",
        letterSpacing: 2,
    },
});
