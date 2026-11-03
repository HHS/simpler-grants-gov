import { atom } from "nanostores";

/** The data entered in the form preview, shared with the Data tab. */
export const $previewData = atom<unknown>({});

/** Which of the preview's outputs the Data tab shows. */
export type DataView = "json" | "xml";
export const $dataView = atom<DataView>("json");
