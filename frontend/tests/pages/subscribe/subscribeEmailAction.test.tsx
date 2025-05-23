import { identity } from "lodash";
import { Response } from "node-fetch";
import { subscribeEmailAction } from "src/app/[locale]/subscribe/actions";
import { mockMessages, useTranslationsMock } from "src/utils/testing/intlMocks";

const original = console.error;
console.error = jest.fn();

afterEach(() => {
  console.error = original;
});

jest.mock("next-intl/server", () => ({
  getTranslations: () => identity,
  setRequestLocale: identity,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
  useMessages: () => mockMessages,
  getTranslations: () => identity,
}));

describe("subscribeEmailAction", () => {
  const mockResponse = {
    status: 200,
    json: () => ({}),
  } as Response;

  let originalFetch: typeof global.fetch;
  beforeAll(() => {
    originalFetch = global.fetch;
  });
  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("email action returns correct messages", async () => {
    const testFormData = new FormData();
    testFormData.set("name", "Firsty");
    testFormData.set("LastName", "Firsty");
    testFormData.set("email", "test@test.com");
    testFormData.set("hp", "honeypot is set");
    const t = useTranslationsMock();

    // Test already subscribed
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponse),
        text: () => "Already subscribed",
      }),
    ) as jest.Mock;
    const testErrorAlreadySubscribed = await subscribeEmailAction(
      t,
      testFormData,
    );
    expect(testErrorAlreadySubscribed.errorMessage).toBe(
      "Subscribe.errors.alreadySubscribed",
    );
    expect(testErrorAlreadySubscribed.validationErrors).toEqual({});

    // Test response that indicates server error
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponse),
        text: () => "This text indicates an error",
      }),
    ) as jest.Mock;
    const testErrorResonse = await subscribeEmailAction(t, testFormData);
    expect(testErrorResonse.errorMessage).toBe("Subscribe.errors.server");
    expect(testErrorResonse.validationErrors).toEqual({});

    // Test error in fetch
    global.fetch = jest.fn(() =>
      Promise.reject(new Error("something bad happened")),
    ) as jest.Mock;
    try {
      await subscribeEmailAction(t, testFormData);
    } finally {
      expect(console.error).toHaveBeenCalledTimes(1);
    }

    // Test valid response
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponse),
        text: () => "true",
        ok: true,
      }),
    ) as jest.Mock;
    const testResponse = await subscribeEmailAction(t, testFormData);
    expect(testResponse.errorMessage).toBe("");
    expect(testResponse.validationErrors).toEqual({});

    // Test invalid email
    testFormData.set("email", "this is no good as an email address");
    const testInvalidResponse = await subscribeEmailAction(t, testFormData);
    const invalidEmail = {
      email: ["Subscribe.errors.invalidEmail"],
    };
    expect(testInvalidResponse.errorMessage).toBe("");
    expect(testInvalidResponse.validationErrors).toStrictEqual(invalidEmail);
  });
});
