/**
 * @file Storybook decorator, enabling internationalization for each story.
 * @see https://storybook.js.org/docs/writing-stories/decorators
 */
import { StoryContext } from "@storybook/react";

import { NextIntlClientProvider } from "next-intl";
import React from "react";

import { defaultLocale, formats, timeZone } from "../src/i18n/config";

const I18nStoryWrapper = (
  Story: React.ComponentType,
  context: StoryContext,
) => {
  const locale = (context.globals.locale as string) ?? defaultLocale;

  return (
    <NextIntlClientProvider
      formats={formats}
      timeZone={timeZone}
      locale={locale}
      messages={context.loaded.messages as undefined}
    >
      <Story />
    </NextIntlClientProvider>
  );
};

export default I18nStoryWrapper;
