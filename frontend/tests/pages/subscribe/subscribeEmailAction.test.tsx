import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { identity } from "lodash";
import { Response } from "node-fetch";
import { subscribeEmailAction } from "src/app/[locale]/subscribe/actions";
import { mockMessages, useTranslationsMock } from "tests/utils/intlMocks";

import SubscriptionForm from "src/components/subscribe/SubscriptionForm";

const original = console.error;
console.error = jest.fn();

afterEach(() => {
  console.error = original;
});

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
  useMessages: () => mockMessages,
  getTranslations: () => identity,
}));

describe("subscribeEmailAction", () => {
  const mockResponse = {
    status: 200,
    json: async () => ({}),
  } as Response;

  it("it returns correct data", async () => {
    const testFormData = new FormData();
    testFormData.set("name", "Firsty");
    testFormData.set("LastName", "Firsty");
    testFormData.set("email", "test@test.com");
    testFormData.set("hp", "honeypot is set");
    const t = function (i: string) {
      return i;
    };

    // Test already subscribed
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponse),
        text: async () => "Already subscribed",
      }),
    ) as jest.Mock;
    const testErrorAlreadySubscribed = await subscribeEmailAction(
      t,
      "",
      testFormData,
    );
    expect(testErrorAlreadySubscribed.errorMessage).toBe(
      "errors.already_subscribed",
    );
    expect(testErrorAlreadySubscribed.validationErrors).toEqual({});

    // Test response that indicates server error
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponse),
        text: async () => "This text indicates an error",
      }),
    ) as jest.Mock;
    const testErrorResonse = await subscribeEmailAction(t, "", testFormData);
    expect(testErrorResonse.errorMessage).toBe("errors.server");
    expect(testErrorResonse.validationErrors).toEqual({});

    // Test error in fetch
    const mockErrorResponse = {
      status: 200,
      json: async () => PromiseRejectionEvent,
    } as Response;
    global.fetch = jest.fn(() => Promise.reject("error")) as jest.Mock;
    try {
      const testRejectedResponse = await subscribeEmailAction(
        t,
        "",
        testFormData,
      );
    } catch (error) {
      expect(console.error).toHaveBeenCalledTimes(1);
    }

    // Test valid response
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponse),
        text: async () => "true",
        ok: true,
      }),
    ) as jest.Mock;
    const testResponse = await subscribeEmailAction(t, "", testFormData);
    expect(testResponse.errorMessage).toBe("");
    expect(testResponse.validationErrors).toEqual({});

    // Test invalid email
    testFormData.set("email", "this is no good as an email address");
    const testInvalidResponse = await subscribeEmailAction(t, "", testFormData);
    const invalidEmail = {
      email: ["errors.invalid_email"],
    };
    expect(testInvalidResponse.errorMessage).toBe("");
    expect(testInvalidResponse.validationErrors).toStrictEqual(invalidEmail);
  });
});
