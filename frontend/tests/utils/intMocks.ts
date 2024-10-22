function mockUseTranslations(translationKey: string) {
  return translationKey;
}

mockUseTranslations.rich = (translationKey: string) => translationKey;

export function useTranslationsMock() {
  return mockUseTranslations;
}

// mocking all types of messages, could split by message type in the future
export const mockMessages = {
  Process: {
    intro: {
      boxes: ["firstKey"],
    },
    milestones: {
      icon_list: ["firstIcon"],
    },
  },
  Research: {
    impact: {
      boxes: ["firstKey"],
    },
  },
};
