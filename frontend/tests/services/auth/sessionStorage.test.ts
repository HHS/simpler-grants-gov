import SessionStorage from "src/services/auth/sessionStorage";

describe("SessionStorage", () => {
  const mockConsoleError = jest.fn();
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    originalConsoleError = console.error;
    console.error = mockConsoleError;

    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    jest.restoreAllMocks();
  });

  describe("isSessionStorageAvailable", () => {
    it("returns true when sessionStorage is available", () => {
      expect(SessionStorage.isSessionStorageAvailable()).toBe(true);
    });

    it("returns false when window is undefined", () => {
      jest
        .spyOn(SessionStorage, "isSessionStorageAvailable")
        .mockImplementation(() => {
          console.error(
            "sessionStorage is not available:",
            new Error("Window is undefined"),
          );
          return false;
        });

      expect(SessionStorage.isSessionStorageAvailable()).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });

    it("returns false when sessionStorage is undefined", () => {
      jest
        .spyOn(SessionStorage, "isSessionStorageAvailable")
        .mockImplementation(() => {
          console.error(
            "sessionStorage is not available:",
            new Error("SessionStorage is undefined"),
          );
          return false;
        });

      expect(SessionStorage.isSessionStorageAvailable()).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });

    it("returns false and logs error when exception is thrown", () => {
      Object.defineProperty(window, 'sessionStorage', {
        get() {
          throw new Error("Access denied");
        }
      });

      expect(SessionStorage.isSessionStorageAvailable()).toBe(false);
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe("setItem", () => {
    it("sets an item in sessionStorage", () => {
      SessionStorage.setItem("testKey", "testValue");
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith("testKey", "testValue");
    });

    it("does nothing when sessionStorage is not available", () => {
      jest
        .spyOn(SessionStorage, "isSessionStorageAvailable")
        .mockReturnValue(false);

      SessionStorage.setItem("testKey", "testValue");
      expect(window.sessionStorage.setItem).not.toHaveBeenCalled();
    });

    it("logs error when exception is thrown", () => {
      (window.sessionStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error("Storage error");
      });

      SessionStorage.setItem("testKey", "testValue");
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe("getItem", () => {
    it("gets an item from sessionStorage", () => {
      (window.sessionStorage.getItem as jest.Mock).mockReturnValue("testValue");
      const result = SessionStorage.getItem("testKey");
      expect(result).toBe("testValue");
      expect(window.sessionStorage.getItem).toHaveBeenCalledWith("testKey");
    });

    it("returns null when key does not exist", () => {
      (window.sessionStorage.getItem as jest.Mock).mockReturnValue(null);
      expect(SessionStorage.getItem("nonExistentKey")).toBeNull();
      expect(window.sessionStorage.getItem).toHaveBeenCalledWith("nonExistentKey");
    });

    it("returns null when sessionStorage is not available", () => {
      jest
        .spyOn(SessionStorage, "isSessionStorageAvailable")
        .mockReturnValue(false);

      expect(SessionStorage.getItem("testKey")).toBeNull();
      expect(window.sessionStorage.getItem).not.toHaveBeenCalled();
    });

    it("returns null and logs error when exception is thrown", () => {
      (window.sessionStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error("Storage error");
      });

      expect(SessionStorage.getItem("testKey")).toBeNull();
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe("removeItem", () => {
    it("removes an item from sessionStorage", () => {
      SessionStorage.removeItem("testKey");
      expect(window.sessionStorage.removeItem).toHaveBeenCalledWith("testKey");
    });

    it("does nothing when sessionStorage is not available", () => {
      jest
        .spyOn(SessionStorage, "isSessionStorageAvailable")
        .mockReturnValue(false);

      SessionStorage.removeItem("testKey");
      expect(window.sessionStorage.removeItem).not.toHaveBeenCalled();
    });

    it("logs error when exception is thrown", () => {
      (window.sessionStorage.removeItem as jest.Mock).mockImplementation(() => {
        throw new Error("Storage error");
      });

      SessionStorage.removeItem("testKey");
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe("clear", () => {
    it("clears all items from sessionStorage", () => {
      SessionStorage.clear();
      expect(window.sessionStorage.clear).toHaveBeenCalled();
    });

    it("does nothing when sessionStorage is not available", () => {
      jest
        .spyOn(SessionStorage, "isSessionStorageAvailable")
        .mockReturnValue(false);

      SessionStorage.clear();
      expect(window.sessionStorage.clear).not.toHaveBeenCalled();
    });

    it("logs error when exception is thrown", () => {
      (window.sessionStorage.clear as jest.Mock).mockImplementation(() => {
        throw new Error("Storage error");
      });

      SessionStorage.clear();
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });
});
