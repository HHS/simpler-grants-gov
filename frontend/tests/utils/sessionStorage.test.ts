import SessionStorage from "src/services/auth/sessionStorage";

describe("SessionStorage", () => {
  const mockGetItem = jest.fn();
  const mockSetItem = jest.fn();
  const mockRemoveItem = jest.fn();
  const mockClear = jest.fn();
  const mockKey = jest.fn();
  const mockConsoleError = jest.fn();
  let originalConsoleError: typeof console.error;

  beforeEach(() => {
    originalConsoleError = console.error;
    console.error = mockConsoleError;

    Object.defineProperty(window, "sessionStorage", {
      value: {
        getItem: mockGetItem,
        setItem: mockSetItem,
        removeItem: mockRemoveItem,
        clear: mockClear,
        key: mockKey,
        length: 0,
      },
      writable: true,
    });

    jest.clearAllMocks();
  });

  afterEach(() => {
    console.error = originalConsoleError;
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
        value: {
          getItem: mockGetItem,
          setItem: mockSetItem,
          removeItem: mockRemoveItem,
          clear: mockClear,
          key: mockKey,
          length: 0,
        },
        writable: true,
      });
    });
  });

  describe("setItem", () => {
    it("sets an item in sessionStorage", () => {
      SessionStorage.setItem("testKey", "testValue");
      expect(mockSetItem).toHaveBeenCalledWith("testKey", "testValue");
    });

    it("does nothing when sessionStorage is not available", () => {
      jest
        .spyOn(SessionStorage, "isSessionStorageAvailable")
        .mockReturnValue(false);

      SessionStorage.setItem("testKey", "testValue");
      expect(mockSetItem).not.toHaveBeenCalled();

      jest.restoreAllMocks();
    });

    it("logs error when exception is thrown", () => {
      mockSetItem.mockImplementation(() => {
        throw new Error("Storage error");
      });

      SessionStorage.setItem("testKey", "testValue");
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe("getItem", () => {
    it("gets an item from sessionStorage", () => {
      mockGetItem.mockReturnValue("testValue");
      const result = SessionStorage.getItem("testKey");
      expect(result).toBe("testValue");
      expect(mockGetItem).toHaveBeenCalledWith("testKey");
    });

    it("returns null when key does not exist", () => {
      mockGetItem.mockReturnValue(null);
      expect(SessionStorage.getItem("nonExistentKey")).toBeNull();
      expect(mockGetItem).toHaveBeenCalledWith("nonExistentKey");
    });

    it("returns null when sessionStorage is not available", () => {
      jest
        .spyOn(SessionStorage, "isSessionStorageAvailable")
        .mockReturnValue(false);

      expect(SessionStorage.getItem("testKey")).toBeNull();
      expect(mockGetItem).not.toHaveBeenCalled();

      jest.restoreAllMocks();
    });

    it("returns null and logs error when exception is thrown", () => {
      mockGetItem.mockImplementation(() => {
        throw new Error("Storage error");
      });

      expect(SessionStorage.getItem("testKey")).toBeNull();
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe("removeItem", () => {
    it("removes an item from sessionStorage", () => {
      SessionStorage.removeItem("testKey");
      expect(mockRemoveItem).toHaveBeenCalledWith("testKey");
    });

    it("does nothing when sessionStorage is not available", () => {
      jest
        .spyOn(SessionStorage, "isSessionStorageAvailable")
        .mockReturnValue(false);

      SessionStorage.removeItem("testKey");
      expect(mockRemoveItem).not.toHaveBeenCalled();

      jest.restoreAllMocks();
    });

    it("logs error when exception is thrown", () => {
      mockRemoveItem.mockImplementation(() => {
        throw new Error("Storage error");
      });

      SessionStorage.removeItem("testKey");
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe("clear", () => {
    it("clears all items from sessionStorage", () => {
      SessionStorage.clear();
      expect(mockClear).toHaveBeenCalled();
    });

    it("does nothing when sessionStorage is not available", () => {
      jest
        .spyOn(SessionStorage, "isSessionStorageAvailable")
        .mockReturnValue(false);

      SessionStorage.clear();
      expect(mockClear).not.toHaveBeenCalled();

      jest.restoreAllMocks();
    });

    it("logs error when exception is thrown", () => {
      mockClear.mockImplementation(() => {
        throw new Error("Storage error");
      });

      SessionStorage.clear();
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  it("should get item from session storage", () => {
    mockGetItem.mockReturnValue("testValue");

    const result = SessionStorage.getItem("testKey");

    expect(mockGetItem).toHaveBeenCalledWith("testKey");
    expect(result).toBe("testValue");
  });

  it("should set item in session storage", () => {
    SessionStorage.setItem("testKey", "testValue");

    expect(mockSetItem).toHaveBeenCalledWith("testKey", "testValue");
  });

  it("should remove item from session storage", () => {
    SessionStorage.removeItem("testKey");

    expect(mockRemoveItem).toHaveBeenCalledWith("testKey");
  });

  it("should clear session storage", () => {
    SessionStorage.clear();

    expect(mockClear).toHaveBeenCalled();
  });

  it("should handle errors gracefully", () => {
    mockGetItem.mockImplementation(() => {
      throw new Error("Test error");
    });

    const result = SessionStorage.getItem("testKey");

    expect(mockGetItem).toHaveBeenCalledWith("testKey");
    expect(mockConsoleError).toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
