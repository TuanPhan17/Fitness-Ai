import { LinearGradient } from "expo-linear-gradient";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  return (
    <LinearGradient
      colors={["#f5e6d3", "#f0d9c0", "#faf0e6"]}
      style={styles.container}
    >
      <View style={styles.topSection}>
        <Text style={styles.tagline}>YOUR JOURNEY STARTS HERE</Text>
        <Text style={styles.title}>Fitness<Text style={styles.titleAccent}>AI</Text></Text>
        <Text style={styles.subtitle}>The intelligent coach that{"\n"}trains, tracks, and transforms.</Text>
      </View>

      <Image
        source={require("../assets/images/mascot.png")}
        style={styles.mascot}
      />

      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>GET STARTED</Text>
        </TouchableOpacity>
        <Text style={styles.loginText}>Already have an account? <Text style={styles.loginAccent}>Log in</Text></Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 80,
    paddingBottom: 60,
  },
  topSection: {
    alignItems: "center",
  },
  tagline: {
    fontSize: 11,
    letterSpacing: 4,
    color: "#a08060",
    marginBottom: 12,
  },
  title: {
    fontSize: 52,
    fontWeight: "900",
    color: "#1a1a1a",
    letterSpacing: 2,
  },
  titleAccent: {
    color: "#FF6B35",
  },
  subtitle: {
    fontSize: 16,
    color: "#7a6a5a",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 24,
  },
  mascot: {
    width: 320,
    height: 380,
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 2,
  },
  loginText: {
    marginTop: 20,
    color: "#a08060",
    fontSize: 14,
  },
  loginAccent: {
    color: "#FF6B35",
    fontWeight: "600",
  },
});