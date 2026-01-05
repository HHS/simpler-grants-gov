import React from "react";
import type { LocalizedPageProps } from "src/types/intl";
import { render } from "tests/react-utils";

export function makeLocalizedPageProps(locale: string = "en"): LocalizedPageProps {
  return { params: Promise.resolve({ locale }) };
}

export async function renderAppPage(
  Page: (props: LocalizedPageProps) => React.ReactElement | Promise<React.ReactElement>,
  locale: string = "en",
) {
  const ui = await Page(makeLocalizedPageProps(locale));
  return render(ui);
}
