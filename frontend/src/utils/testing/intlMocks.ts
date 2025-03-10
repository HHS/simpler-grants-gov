import { TFn } from "src/types/intl";

export function mockUseTranslations(translationKey: string) {
  return translationKey;
}

mockUseTranslations.rich = (translationKey: string) => translationKey;

export function useTranslationsMock() {
  return mockUseTranslations as TFn;
}

export const localeParams = new Promise<{ locale: string }>((resolve) => {
  resolve({ locale: "en" });
});

// mocking all types of messages, could split by message type in the future
export const mockMessages = {
  Research: {
    impact: {
      boxes: ["firstKey"],
    },
  },
  Roadmap: {
    pageHeaderTitle: "Product roadmap",
    sections: {
      progress: {
        title: "progress test title",
        contentItems: [
          [{ title: "test title 1", content: "test content 1" }],
          [{ title: "test title 2", content: "test content 2" }],
        ],
      },
      milestones: {
        title: "milestones test title",
        contentItems: [{ title: "test title 3", content: "test content 3" }],
      },
      process: {
        title: "process test title",
        sectionSummary: "process test summary",
        contentItems: [{ title: "test title 4", content: "test content 4" }],
      },
    },
  },
};
