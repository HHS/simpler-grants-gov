// @vitest-environment jsdom
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import SummaryList from "./SummaryList";

const renderSummary = (value: string) => {
  const host = document.createElement("div");
  host.innerHTML = renderToStaticMarkup(
    <SummaryList
      sections={[
        {
          items: [
            { label: "Finding", value, required: true },
            { label: "Other required answer", value: "", required: true },
          ],
        },
      ]}
    />,
  );
  return host;
};

describe("collapsed answer previews", () => {
  it("shortens a long answer visibly and points to the existing full-entry action", () => {
    const answer = "Source-valid fictional finding. "
      .repeat(200)
      .slice(0, 4000);
    const host = renderSummary(answer);
    const preview = host.querySelector("dd")!.textContent!;
    expect(Array.from(preview).length).toBeLessThanOrEqual(240);
    expect(preview.endsWith("…")).toBe(true);
    expect(host.textContent).toContain("Open the entry to read them in full.");
    expect(answer).toHaveLength(4000);
  });

  it("keeps short and missing answers unchanged without an unnecessary hint", () => {
    const short = renderSummary("Short finding");
    expect(short.querySelector("dd")!.textContent).toBe("Short finding");
    expect(short.textContent).not.toContain("shortened");
    expect(short.querySelectorAll("dd")[1].textContent).toBe("Missing");
    expect(short.querySelectorAll("dd")[1].className).toBe(
      "collapsible__value--missing",
    );
    expect(renderSummary("").textContent).toBe("Not started");
  });
});
