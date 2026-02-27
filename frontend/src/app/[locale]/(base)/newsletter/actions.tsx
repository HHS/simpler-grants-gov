"use server";

import { isEmpty } from "lodash";
import { environment } from "src/constants/environments";
import { TFn } from "src/types/intl";
import { z } from "zod";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

import { ValidationErrors } from "src/components/newsletter/SubscriptionForm";

type sendyResponse = {
  validationErrors: ValidationErrors;
  errorMessage: string | ReactNode;
};

export async function subscribeEmail(_prevState: unknown, formData: FormData) {
  const t = await getTranslations();

  const { errorMessage, validationErrors } = await subscribeEmailAction(
    t,
    formData,
  );
  if (errorMessage || !isEmpty(validationErrors)) {
    return {
      errorMessage,
      validationErrors,
    };
  }
  // Navigate to the sub confirmation page if no error returns short circuit the function
  redirect(`/newsletter/confirmation`);
}

export async function subscribeEmailAction(
  t: TFn,
  formData: FormData,
): Promise<sendyResponse> {
  const errorMessage = t.rich("Subscribe.errors.server", {
    "email-link": (content) => (
      <a href="mailto:simpler@grants.gov">{content}</a>
    ),
  });
  const schema = z.object({
    name: z.string().min(1, {
      message: t("Subscribe.errors.missingName"),
    }),
    email: z
      .string()
      .min(1, {
        message: t("Subscribe.errors.missingEmail"),
      })
      .email({
        message: t("Subscribe.errors.invalidEmail"),
      }),
  });

  const validatedFields = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
  });

  // Return early if the form data is invalid (server side validation!)
  if (!validatedFields.success) {
    return {
      errorMessage: "",
      validationErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // hp = honeypot, if this field is filled in, the form is likely spam
  // https://sendy.co/api
  const rawFormData = {
    name: formData.get("name") as string,
    LastName: formData.get("LastName") as string,
    email: formData.get("email") as string,
    hp: formData.get("hp") as string,
  };

  try {
    const sendyApiUrl = environment.SENDY_API_URL;
    const sendyApiKey = environment.SENDY_API_KEY;
    const list = environment.SENDY_LIST_ID;
    const requestData = {
      list,
      subform: "yes",
      boolean: "true",
      api_key: sendyApiKey,
      hp: rawFormData.hp,
      name: rawFormData.name,
      LastName: rawFormData.LastName,
      email: rawFormData.email,
    };

    const sendyResponse = await fetch(`${sendyApiUrl}/subscribe`, {
      method: "POST",
      headers: {
        "Content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(requestData),
    });

    const responseData = await sendyResponse.text();
    // If the user is already subscribed, return an error message
    if (responseData.includes("Already subscribed")) {
      return {
        errorMessage: t("Subscribe.errors.alreadySubscribed"),
        validationErrors: {},
      };
    }

    // If the response is not ok or the response data is not what we expect, return an error message
    if (!sendyResponse.ok || !["1", "true"].includes(responseData)) {
      console.error(
        `Error subscribing user: Sendy returned an error response: ${responseData}, Status: ${sendyResponse.status}`,
      );
      return {
        errorMessage,
        validationErrors: {},
      };
    }
  } catch (e) {
    // General try failure catch error
    const error = e as Error;
    console.error(
      `Error subscribing user: Exception: ${error.message} ${error.cause?.toString() || ""}`,
    );
    return {
      errorMessage,
      validationErrors: {},
    };
  }
  return {
    errorMessage: "",
    validationErrors: {},
  };
}
