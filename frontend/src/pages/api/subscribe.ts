import type { NextApiRequest, NextApiResponse } from "next";
import { SendySubscribeForm } from "src/types/sendy";

export type Data = {
  message?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    name = "",
    email = "",
    LastName = "",
    hp = "",
  } = JSON.parse(req.body as string) as SendySubscribeForm;

  if (name === "" || email === "") {
    return res
      .status(400)
      .json({ error: "Invalid input. Please provide name and email." });
  }

  try {
    const sendyApiUrl = process.env.SENDY_API_URL || "";
    const sendyApiKey = process.env.SENDY_API_KEY || "";
    const list = process.env.SENDY_LIST_ID || "";
    const requestData = {
      list,
      subform: "yes",
      boolean: "true",
      api_key: sendyApiKey,
      hp,
      name,
      LastName,
      email,
    };

    const sendyResponse = await fetch(`${sendyApiUrl}/subscribe`, {
      method: "POST",
      headers: {
        "Content-type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(requestData),
    });

    const responseData = await sendyResponse.text();

    if (sendyResponse.ok) {
      if (responseData === "1" || responseData === "true") {
        return res
          .status(200)
          .json({ message: "User subscribed successfully." });
      } else {
        return res.status(400).json({ error: responseData });
      }
    } else {
      return res.status(500).json({
        error:
          "Failed to subscribe user due to a server error. Try again later.",
      });
    }
  } catch (error) {
    console.error("Error subscribing user:", (<Error>error).message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
