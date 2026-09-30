const TOKEN_KEY = "krishisetu_access_token";
const ROLE_KEY = "krishisetu_role";

// Clean up legacy localStorage tokens so credentials do not persist across browser restarts
try {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(ROLE_KEY);
  }
} catch {
  // Ignore storage access restrictions if any
}

export function getAuthToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function getAuthRole() {
  try {
    return sessionStorage.getItem(ROLE_KEY) || null;
  } catch {
    return null;
  }
}

export function setAuthSession(token, role) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
    if (role) {
      sessionStorage.setItem(ROLE_KEY, role);
    }
  } catch (err) {
    console.error("Failed to save auth session:", err);
  }
}

export function clearAuthSession() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
  } catch (err) {
    console.error("Failed to clear auth session:", err);
  }
}
