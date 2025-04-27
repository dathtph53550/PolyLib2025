import { Text, View, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Link } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function Index() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/images/logooo.png")}
          style={styles.logo}
        />
        <Text style={styles.subTitle}>Library Management System</Text>
      </View>
      
      <Text style={styles.welcomeText}>Chào mừng đến với PolyLib</Text>
      <Text style={styles.subtitleText}>Giải pháp quản lý thư viện số của bạn</Text>
      
      <View style={styles.buttonContainer}>
        <Link href="/login" asChild>
          <TouchableOpacity style={styles.loginButton}>
            <Text style={styles.buttonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </Link>
        
        <Link href="/register" asChild>
          <TouchableOpacity style={styles.registerButton}>
            <Text style={styles.registerButtonText}>Đăng ký</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFF",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 60,
  },
  logo: {
    width: 180,
    height: 180,
    resizeMode: "contain",
  },
  subTitle: {
    fontSize: 18,
    color: "#666",
    marginTop: 10,
    backgroundColor: "rgba(255, 117, 58, 0.1)",
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  subtitleText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 50,
    textAlign: "center",
  },
  buttonContainer: {
    width: "100%",
    gap: 15,
  },
  loginButton: {
    backgroundColor: "#FF753A",
    width: "100%",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#FF753A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  registerButton: {
    backgroundColor: "transparent",
    width: "100%",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FF753A",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  registerButtonText: {
    color: "#FF753A",
    fontSize: 18,
    fontWeight: "bold",
  },
});
