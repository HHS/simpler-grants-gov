import SessionStorage from "src/services/sessionStorage/sessionStorage";

describe("SessionStorage", () => {
  const mockConsoleError = jest.fn();
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    originalConsoleError = console.error;
    console.error = mockConsoleError;

    Object.defineProperty(window, "sessionStorage", {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    jest.restoreAllMocks();
  });

  describe("isSessionStorageAvailable", () => {
    it("returns true when sessionStorage is available", () => {
      const result = SessionStorage.isSessionStorageAvailable();
      expect(result).toBe(true);
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

      const result = SessionStorage.isSessionStorageAvailable();
      expect(result).toBe(false);
      expect(mockConsoleError).toHaveBeenCalled();
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

      const result = SessionStorage.isSessionStorageAvailable();
      expect(result).toBe(false);
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it("returns false and logs error when exception is thrown", () => {
      Object.defineProperty(window, "sessionStorage", {
        get: () => {
          throw new Error("Access denied");
        },
      });

      const result = SessionStorage.isSessionStorageAvailable();
      expect(result).toBe(false);
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe("setItem", () => {
    it("sets an item in sessionStorage", () => {
      const setItemSpy = jest.spyOn(window.sessionStorage, "setItem");
      SessionStorage.setItem("testKey", "testValue");
      expect(setItemSpy).toHaveBeenCalledWith("testKey", "testValue");
    });

    it("does nothing when sessionStorage is not available", () => {
      const setItemSpy = jest.spyOn(window.sessionStorage, "setItem");
      jest
        .spyOn(SessionStorage, "isSessionStorageAvailable")
        .mockReturnValue(false);

      SessionStorage.setItem("testKey", "testValue");
      expect(setItemSpy).not.toHaveBeenCalled();
    });

    it("logs error when exception is thrown", () => {
      jest.spyOn(window.sessionStorage, "setItem").mockImplementation(() => {
        throw new Error("Storage error");
      });

      SessionStorage.setItem("testKey", "testValue");
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe("getItem", () => {
    it("gets an item from sessionStorage", () => {
      const getItemSpy = jest
        .spyOn(window.sessionStorage, "getItem")
        .mockReturnValue("testValue");
      const result = SessionStorage.getItem("testKey");
      expect(result).toBe("testValue");
      expect(getItemSpy).toHaveBeenCalledWith("testKey");
    });

    it("returns null when key does not exist", () => {
      const getItemSpy = jest
        .spyOn(window.sessionStorage, "getItem")
        .mockReturnValue(null);
      const result = SessionStorage.getItem("nonExistentKey");
      expect(result).toBeNull();
      expect(getItemSpy).toHaveBeenCalledWith("nonExistentKey");
    });

    it("returns null when sessionStorage is not available", () => {
      const getItemSpy = jest.spyOn(window.sessionStorage, "getItem");
      jest
        .spyOn(SessionStorage, "isSessionStorageAvailable")
        .mockReturnValue(false);

      const result = SessionStorage.getItem("testKey");
      expect(result).toBeNull();
      expect(getItemSpy).not.toHaveBeenCalled();
    });

    it("returns null and logs error when exception is thrown", () => {
      jest.spyOn(window.sessionStorage, "getItem").mockImplementation(() => {
        throw new Error("Storage error");
      });

      const result = SessionStorage.getItem("testKey");
      expect(result).toBeNull();
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe("removeItem", () => {
    it("removes an item from sessionStorage", () => {
      const removeItemSpy = jest.spyOn(window.sessionStorage, "removeItem");
      SessionStorage.removeItem("testKey");
      expect(removeItemSpy).toHaveBeenCalledWith("testKey");
    });

    it("does nothing when sessionStorage is not available", () => {
      const removeItemSpy = jest.spyOn(window.sessionStorage, "removeItem");
      jest
        .spyOn(SessionStorage, "isSessionStorageAvailable")
        .mockReturnValue(false);

      SessionStorage.removeItem("testKey");
      expect(removeItemSpy).not.toHaveBeenCalled();
    });

    it("logs error when exception is thrown", () => {
      jest.spyOn(window.sessionStorage, "removeItem").mockImplementation(() => {
        throw new Error("Storage error");
      });

      SessionStorage.removeItem("testKey");
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe("clear", () => {
    it("clears all items from sessionStorage", () => {
      const clearSpy = jest.spyOn(window.sessionStorage, "clear");
      SessionStorage.clear();
      expect(clearSpy).toHaveBeenCalled();
    });

    it("does nothing when sessionStorage is not available", () => {
      const clearSpy = jest.spyOn(window.sessionStorage, "clear");
      jest
        .spyOn(SessionStorage, "isSessionStorageAvailable")
        .mockReturnValue(false);

      SessionStorage.clear();
      expect(clearSpy).not.toHaveBeenCalled();
    });

    it("logs error when exception is thrown", () => {
      jest.spyOn(window.sessionStorage, "clear").mockImplementation(() => {
        throw new Error("Storage error");
      });

      SessionStorage.clear();
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });
});
