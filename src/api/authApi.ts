import { apiClient } from "./client";

export function getAuthSession() {
  return apiClient.auth.getSession();
}

export function onAuthStateChange(
  callback: Parameters<typeof apiClient.auth.onAuthStateChange>[0],
) {
  return apiClient.auth.onAuthStateChange(callback);
}

export async function signInWithPassword(email: string, password: string) {
  const response = await apiClient.auth.signInWithPassword({ email, password });
  if (response.error) {
    throw response.error;
  }
  return response.data;
}

export async function signUpWithPassword(
  email: string,
  password: string,
  fullName: string,
) {
  const response = await apiClient.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (response.error) {
    throw response.error;
  }

  return response.data;
}

export async function signOutUser() {
  const response = await apiClient.auth.signOut();
  if (response.error) {
    throw response.error;
  }
}

export async function updateCurrentUserProfile(data: {
  full_name?: string;
  phone?: string;
}) {
  const response = await apiClient.auth.updateUser({ data });
  if (response.error) {
    throw response.error;
  }

  return response.data;
}
