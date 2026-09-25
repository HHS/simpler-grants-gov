import { buildNewRelicBrowserScript } from "src/utils/newRelicBrowserScript";

jest.mock("src/services/logger/simplerLogger", () => ({
  logger: { info: jest.fn() },
}));

// Runs a generated inline script the way the browser would.
const runScript = (script: string): void => {
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function(script) as () => void;
  fn();
};

const HEADER = "window.NREUM={};/* nr loader */";
const VALID_ID = "3f2b8c1e-9a4d-4c7b-8e21-5d6f7a8b9c0d";

describe("buildNewRelicBrowserScript", () => {
  it("returns an empty string when there is no NR browser header", () => {
    expect(buildNewRelicBrowserScript("", VALID_ID)).toBe("");
  });

  it("returns the header unchanged when there is no correlation id", () => {
    expect(buildNewRelicBrowserScript(HEADER)).toBe(HEADER);
    expect(buildNewRelicBrowserScript(HEADER, "")).toBe(HEADER);
  });

  it("returns the header unchanged when the correlation id is not a UUIDv4", () => {
    expect(buildNewRelicBrowserScript(HEADER, "not-a-uuid")).toBe(HEADER);
    expect(buildNewRelicBrowserScript(HEADER, '");alert(1);//')).toBe(HEADER);
  });

  it("sets correlation_id right after the loader when the id is valid", () => {
    const script = buildNewRelicBrowserScript(HEADER, VALID_ID);

    expect(script.startsWith(HEADER)).toBe(true);
    expect(script).toContain(
      `window.newrelic.setCustomAttribute("correlation_id","${VALID_ID}")`,
    );
    // loader must come first so window.newrelic exists when the call runs
    expect(script.indexOf("setCustomAttribute")).toBeGreaterThan(
      script.indexOf(HEADER) + HEADER.length - 1,
    );
  });

  it("calls setCustomAttribute on window.newrelic when executed", () => {
    const setCustomAttribute = jest.fn();
    const script = buildNewRelicBrowserScript(
      "window.newrelic={setCustomAttribute:window.__nrSpy};",
      VALID_ID,
    );
    (window as unknown as { __nrSpy: jest.Mock }).__nrSpy = setCustomAttribute;

    runScript(script);

    expect(setCustomAttribute).toHaveBeenCalledWith("correlation_id", VALID_ID);
  });

  it("does not throw when window.newrelic is missing at execution time", () => {
    const script = buildNewRelicBrowserScript("/* no loader */", VALID_ID);
    delete (window as unknown as { newrelic?: unknown }).newrelic;

    expect(() => runScript(script)).not.toThrow();
  });
});
