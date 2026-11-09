import { atom } from "nanostores";

/** Actual artifact basenames, shared with the form page URL coordinator. */
export const $schemaFile = atom<string>("schema.json");
export const $sourceFile = atom<string>("index.tsp");
