class SessionStorage {
  static isSessionStorageAvailable(): boolean {
    try {
      return (
        typeof window !== "undefined" &&
        typeof window.sessionStorage !== "undefined"
      );
    } catch (error) {
      console.error(`sessionStorage is not available:`, error);
      return false;
    }
  }

  static setItem(key: string, value: string): void {
    if (!this.isSessionStorageAvailable()) return;
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      console.error(`Error setting sessionStorage item:`, error);
    }
  }

  static getItem(key: string): string | null {
    if (!this.isSessionStorageAvailable()) return null;
    try {
      return sessionStorage.getItem(key);
    } catch (error) {
      console.error(`Error getting sessionStorage item:`, error);
      return null;
    }
  }

  static removeItem(key: string): void {
    if (!this.isSessionStorageAvailable()) return;
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing sessionStorage item:`, error);
    }
  }

  static clear(): void {
    if (!this.isSessionStorageAvailable()) return;
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error(`Error clearing sessionStorage:`, error);
    }
  }
}

export default SessionStorage;
