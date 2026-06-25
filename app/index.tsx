// AsyncStorage lets us check whether the user has already onboarded
import AsyncStorage from "@react-native-async-storage/async-storage";
// LinearGradient creates the gradient background effect
import { LinearGradient } from "expo-linear-gradient";
// Stack manages the navigation stack, useRouter lets us navigate
import { Stack, useRouter } from "expo-router";
// React hooks for the launch check
import { useEffect, useState } from "react";
// ActivityIndicator shows a spinner while we check storage
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
    // Router lets us push to other screens
    const router = useRouter();

    // While true, we're still checking storage — show a spinner instead
    // of flashing the welcome screen at a returning user.
    const [checking, setChecking] = useState(true);

    // ── On launch: has this person already set up their goals? ──
    // If a calorieGoal exists in storage, they've onboarded before, so we
    // send them straight to the dashboard. If not, they're new — show the
    // welcome screen below. This is why you only see onboarding once.
    useEffect(() => {
        const checkOnboarded = async () => {
            try {
                const calorieGoal = await AsyncStorage.getItem("calorieGoal");
                if (calorieGoal) {
                    // Returning user — skip welcome + onboarding entirely.
                    // replace() (not push) so the back button doesn't return here.
                    router.replace("/dashboard");
                    return;
                }
            } catch (err) {
                console.error("Failed to check onboarding status:", err);
            }
            // New user (or check failed) — show the welcome screen.
            setChecking(false);
        };
        checkOnboarded();
    }, [router]);

    // ── While checking, show a simple loading spinner ──
    // Prevents the welcome screen from flashing before we redirect.
    if (checking) {
        return (
            <LinearGradient
                colors={["#0f0c29", "#302b63", "#24243e"]}
                style={[styles.container, styles.loadingContainer]}
            >
                <Stack.Screen options={{ headerShown: false }} />
                <ActivityIndicator size="large" color="#FF6B35" />
            </LinearGradient>
        );
    }

    return (
        // Gradient background — goes from dark purple to dark blue
        <LinearGradient
            colors={["#0f0c29", "#302b63", "#24243e"]}
            style={styles.container}
        >
            {/* Hide the default navigation header */}
            <Stack.Screen options={{ headerShown: false }} />

            {/* Top section — badge, title, subtitle */}
            <View style={styles.topSection}>
                {/* Orange pill badge at the top */}
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>✦ AI POWERED</Text>
                </View>

                {/* App name with orange accent on AI */}
                <Text style={styles.title}>
                    Fitness<Text style={styles.titleAccent}>AI</Text>
                </Text>

                <Text style={styles.subtitle}>
                    The intelligent coach that{"\n"}trains, tracks, and transforms.
                </Text>
            </View>

            {/* Mascot image in the middle */}
            <Image
                source={require("../assets/images/mascot.png")}
                style={styles.mascot}
            />

            {/* Bottom section — get started button and login link */}
            <View style={styles.bottomSection}>
                {/* Main CTA button — navigates to onboarding */}
                <TouchableOpacity style={styles.button} onPress={() => router.push("/onboarding")}>
                    <Text style={styles.buttonText}>GET STARTED →</Text>
                </TouchableOpacity>

                {/* Login link for returning users. No auth yet (that's
                    Layer 3), so this just routes to the dashboard, which
                    reads any saved data. */}
                <TouchableOpacity onPress={() => router.replace("/dashboard")}>
                    <Text style={styles.loginText}>
                        Already have an account?{" "}
                        <Text style={styles.loginAccent}>Log in</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "space-between", // Spreads top, middle, bottom apart
        paddingTop: 70,
        paddingBottom: 50,
    },
    loadingContainer: {
        justifyContent: "center", // Center the spinner vertically
    },
    topSection: {
        alignItems: "center",
        paddingHorizontal: 32,
    },
    badge: {
        backgroundColor: "rgba(255,107,53,0.15)",
        borderWidth: 1,
        borderColor: "rgba(255,107,53,0.4)",
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 16,
    },
    badgeText: {
        color: "#FF6B35",
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 3,
    },
    title: {
        fontSize: 58,
        fontWeight: "900",
        color: "#ffffff",
        letterSpacing: 2,
    },
    titleAccent: {
        color: "#FF6B35", // Makes AI orange
    },
    subtitle: {
        fontSize: 15,
        color: "rgba(255,255,255,0.55)",
        textAlign: "center",
        marginTop: 12,
        lineHeight: 26,
        letterSpacing: 0.3,
    },
    mascot: {
        width: 340,
        height: 400,
        resizeMode: "contain", // Keeps image proportions
    },
    bottomSection: {
        width: "100%",
        alignItems: "center",
        paddingHorizontal: 32,
    },
    button: {
        backgroundColor: "#FF6B35",
        width: "100%",
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: "center",
        // Orange glow shadow effect
        shadowColor: "#FF6B35",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.6,
        shadowRadius: 24,
        elevation: 10,
    },
    buttonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "800",
        letterSpacing: 2,
    },
    loginText: {
        marginTop: 20,
        color: "rgba(255,255,255,0.35)",
        fontSize: 14,
    },
    loginAccent: {
        color: "#FF6B35",
        fontWeight: "600",
    },
});