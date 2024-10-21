"use server";

import { environment } from "src/constants/environments";
import { z } from "zod";

import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { ValidationErrors } from "../../../components/subscribe/SubscriptionForm";

type sendyResponse = {
  validationErrors: ValidationErrors;
  errorMessage: string;
};

export async function subscribeEmail(prevState: any, formData: FormData) {
  const t = await getTranslations("Subscribe");

  const { errorMessage, validationErrors } = await subscribeEmailAction(
    t,
    prevState,
    formData,
  );
  if (errorMessage ?? validationErrors) {
    return {
      errorMessage,
      validationErrors,
    };
  }
  // Navigate to the sub confirmation page if no error returns short circuit the function
  redirect(`/subscribe/confirmation`);
}

export async function subscribeEmailAction(
  t: any,
  prevState: any,
  formData: FormData,
): Promise<sendyResponse> {
  const schema = z.object({
    name: z.string().min(1, {
      message: t("errors.missing_name"),
    }),
    email: z
      .string()
      .min(1, {
        message: t("errors.missing_email"),
      })
      .email({
        message: t("errors.invalid_email"),
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

  // TODO: Implement the email subscription logic here, putting old SENDY code here for reference
  // Note: Noone is sure where the api url/key/list ID are at the moment and I believe the intention is
  // to move away from SENDY to a different service.
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
        errorMessage: t("errors.already_subscribed"),
        validationErrors: {},
      };
    }

    // If the response is not ok or the response data is not what we expect, return an error message
    if (!sendyResponse.ok || !["1", "true"].includes(responseData)) {
      return {
        errorMessage: t("errors.server"),
        validationErrors: {},
      };
    }
  } catch (error) {
    // General try failure catch error
    console.error("Error subscribing user:", (<Error>error).message);
    return {
      errorMessage: t("errors.server"),
      validationErrors: {},
    };
  }
  return {
    errorMessage: "",
    validationErrors: {},
  };
}
