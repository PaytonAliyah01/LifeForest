// services/api.ts
import axios from "axios";
import { Platform } from "react-native";

// Replace this with your computer's LAN IP if testing on a real device
const PC_LAN_IP = "192.168.1.100";

const getBackendURL = (): string => {
  switch (Platform.OS) {
    case "android":
      // Android emulator cannot use localhost
      return "http://10.0.2.2:8080/api";
    case "ios":
      // iOS simulator can use localhost
      return "http://localhost:8080/api";
    case "web":
      // Web runs in browser; localhost works
      return "http://localhost:8080/api";
    default:
      // Physical device uses your PC LAN IP (make sure device is on same network)
      return `http://${PC_LAN_IP}:8080/api`;
  }
};

export const api = axios.create({
  baseURL: getBackendURL(),
  timeout: 5000,
});