import { getRequestConfig } from "next-intl/server";

import { formats, timeZone } from "./config";
import { getMessagesWithFallbacks } from "./getMessagesWithFallbacks";

/**
 * Make locale messages available to all server components.
 * This method is used behind the scenes by `next-intl/plugin`, which is setup in next.config.js.
 * @see https://next-intl-docs.vercel.app/docs/usage/configuration#nextconfigjs
 */

// @ts-expect-error TS2345: Argument of type error is expected behavior by next-intl maintainer: https://github.com/amannn/next-intl/issues/991#issuecomment-2050087509
export default getRequestConfig(async ({ locale }) => {
  return {
    formats,
    messages: await getMessagesWithFallbacks(locale),
    timeZone,
  };
});
