type RequiredEnvKey = "VITE_SUPABASE_URL" | "VITE_SUPABASE_ANON_KEY";

const requiredEnvKeys: RequiredEnvKey[] = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY",
];

function readEnv(key: RequiredEnvKey): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  supabaseUrl: readEnv("VITE_SUPABASE_URL"),
  supabaseAnonKey: readEnv("VITE_SUPABASE_ANON_KEY"),
  paymentApiUrl: import.meta.env.VITE_PAYMENT_API_URL || "",
  appEnv: import.meta.env.MODE,
};

export function validateEnv(): void {
  requiredEnvKeys.forEach((key) => {
    if (!import.meta.env[key]) {
      throw new Error(
        `Environment validation failed: ${key} is required for application startup.`,
      );
    }
  });
}
