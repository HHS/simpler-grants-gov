/**
 * @jest-environment node
 */

import { POST } from "src/app/api/newsletter/subscribe/route";

import { NextRequest } from "next/server";

jest.mock("src/constants/environments", () => ({
  environment: {
    MAILCHIMP_API_URL_PREFIX: "us4",
    MAILCHIMP_API_KEY: "fake-api-key",
    MAILCHIMP_LIST_ID: "list123",
  },
}));

const originalConsoleError = console.error;

const buildRequest = (fields: Record<string, string>): NextRequest => {
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => formData.set(key, value));
  return new NextRequest("http://simpler.grants.gov/api/newsletter/subscribe", {
    method: "POST",
    body: formData,
  });
};

const mockMailchimpResponse = (
  body: unknown,
  { ok = true, status = 200 }: { ok?: boolean; status?: number } = {},
) => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok,
      status,
      json: () => Promise.resolve(body),
    }),
  ) as jest.Mock;
};

describe("POST /api/newsletter/subscribe", () => {
  let originalFetch: typeof global.fetch;

  beforeAll(() => {
    originalFetch = global.fetch;
    console.error = jest.fn();
  });

  afterEach(() => jest.clearAllMocks());

  afterAll(() => {
    global.fetch = originalFetch;
    console.error = originalConsoleError;
  });

  it("subscribes a valid user and calls Mailchimp with the expected request", async () => {
    mockMailchimpResponse({
      total_created: 1,
      total_updated: 0,
      error_count: 0,
      errors: [],
    });

    const response = await POST(
      buildRequest({
        name: "Apple",
        LastName: "Sauce",
        email: "apple@example.com",
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });

    const fetchMock = global.fetch as jest.Mock;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://us4.api.mailchimp.com/3.0/lists/list123");
    expect(options.method).toBe("POST");
    expect((options.headers as Record<string, string>).Authorization).toBe(
      `Basic ${Buffer.from("anystring:fake-api-key").toString("base64")}`,
    );
    expect(JSON.parse(options.body as string)).toEqual({
      members: [
        {
          email_address: "apple@example.com",
          status: "subscribed",
          merge_fields: { FNAME: "Apple", LNAME: "Sauce" },
        },
      ],
    });
  });

  it("returns alreadySubscribed when Mailchimp reports an existing contact", async () => {
    mockMailchimpResponse({
      total_created: 0,
      total_updated: 0,
      error_count: 1,
      errors: [
        {
          email_address: "apple@example.com",
          error: "apple@example.com is already a list member.",
          error_code: "ERROR_CONTACT_EXISTS",
        },
      ],
    });

    const response = await POST(
      buildRequest({ name: "Apple", email: "apple@example.com" }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: false,
      errorCode: "alreadySubscribed",
    });
  });

  it("returns a server error for other Mailchimp member errors", async () => {
    mockMailchimpResponse({
      total_created: 0,
      total_updated: 0,
      error_count: 1,
      errors: [
        {
          email_address: "apple@example.com",
          error: "Invalid merge field",
          error_code: "ERROR_GENERIC",
        },
      ],
    });

    const response = await POST(
      buildRequest({ name: "Apple", email: "apple@example.com" }),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      success: false,
      errorCode: "server",
    });
  });

  it("returns a server error when Mailchimp responds with a non-ok status", async () => {
    mockMailchimpResponse({}, { ok: false, status: 401 });

    const response = await POST(
      buildRequest({ name: "Apple", email: "apple@example.com" }),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      success: false,
      errorCode: "server",
    });
  });

  it("returns a server error when the fetch call throws", async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(new Error("network down")),
    ) as jest.Mock;

    const response = await POST(
      buildRequest({ name: "Apple", email: "apple@example.com" }),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      success: false,
      errorCode: "server",
    });
  });

  it("returns a validation error when the name is missing", async () => {
    mockMailchimpResponse({});

    const response = await POST(buildRequest({ email: "apple@example.com" }));

    expect(response.status).toBe(400);
    const data = (await response.json()) as {
      success: boolean;
      validationErrors: { name?: string[] };
    };
    expect(data.success).toBe(false);
    expect(data.validationErrors.name).toEqual(["Please enter a name."]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns a validation error when the email is missing", async () => {
    mockMailchimpResponse({});

    const response = await POST(buildRequest({ name: "Apple" }));

    expect(response.status).toBe(400);
    const data = (await response.json()) as {
      success: boolean;
      validationErrors: { email?: string[] };
    };
    expect(data.success).toBe(false);
    expect(data.validationErrors.email).toContain(
      "Please enter an email address.",
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("silently succeeds without calling Mailchimp when the honeypot is filled", async () => {
    mockMailchimpResponse({});

    const response = await POST(
      buildRequest({
        name: "Apple",
        email: "apple@example.com",
        hp: "i am a bot",
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
