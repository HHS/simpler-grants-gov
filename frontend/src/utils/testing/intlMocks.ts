import { TFn } from "src/types/intl";

function mockUseTranslations(translationKey: string) {
  return translationKey;
}

mockUseTranslations.rich = (translationKey: string) => translationKey;

export function useTranslationsMock() {
  return mockUseTranslations as TFn;
}

// mocking all types of messages, could split by message type in the future
export const mockMessages = {
  Process: {
    intro: {
      boxes: ["firstKey"],
    },
    milestones: {
      high_level_roadmap_items: ["firstIcon"],
    },
  },
  Research: {
    impact: {
      boxes: ["firstKey"],
    },
  },
};
