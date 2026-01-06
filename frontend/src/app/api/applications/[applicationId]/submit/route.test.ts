/**
 * @jest-environment node
 */

import { submitApplicationHandler } from "src/app/api/applications/[applicationId]/submit/handler";
import { ApplicationSubmitApiResponse } from "src/types/applicationResponseTypes";

import { NextRequest } from "next/server";

const getSessionMock = jest.fn();

const fakeRequestSubmitApp = (success = true, method: string) => {
  return {
    json: jest.fn(() => {
      return success
        ? Promise.resolve({ data: { data: {} } })
        : Promise.resolve({
            data: {},
            errors: [
              {
                field: "form_id",
                type: "missing_required_form",
                value: "1234",
              },
            ],
            status_code: 422,
          });
    }),
    method,
  } as unknown as NextRequest;
};

jest.mock("src/services/auth/session", () => ({
  getSession: (): unknown => getSessionMock(),
}));

const mockPostSubmitApp = jest.fn((): unknown =>
  Promise.resolve({ status_code: 200, data: { data: {} } }),
);

jest.mock("src/services/fetch/fetchers/applicationFetcher", () => ({
  handleSubmitApplication: () => mockPostSubmitApp(),
}));

describe("POST request", () => {
  afterEach(() => jest.clearAllMocks());
  it("submit application", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));

    const response = await submitApplicationHandler(
      fakeRequestSubmitApp(true, "POST"),
      {
        params: Promise.resolve({
          applicationId: "14",
        }),
      },
    );

    const json = (await response.json()) as {
      message: string;
      data: ApplicationSubmitApiResponse;
    };
    expect(response.status).toBe(200);
    expect(json.data.data).toEqual({ data: {} });

    expect(mockPostSubmitApp).toHaveBeenCalledTimes(1);
    expect(json.message).toBe("Application submit success");
  });
  it("validation warning submitting application", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));
    mockPostSubmitApp.mockImplementation(() =>
      Promise.resolve({
        status_code: 422,
        data: {},
        errors: [
          {
            field: "form_id",
            type: "missing_required_form",
            value: "1234",
          },
        ],
      }),
    );

    const response = await submitApplicationHandler(
      fakeRequestSubmitApp(false, "POST"),
      {
        params: Promise.resolve({
          applicationId: "14",
        }),
      },
    );

    const json = (await response.json()) as {
      message: string;
      data: ApplicationSubmitApiResponse;
      status_code: string;
    };

    expect(response.status).toBe(200);
    expect(json.data.data).toEqual({});

    expect(mockPostSubmitApp).toHaveBeenCalledTimes(1);
    expect(json.message).toBe("Validation errors for submitted application");
  });

  it("error submitting application", async () => {
    getSessionMock.mockImplementation(() => ({
      token: "fakeToken",
    }));
    mockPostSubmitApp.mockImplementation(() =>
      Promise.resolve({
        status_code: 500,
        data: {},
        message: "API error",
      }),
    );

    const response = await submitApplicationHandler(
      fakeRequestSubmitApp(false, "POST"),
      {
        params: Promise.resolve({
          applicationId: "14",
        }),
      },
    );

    const json = (await response.json()) as {
      message: string;
      data: ApplicationSubmitApiResponse;
      status_code: string;
    };

    expect(response.status).toBe(500);

    expect(mockPostSubmitApp).toHaveBeenCalledTimes(1);
    expect(json.message).toBe(
      "Error attempting to submit application: Error submitting application: API error",
    );
  });
});
