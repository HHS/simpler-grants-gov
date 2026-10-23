import path from "node:path";
import keyContacts from "./key-contacts.json" with { type: "json" };
import epaKeyContacts from "./epa-key-contacts.json" with { type: "json" };
import rr from "./research-related-senior-key-person-profile.json" with { type: "json" };
import rrExpanded from "./research-and-related-senior-key-person-profile-expanded.json" with { type: "json" };
import nsfExpanded from "./nsf-senior-key-person-profile-expanded.json" with { type: "json" };
import shared from "./reasons.json" with { type: "json" };
import { FORMS_ROOT } from "../harness/load.ts";
import { readReasons, resolve } from "./store.ts";

const reasons = readReasons(shared);
/** Static imports keep the site's build and dev refresh aware of the authored data. */
export const RECORDS = [
  ["key-contacts", keyContacts],
  ["epa-key-contacts", epaKeyContacts],
  ["research-related-senior-key-person-profile", rr],
  ["research-and-related-senior-key-person-profile-expanded", rrExpanded],
  ["nsf-senior-key-person-profile-expanded", nsfExpanded],
].map(([name, data]) => ({
  file: path.join(FORMS_ROOT, "parity/diffs", `${name}.json`),
  diff: resolve(data, reasons),
}));

/** Every form the suite checks. A plan with a `spec_id` must be listed here. */
export const DIFFS = RECORDS.map((record) => record.diff);
if (new Set(DIFFS.map((diff) => diff.slug)).size !== DIFFS.length)
  throw new Error("Duplicate plan slug in difference registration.");
