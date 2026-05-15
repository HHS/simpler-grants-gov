import { environment } from "src/constants/environments";
import { z } from "zod";

import { NextRequest, NextResponse } from "next/server";

const subscribeSchema = z.object({
  name: z.string().min(1),
  email: z.string().min(1).email(),
});

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const name = formData.get("name") as string;
  const LastName = formData.get("LastName") as string;
  const email = formData.get("email") as string;
  const hp = formData.get("hp") as string;

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
      list: environment.SENDY_LIST_ID,
      subform: "yes",
      boolean: "true",
      api_key: environment.SENDY_API_KEY,
      hp,
      name,
      LastName,
      email,
    };

    const sendyResponse = await fetch(`${environment.SENDY_API_URL}/subscribe`, {
      method: "POST",
      headers: { "Content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(requestData),
    });

    const responseText = await sendyResponse.text();

    if (responseText.includes("Already subscribed")) {
      return NextResponse.json(
        { success: false, errorCode: "alreadySubscribed" },
        { status: 200 },
      );
    }

    if (!sendyResponse.ok || !["1", "true"].includes(responseText)) {
      console.error(
        `Error subscribing user: Sendy returned an error response: ${responseText}, Status: ${sendyResponse.status}`,
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
