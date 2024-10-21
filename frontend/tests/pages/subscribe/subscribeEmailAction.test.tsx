import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { identity } from "lodash";
import { Response } from "node-fetch";
import SubscriptionForm from "src/app/[locale]/subscribe/SubscriptionForm";
import { subscribeEmail, subscribeEmailAction } from "src/app/actions";
import { mockMessages, useTranslationsMock } from "tests/utils/intlMocks";

import { getTranslations } from "next-intl/server";
import { Suspense } from "react";

jest.mock("next-intl", () => ({
  useTranslations: () => useTranslationsMock(),
  useMessages: () => mockMessages,
  getTranslations: () => identity,
}));

describe("subscribeEmailAction", () => {
  const mockResponse = {
    status: 200,
    json: async () => ({
      token: "MOCKED_GITHUB_INSTALLATION_ACCESS_TOKEN",
    }),
  } as Response;

  it("it returns correct data", async () => {
    const testFormData = new FormData();
    testFormData.set("name", "Firsty");
    testFormData.set("LastName", "Firsty");
    testFormData.set("email", "test@test.com");
    testFormData.set("hp", "Firsty");
    const t = function (i: string) {
      return i;
    };

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
    console.log(testErrorAlreadySubscribed);
    expect(testErrorAlreadySubscribed.errorMessage).toBe(
      "errors.already_subscribed",
    );

    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponse),
        text: async () => "Nooooooo",
      }),
    ) as jest.Mock;
    const testErrorResonse = await subscribeEmailAction(t, "", testFormData);
    console.log(testErrorResonse);
    expect(testErrorResonse.errorMessage).toEqual("errors.server");

    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve(mockResponse),
        text: async () => "true",
        ok: true,
      }),
    ) as jest.Mock;
    const testResponse = await subscribeEmailAction(t, "", testFormData);
    console.log(testResponse);
    expect(testResponse.errorMessage).toEqual("");
    expect(testResponse.validationErrors).toEqual({});
  });
});
