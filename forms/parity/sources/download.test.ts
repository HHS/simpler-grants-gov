import { setTimeout } from "node:timers/promises";
import { afterEach, describe, expect, it, vi } from "vitest";

import { download } from "./download.ts";

vi.mock("node:timers/promises", () => ({
  setTimeout: vi.fn().mockResolvedValue(undefined),
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.mocked(setTimeout).mockClear();
});

describe("source downloads", () => {
  it("returns a successful body without waiting", async () => {
    const fetch = vi.fn().mockResolvedValue(new Response("source"));
    vi.stubGlobal("fetch", fetch);
    expect(await download("https://example.test/form.xsd")).toEqual(
      Buffer.from("source"),
    );
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
    expect(setTimeout).not.toHaveBeenCalled();
  });

  it("retries a dropped connection with exponential backoff", async () => {
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("ECONNRESET"))
      .mockResolvedValueOnce(new Response("source"));
    vi.stubGlobal("fetch", fetch);
    expect(await download("https://example.test/form.xsd")).toEqual(
      Buffer.from("source"),
    );
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(setTimeout).toHaveBeenCalledExactlyOnceWith(250);
  });

  it("retries 5xx responses and cancels their bodies", async () => {
    const failed = new Response("unavailable", { status: 503 });
    const cancel = vi.spyOn(failed.body!, "cancel");
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(failed)
      .mockResolvedValueOnce(new Response("ok"));
    vi.stubGlobal("fetch", fetch);
    expect(await download("https://example.test/form.xsd")).toEqual(
      Buffer.from("ok"),
    );
    expect(cancel).toHaveBeenCalledOnce();
    expect(setTimeout).toHaveBeenCalledExactlyOnceWith(250);
  });

  it("does not retry a 4xx response", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response("missing", { status: 404 }));
    vi.stubGlobal("fetch", fetch);
    await expect(download("https://example.test/form.xsd")).rejects.toThrow(
      "HTTP 404",
    );
    expect(fetch).toHaveBeenCalledOnce();
    expect(setTimeout).not.toHaveBeenCalled();
  });

  it.each(["network", "server"])(
    "stops after four %s failures",
    async (kind) => {
      const fetch =
        kind === "network"
          ? vi.fn().mockRejectedValue(new TypeError("ECONNRESET"))
          : vi
              .fn()
              .mockImplementation(() =>
                Promise.resolve(new Response("bad", { status: 500 })),
              );
      vi.stubGlobal("fetch", fetch);
      await expect(download("https://example.test/form.xsd")).rejects.toThrow(
        kind === "network" ? "ECONNRESET" : "HTTP 500",
      );
      expect(fetch).toHaveBeenCalledTimes(4);
      expect(vi.mocked(setTimeout).mock.calls).toEqual([[250], [500], [1000]]);
    },
  );

  it("retries errors while reading the response body", async () => {
    const broken = new Response("partial");
    vi.spyOn(broken, "arrayBuffer").mockRejectedValueOnce(
      new TypeError("terminated"),
    );
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(broken)
      .mockResolvedValueOnce(new Response("complete"));
    vi.stubGlobal("fetch", fetch);
    expect(await download("https://example.test/form.xsd")).toEqual(
      Buffer.from("complete"),
    );
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("times out every attempt, including response body consumption", async () => {
    const nativeTimeout = AbortSignal.timeout.bind(AbortSignal);
    const timeout = vi
      .spyOn(AbortSignal, "timeout")
      .mockImplementation(() => nativeTimeout(1));
    const fetch = vi.fn().mockImplementation((_url, { signal }: RequestInit) =>
      Promise.resolve({
        ok: true,
        arrayBuffer: () =>
          new Promise((_resolve, reject) => {
            signal!.addEventListener("abort", () => reject(signal!.reason), {
              once: true,
            });
          }),
      }),
    );
    vi.stubGlobal("fetch", fetch);
    await expect(download("https://example.test/form.xsd")).rejects.toThrow();
    expect(fetch).toHaveBeenCalledTimes(4);
    expect(timeout.mock.calls).toEqual([
      [30_000],
      [30_000],
      [30_000],
      [30_000],
    ]);
  });
});
