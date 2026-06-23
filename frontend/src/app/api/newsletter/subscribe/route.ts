import { environment } from "src/constants/environments";
import { z } from "zod";

import { NextRequest, NextResponse } from "next/server";

const subscribeSchema = z.object({
  name: z.string().min(1, "Please enter a name."),
  email: z
    .string()
    .min(1, "Please enter an email address.")
    .email("Please enter a valid email address."),
});

// Mailchimp returns this error_code in the batch-subscribe response when the
// email address is already a member of the list.
const ALREADY_SUBSCRIBED_CODE = "ERROR_CONTACT_EXISTS";

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
      console.error(
        `Error subscribing user: Mailchimp returned an error response: Status: ${mailchimpResponse.status}`,
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
      if (responseData.errors[0]?.error_code === ALREADY_SUBSCRIBED_CODE) {
        return NextResponse.json(
          { success: false, errorCode: "alreadySubscribed" },
          { status: 200 },
        );
      }

      console.error(
        `Error subscribing user: Mailchimp returned a member error: ${responseData.errors[0]?.error_code}`,
      );
      return NextResponse.json(
        { success: false, errorCode: "server" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const error = e as Error;
    console.error(
      `Error subscribing user: Exception: ${error.message} ${error.cause?.toString() ?? ""}`,
    );
    return NextResponse.json(
      { success: false, errorCode: "server" },
      { status: 500 },
    );
  }
}
