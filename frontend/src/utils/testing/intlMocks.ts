import ResearchParticipantGuide from "src/components/research-participant-guide/ResearchParticipantGuide";
import { TFn } from "src/types/intl";

export function mockUseTranslations(
  translationKey: string,
  options?: { [key: string]: string },
) {
  if (!options?.count) {
    return translationKey;
  }
  return `${translationKey} ${Object.values(options).join(",")}`;
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
      timeline: {
        title: "timeline test title",
        contentItems: [
          [
            {
              date: "Smarch 13",
              title: "test title 1",
              content: "test content 1",
            },
          ],
          [
            {
              date: "Smarch 14",
              title: "test title 2",
              content: "test content 2",
            },
          ],
        ],
      },
    },
  },
  Homepage: {
    pageTitle: "Test Title",
    pageDescription: "Test page description",
    github_link: "Follow on GitHub",
    sections: {
      experimental: {
        title: "experimental test title",
        canDoHeader: "test can do header",
        canDoSubHeader: "test can do subheader",
        canDoParagraph: "test can do paragraph",
        tryLink: "test try link",
        cantDoHeader: "test cant do header",
        cantDoParagraph: "test cant do paragraph",
        iconSections: [
          {
            description: "test icon section description",
            http: "test iconSections http",
            iconName: "test iconSections iconName",
            link: "test iconSections link",
            title: "test iconSections title",
          },
        ],
      },
      building: {
        title: "test building title",
        paragraphs: ["test building paragraph"],
      },
      involved: {
        title: "test title",
        technicalTitle: "test technical title",
        technicalDescription: "test technical description",
        technicalLink: "test technical link",
        participateTitle: "test participate title",
        participateDescription: "test participate description",
        participateLink: "test participate link",
        discourseLink: "test discourse link",
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
      getThere: {
        title: "How we get there",
        contentTitle: "Guided by research, shaped by your experience",
        paragraph1:
          "To build a better Grants.gov, we listen to the people who use it. Through ongoing research, user feedback, and real conversations with applicants and grantors, we identify challenges and prioritize opportunities for improvement.",
        paragraph2:
          "Our research has helped us understand the needs of all types of Grants.gov users—from first-time visitors to experienced applicants managing multiple grants. These insights drive our efforts to create a simpler, more accessible system for everyone.",
        linkText1: "Read more about the research on our public wiki",
        linkText2: "Sign up to participate in future user studies",
      },
    },
  },
  ResearchParticipantGuide: {
    h1: "Design Research Participant Guide",
    intro: "This guide is for participants in Simpler Grants design research studies. If you have been contacted by the Simpler Grants team to participate in a study, read through these steps to learn more about the process and let us know if you have any questions.",
    beforeHeader: "Before the interview",
    beforeItems:[
      "You will or already have received an email asking for your participation in a user interview.",
      "Taking part in a research study is voluntary. If you opt-in to participate, you'll receive an emailed invitation with your scheduled time.",
      "For remote studies, you will receive a Zoom link to participate.",
      "For in person studies, we will coordinate logistics with you.",
      "If you require an accommodation, let us know at least 2 days prior to the interview.",
      "The interview will be conducted via Zoom by a member of our team. One person will be conducting the interview, and one or more team members will be taking notes.",
    ],
    duringHeader: "During the interview",
    duringItems: [
      "The researcher will walk you through what the process looks like at the beginning of the study and ask for your verbal permission to record the session.",
      "The goal of design research is to understand how people use the products we make in the real world so that we can make them better for everyone who uses them.",
      "The study will be focused on understanding your work and how you use our products in your work. We will ask you questions and/or have you use working software or prototypes of improvements we're working on.",
      "At the end of the session, we will ask you for your verbal permission to use what we learn to make the product better.",
    ],
  },
};
