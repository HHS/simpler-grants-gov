class SessionStorage {
  static isSessionStorageAvailable(): boolean {
    try {
      return (
        typeof window !== "undefined" &&
        typeof window.sessionStorage !== "undefined"
      );
    } catch (e) {
      console.error(`sessionStorage is not available:`, e);
      return false;
    }
  }

  static setItem(key: string, value: string): void {
    if (!this.isSessionStorageAvailable()) return;
    try {
      sessionStorage.setItem(key, value);
    } catch (e) {
      console.error(`Error setting sessionStorage item:`, e);
    }
  }

  static getItem(key: string): string | null {
    if (!this.isSessionStorageAvailable()) return null;
    try {
      return sessionStorage.getItem(key);
    } catch (e) {
      console.error(`Error getting sessionStorage item:`, e);
      return null;
    }
  }

  static removeItem(key: string): void {
    if (!this.isSessionStorageAvailable()) return;
    try {
      sessionStorage.removeItem(key);
    } catch (e) {
      console.error(`Error removing sessionStorage item:`, e);
    }
  }

  static clear(): void {
    if (!this.isSessionStorageAvailable()) return;
    try {
      sessionStorage.clear();
    } catch (e) {
      console.error(`Error clearing sessionStorage:`, e);
    }
  }
}

export const storeCurrentPage = () => {
  const startURL = `${location.pathname}${location.search}`;
  if (startURL !== "") {
    SessionStorage.setItem("login-redirect", startURL);
  }
};

export default SessionStorage;
