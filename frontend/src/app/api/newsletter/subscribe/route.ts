import { environment } from "src/constants/environments";
import { logger } from "src/services/logger/simplerLogger";
import { z } from "zod";

import { NextRequest, NextResponse } from "next/server";

const subscribeSchema = z.object({
  name: z.string().min(1, "Please enter a name."),
  email: z
    .string()
    .min(1, "Please enter an email address.")
    .email("Please enter a valid email address."),
});

// Member-level error_codes returned in the batch-subscribe response body (the
// request itself succeeds with HTTP 200). Mailchimp doesn't formally document
// this enum, so any unrecognized code falls through to the generic server path.
const ALREADY_SUBSCRIBED_CODE = "ERROR_CONTACT_EXISTS";
const TOO_MANY_SIGNUPS_CODE = "ERROR_TOO_MANY_RECENT_SIGNUPS";

// HTTP status Mailchimp returns when the API key's connection/rate limits are
// exceeded.
const RATE_LIMITED_STATUS = 429;

// Mailchimp flags fake/undeliverable addresses (including test domains like
// example.com) with the generic ERROR_GENERIC code, surfacing the detail only
// in the human-readable message (e.g. "<email> looks fake or invalid, please
// enter a real email address."). Matching the message is the only available
// signal; this is intentionally fragile -- an ERROR_GENERIC whose message
// doesn't match falls through to the generic server error rather than being
// misclassified as an invalid email.
const INVALID_EMAIL_MESSAGE = /looks fake or invalid|valid email address/i;

// Client-correctable outcomes are returned as HTTP 200 with a distinguishing
// errorCode (rather than a 4xx) because the shared useClientFetch hook throws on
// any non-200 response, which would prevent the form from reading the errorCode.
// The errorCode -- not the HTTP status -- is the signal the frontend branches on.
const SUCCESS_STATUS = 200;

type MailchimpBatchResponse = {
  total_created: number;
  total_updated: number;
  error_count: number;
  errors: { email_address: string; error: string; error_code: string }[];
};

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const name = (formData.get("name") as string) ?? "";
  const LastName = (formData.get("LastName") as string) ?? "";
  const email = (formData.get("email") as string) ?? "";
  const hp = formData.get("hp") as string;

  // hp = honeypot. If this hidden field is filled in, the submission is almost
  // certainly spam, so silently succeed without contacting Mailchimp.
  if (hp) {
    return NextResponse.json({ success: true });
  }

  const validated = subscribeSchema.safeParse({ name, email });
  if (!validated.success) {
    return NextResponse.json(
      {
        success: false,
        validationErrors: validated.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const requestData = {
      members: [
        {
          email_address: email,
          status: "subscribed",
          merge_fields: {
            FNAME: name,
            LNAME: LastName,
          },
        },
      ],
    };

    const authToken = Buffer.from(
      `anystring:${environment.MAILCHIMP_API_KEY}`,
    ).toString("base64");

    const mailchimpResponse = await fetch(
      `https://${environment.MAILCHIMP_API_URL_PREFIX}.api.mailchimp.com/3.0/lists/${environment.MAILCHIMP_LIST_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${authToken}`,
        },
        body: JSON.stringify(requestData),
      },
    );

    if (!mailchimpResponse.ok) {
      if (mailchimpResponse.status === RATE_LIMITED_STATUS) {
        logger.warn(
          { mailchimpStatus: mailchimpResponse.status },
          "Newsletter subscription rate-limited by Mailchimp (HTTP status)",
        );
        return NextResponse.json(
          { success: false, errorCode: "tooManyRequests" },
          { status: SUCCESS_STATUS },
        );
      }

      logger.error(
        { mailchimpStatus: mailchimpResponse.status },
        "Newsletter subscription failed: Mailchimp returned a non-ok status",
      );
      return NextResponse.json(
        { success: false, errorCode: "server" },
        { status: 500 },
      );
    }

    // The batch endpoint returns HTTP 200 even when an individual member fails;
    // per-member failures are reported in the response body.
    const responseData =
      (await mailchimpResponse.json()) as MailchimpBatchResponse;

    if (responseData.error_count > 0) {
      const memberError = responseData.errors[0];
      const memberErrorCode = memberError?.error_code;

      if (memberErrorCode === ALREADY_SUBSCRIBED_CODE) {
        logger.info(
          { mailchimpErrorCode: memberErrorCode },
          "Newsletter subscription skipped: contact already subscribed",
        );
        return NextResponse.json(
          { success: false, errorCode: "alreadySubscribed" },
          { status: SUCCESS_STATUS },
        );
      }

      if (memberErrorCode === TOO_MANY_SIGNUPS_CODE) {
        logger.warn(
          { mailchimpErrorCode: memberErrorCode },
          "Newsletter subscription rate-limited by Mailchimp (member error)",
        );
        return NextResponse.json(
          { success: false, errorCode: "tooManyRequests" },
          { status: SUCCESS_STATUS },
        );
      }

      if (memberError && INVALID_EMAIL_MESSAGE.test(memberError.error)) {
        logger.info(
          { mailchimpErrorCode: memberErrorCode },
          "Newsletter subscription rejected: invalid email address",
        );
        return NextResponse.json(
          { success: false, errorCode: "invalidEmail" },
          { status: SUCCESS_STATUS },
        );
      }

      logger.error(
        { mailchimpErrorCode: memberErrorCode },
        "Newsletter subscription failed: unrecognized Mailchimp member error",
      );
      return NextResponse.json(
        { success: false, errorCode: "server" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const error = e as Error;
    logger.error(
      { error: error.message, cause: error.cause?.toString() },
      "Newsletter subscription failed: exception calling Mailchimp",
    );
    return NextResponse.json(
      { success: false, errorCode: "server" },
      { status: 500 },
    );
  }
}
