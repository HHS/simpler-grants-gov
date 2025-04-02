import SessionStorage from "src/utils/sessionStorage";

describe("SessionStorage", () => {
  const originalConsoleError = console.error;

  let mockSessionStorage: Storage;

  beforeEach(() => {
    console.error = jest.fn();

    mockSessionStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
      key: jest.fn(),
      length: 0,
    };

    (mockSessionStorage.getItem as jest.Mock).mockImplementation(
      (key: string) => {
        if (key === "testKey") return "testValue";
        if (key === "testKey1") return "testValue1";
        if (key === "testKey2") return "testValue2";
        return null;
      },
    );

    Object.defineProperty(window, "sessionStorage", {
      value: mockSessionStorage,
      writable: true,
    });
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

      jest.restoreAllMocks();
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

      jest.restoreAllMocks();
    });

    it("returns false and logs error when exception is thrown", () => {
      Object.defineProperty(window, "sessionStorage", {
        get: () => {
          throw new Error("Access denied");
        },
        configurable: true,
      });

      expect(SessionStorage.isSessionStorageAvailable()).toBe(false);
      expect(console.error).toHaveBeenCalled();

      Object.defineProperty(window, "sessionStorage", {
        value: mockSessionStorage,
        writable: true,
      });
    });
  });

  describe("setItem", () => {
    it("sets an item in sessionStorage", () => {
      SessionStorage.setItem("testKey", "testValue");
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        "testKey",
        "testValue",
      );
    });

    it("does nothing when sessionStorage is not available", () => {
      jest
        .spyOn(SessionStorage, "isSessionStorageAvailable")
        .mockReturnValue(false);

      SessionStorage.setItem("testKey", "testValue");
      expect(mockSessionStorage.setItem).not.toHaveBeenCalled();

      jest.restoreAllMocks();
    });

    it("logs error when exception is thrown", () => {
      (mockSessionStorage.setItem as jest.Mock).mockImplementation(() => {
        throw new Error("Storage error");
      });

      SessionStorage.setItem("testKey", "testValue");
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("getItem", () => {
    it("gets an item from sessionStorage", () => {
      const result = SessionStorage.getItem("testKey");
      expect(result).toBe("testValue");
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith("testKey");
    });

    it("returns null when key does not exist", () => {
      (mockSessionStorage.getItem as jest.Mock).mockReturnValue(null);
      expect(SessionStorage.getItem("nonExistentKey")).toBeNull();
      expect(mockSessionStorage.getItem).toHaveBeenCalledWith("nonExistentKey");
    });

    it("returns null when sessionStorage is not available", () => {
      jest
        .spyOn(SessionStorage, "isSessionStorageAvailable")
        .mockReturnValue(false);

      expect(SessionStorage.getItem("testKey")).toBeNull();
      expect(mockSessionStorage.getItem).not.toHaveBeenCalled();

      jest.restoreAllMocks();
    });

    it("returns null and logs error when exception is thrown", () => {
      (mockSessionStorage.getItem as jest.Mock).mockImplementation(() => {
        throw new Error("Storage error");
      });

      expect(SessionStorage.getItem("testKey")).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("removeItem", () => {
    it("removes an item from sessionStorage", () => {
      SessionStorage.removeItem("testKey");
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith("testKey");
    });

    it("does nothing when sessionStorage is not available", () => {
      jest
        .spyOn(SessionStorage, "isSessionStorageAvailable")
        .mockReturnValue(false);

      SessionStorage.removeItem("testKey");
      expect(mockSessionStorage.removeItem).not.toHaveBeenCalled();

      jest.restoreAllMocks();
    });

    it("logs error when exception is thrown", () => {
      (mockSessionStorage.removeItem as jest.Mock).mockImplementation(() => {
        throw new Error("Storage error");
      });

      SessionStorage.removeItem("testKey");
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("clear", () => {
    it("clears all items from sessionStorage", () => {
      SessionStorage.clear();
      expect(mockSessionStorage.clear).toHaveBeenCalled();
    });

    it("does nothing when sessionStorage is not available", () => {
      jest
        .spyOn(SessionStorage, "isSessionStorageAvailable")
        .mockReturnValue(false);

      SessionStorage.clear();
      expect(mockSessionStorage.clear).not.toHaveBeenCalled();

      jest.restoreAllMocks();
    });

    it("logs error when exception is thrown", () => {
      (mockSessionStorage.clear as jest.Mock).mockImplementation(() => {
        throw new Error("Storage error");
      });

      SessionStorage.clear();
      expect(console.error).toHaveBeenCalled();
    });
  });
});
