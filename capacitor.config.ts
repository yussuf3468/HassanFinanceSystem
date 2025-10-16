import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.lenzro.erp",
  appName: "Lenzro ERP",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
