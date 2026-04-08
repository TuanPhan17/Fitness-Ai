// LinearGradient creates the gradient background effect
import { LinearGradient } from "expo-linear-gradient";
// Stack manages the navigation stack, useRouter lets us navigate
import { Stack, useRouter } from "expo-router";
// Image displays the mascot, other components for layout
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
    // Router lets us push to other screens
    const router = useRouter();

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

                {/* Login link for returning users */}
                <Text style={styles.loginText}>
                    Already have an account?{" "}
                    <Text style={styles.loginAccent}>Log in</Text>
                </Text>
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