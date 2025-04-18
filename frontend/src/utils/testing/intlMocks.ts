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
  Vision: {
    pageTitle: "Vision | Simpler.Grants.gov",
    pageHeaderTitle: "Our vision",
    pageHeaderParagraph:
      "We believe that applying for federal financial assistance should be simple, accessible, and easy. We aim to be the best tool for posting, finding, and sharing funding opportunities.",
    sections: {
      mission: {
        title: "Our mission",
        paragraph:
          "We want to increase access to federal funding opportunities and continuously improve the grants experience for everyone—whether you’re an applicant searching for funding or a federal agency posting opportunities.",
        contentItems: [
          [
            {
              title: "Find",
              content:
                "Help applicants and grantors find relevant funding opportunities by improving search and making listings easier to read",
            },
          ],
          [
            {
              title: "Apply",
              content:
                "Simplify the application process, empowering applicants of all experience levels to confidently submit funding requests with fewer obstacles.",
            },
          ],
          [
            {
              title: "Report",
              content:
                "Make it easier for applicants and grantors to track, manage, and fulfill reporting requirements throughout the grant lifecycle.",
            },
          ],
        ],
      },
      goals: {
        title: "Our goals",
        contentItems: [
          [
            {
              title: "Reduce the burden",
              content:
                "Make the entire process more efficient for both applicants and grantors by reducing friction and addressing challenges across all stages of the grant journey.",
            },
            {
              title: "Support users at every step",
              content:
                "Offer timely, contextual support to meet users where they are. Provide a guided journey that reduces their need to search elsewhere.",
            },
          ],
          [
            {
              title: "Demystify the process",
              content:
                "Ensure that everyone has easy access to guidance and information that empowers them to navigate the system with confidence.",
            },
            {
              title: "Cultivate trust through consistency",
              content:
                "Create a recognizable, reliable experience through our visual brand identity and human-centered approach.",
            },
          ],
        ],
      },
      get_there: {
        title: "How we get there",
        contentTitle: "Guided by research, shaped by your experience",
        paragraph_1:
          "To build a better Grants.gov, we listen to the people who use it. Through ongoing research, user feedback, and real conversations with applicants and grantors, we identify challenges and prioritize opportunities for improvement.",
        paragraph_2:
          "Our research has helped us understand the needs of all types of Grants.gov users—from first-time visitors to experienced applicants managing multiple grants. These insights drive our efforts to create a simpler, more accessible system for everyone.",
        link_text_1: "Read more about the research on our public wiki",
        link_text_2: "Sign up to participate in future user studies",
      },
    },
  },
};
