import { setTimeout } from "node:timers/promises";

const ATTEMPTS = 4;
const TIMEOUT_MS = 30_000;
const BACKOFF_MS = 250;

/** Retry transient transport/server failures, never an HTTP client error or source hash. */
export async function download(url: string): Promise<Buffer> {
  for (let attempt = 1; ; attempt++) {
    let response: Response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (response.ok) return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      if (attempt === ATTEMPTS) throw error;
      await setTimeout(BACKOFF_MS * 2 ** (attempt - 1));
      continue;
    }

    // Release the body before retrying, so a failing server does not keep connections open.
    await response.body?.cancel();
    if (response.status < 500 || response.status > 599 || attempt === ATTEMPTS) {
      throw new Error(`${url}: HTTP ${response.status}`);
    }
    await setTimeout(BACKOFF_MS * 2 ** (attempt - 1));
  }
}
