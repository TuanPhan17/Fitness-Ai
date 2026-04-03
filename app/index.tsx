import { LinearGradient } from "expo-linear-gradient";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  return (
    <LinearGradient
      colors={["#0f0c29", "#302b63", "#24243e"]}
      style={styles.container}
    >
      <View style={styles.topSection}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>✦ AI POWERED</Text>
        </View>
        <Text style={styles.title}>
          Fitness<Text style={styles.titleAccent}>AI</Text>
        </Text>
        <Text style={styles.subtitle}>
          The intelligent coach that{"\n"}trains, tracks, and transforms.
        </Text>
      </View>

      <Image
        source={require("../assets/images/mascot.png")}
        style={styles.mascot}
      />

      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>GET STARTED →</Text>
        </TouchableOpacity>
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
    justifyContent: "space-between",
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
    color: "#FF6B35",
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
    resizeMode: "contain",
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