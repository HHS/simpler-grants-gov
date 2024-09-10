export const messages = {
  Beta_alert: {
    alert_title:
      "Attention! Go to <LinkToGrants>www.grants.gov</LinkToGrants> to search and apply for grants.",
    alert:
      "Simpler.Grants.gov is a work in progress. Thank you for your patience as we build this new website.",
  },
  OpportunityListing: {
    page_title: "Opportunity Listing",
    meta_description: "Summary details for the specific opportunity listing.",
    intro: {
      agency: "Agency: ",
      assistanceListings: "Assistance Listings: ",
      lastUpdated: "Last Updated: ",
    },
    description: {
      description: "Description",
      eligible_applicants: "Eligible Applicants",
      additional_info: "Additional Information on eligibility",
      contact_info: "Grantor contact information",
    },
  },
  Index: {
    page_title: "Simpler.Grants.gov",
    meta_description:
      "A one‑stop shop for all federal discretionary funding to make it easy for you to discover, understand, and apply for opportunities.",
    goal: {
      title: "The goal",
      paragraph_1:
        "We want Grants.gov to be an extremely simple, accessible, and easy-to-use tool for posting, finding, sharing, and applying for federal financial assistance. Our mission is to increase access to grants and improve the grants experience for everyone.",
      title_2: "For applicants",
      paragraph_2:
        "We’re improving the way you search for and discover funding opportunities, making it easier to find and apply.",
      title_3: "For grantmakers",
      paragraph_3:
        "If you work for a federal grantmaking agency, we’re making it easier for your communities to find the funding they need.",
      cta: "Sign up for project updates",
    },
    process_and_research: {
      title_1: "The process",
      title_2: "The research",
      paragraph_1:
        "This project is transparent, iterative, and agile. All of the code we’re writing is open source and our roadmap is public. As we release new versions, you can try out functional software and give us feedback on what works and what can be improved to inform what happens next.",
      paragraph_2:
        "We conducted extensive research in 2023 to gather insights from applicants, potential applicants, and grantmakers. We’re using these findings to guide our work. And your ongoing feedback will inform and inspire new features as we build a simpler Grants.gov together.",
      cta_1: "Learn about what’s happening",
      cta_2: "Read the research findings",
    },
    fo_title: "Improvements to funding opportunity announcements",
    fo_paragraph_1:
      "Funding opportunities should not only be easy to find, share, and apply for. They should also be easy to read and understand. Our objective is to simplify and organize funding opportunities announcements. ",
    fo_paragraph_2:
      "We want to help grantmakers write clear, concise announcements that encourage strong submissions from qualified applicants and make opportunities more accessible to everyone.",
    fo_title_2: "View our grant announcement prototypes",
    fo_paragraph_3:
      "We recently simplified the language of four grant announcements and applied visual and user‑centered design principles to increase their readability and usability.",
    acl_prototype: "Link to ACL Notice of Funding Opportunity example pdf",
    acf_prototype: "Link to ACF Notice of Funding Opportunity example pdf",
    cdc_prototype: "Link to CDC Notice of Funding Opportunity example pdf",
    samhsa_prototype:
      "Link to SAMHSA Notice of Funding Opportunity example pdf",
    fo_title_3: "We want to hear from you!",
    fo_paragraph_4:
      "We value your feedback. Tell us what you think of grant announcements and grants.gov.",
    fo_title_4:
      "Are you a first‑time applicant? Created a workspace but haven't applied yet?",
    fo_paragraph_5:
      "We're especially interested in hearing from first‑time applicants and organizations that have never applied for funding opportunities. We encourage you to review our announcements and share your feedback, regardless of your experience with federal grants.",
    wtgi_paragraph_2:
      "<strong>Questions?</strong> Contact us at <email>{{email}}</email>.",
  },
  Research: {
    page_title: "Research | Simpler.Grants.gov",
    meta_description:
      "A one‑stop shop for all federal discretionary funding to make it easy for you to discover, understand, and apply for opportunities.",
    intro: {
      title: "Our existing research",
      content:
        "We conducted extensive research in 2023 to gather insights from applicants, potential applicants, and grantmakers. We’re using these findings to guide our work. And your ongoing feedback will inform and inspire new features as we build a simpler Grants.gov together.",
    },
    methodology: {
      title: "The methodology",
      paragraph_1:
        "<p>Applicants and grantmakers were selected for a series of user interviews to better understand their experience using Grants.gov. We recruited equitably to ensure a diverse pool of participants.</p><p>The quantity of participants was well above industry standards. Of the applicants who were interviewed, 26% were first-time applicants, 39% were occasional applicants, and 34% were frequent applicants.</p><p>With the findings from these interviews, we defined user archetypes and general themes to guide the Simpler.Grants.gov user experience.</p>",
      title_2: "Research objectives:",
      paragraph_2:
        "<ul><li>Examine existing user journeys and behaviors, identifying how Grants.gov fits into their overall approach</li><li>Learn from user experiences, roles, challenges</li><li>Identify barriers and how a simpler Grants.gov can create a more intuitive user experience, especially for new users</li></ul>",
      title_3:
        "Want to be notified when there are upcoming user research efforts?",
      cta: "Sign up for project updates",
    },
    archetypes: {
      title: "Applicant archetypes",
      paragraph_1:
        "Archetypes are compelling summaries that highlight the types of applicants that Grants.gov serves. They’re informed by and summarize user research data, and represent user behaviors, attitudes, motivations, pain points, and goals. We’ll use these archetypes to influence our design decisions, guide the product’s direction, and keep our work human-centered. ",
      novice: {
        title: "The Novice",
        paragraph_1:
          "Applicants lacking familiarity with the grant application process, including first-time or infrequent applicants and those who never apply",
        paragraph_2:
          "Novices are often new to the grants application process. They face a steep learning curve to find and apply for funding opportunities. Solving their needs will generate a more inclusive Grants.gov experience.",
      },
      collaborator: {
        title: "The Collaborator",
        paragraph_1:
          "Applicants who've applied before, working with colleagues or partner organizations to increase their chances of success",
        paragraph_2:
          "Collaborators have more familiarity with Grants.gov. But they face challenges with coordinating application materials, and often resorting to tools and resources outside of Grants.gov.",
      },
      maestro: {
        title: "The Maestro",
        paragraph_1:
          "Frequent applicants familiar with Grants.gov, who are often directly responsible for managing multiple applications at once",
        paragraph_2:
          "Maestros have an established approach to applying, which may include software and tools outside of Grants.gov. Their primary concerns are rooted in determining grant feasibility and staying ahead of deadlines.",
      },
      supervisor: {
        title: "The Supervisor",
        paragraph_1:
          "Applicants who have a more senior role at organizations and have less frequent direct involvement with Grants.gov than Maestros.",
        paragraph_2:
          "Supervisors are responsible for oversight, approvals, final submissions, and keeping registrations up to date. Their time is limited, as they're often busy with the organization's other needs.",
      },
    },
    themes: {
      title: "General themes",
      paragraph_1:
        "The existing Grants.gov website works best for those who use it regularly. Larger organizations and teams of Collaborators and Maestros are typically more familiar with the ins and outs of the system. To create a simpler Grants.gov with an intuitive user experience that addresses the needs of all archetypes, four themes were defined:",
      title_2: "Frictionless functionality ",
      paragraph_2:
        "Reduce the burden on applicants and grantmakers, from both a process and systems perspective, by addressing the pain points that negatively affect their experience",
      title_3: "Sophisticated self-direction",
      paragraph_3:
        "Meet users where they are during crucial moments, by providing a guided journey through opt-in contextual support that reduces their need to find help outside the system",
      title_4: "Demystify the grants process",
      paragraph_4:
        "Ensure that all users have the same easy access to instructional and educational information that empowers them to have a smoother, informed, and confident user experience",
      title_5: "Create an ownable identity",
      paragraph_5:
        "Create a presence that reflections our mission and supports our users through visual brand, content strategy, and user interface design systems",
    },
    impact: {
      title: "Where can we have the most impact?",
      paragraph_1:
        "The most burden is on the Novice to become an expert on the grants process and system. In order to execute our mission, there is a need to improve awareness, access, and choice. This requires reaching out to those who are unfamiliar with the grant application process.",
      paragraph_2: "There are many common barriers that users face:",
      title_2:
        "Are there challenges you’ve experienced that aren’t captured here?",
      paragraph_3:
        "If you would like to share your experiences and challenges as either an applicant or grantmaker, reach out to us at <strong><email>simpler@grants.gov</email></strong> or <strong><newsletter>sign up for project updates <arrowUpRightFromSquare></arrowUpRightFromSquare></newsletter></strong> to be notified of upcoming user research efforts.",
      boxes: [
        {
          title: "Digital connectivity",
          content:
            "Depending on availability and geography, a stable internet connection is not a guarantee to support a digital-only experience.",
        },
        {
          title: "Organization size",
          content:
            "Not all organizations have dedicated resources for seeking grant funding. Many are 1-person shops who are trying to do it all.",
        },
        {
          title: "Overworked",
          content:
            "New organizations are often too burdened with internal paperwork and infrastructure to support external funding and reporting.",
        },
        {
          title: "Expertise",
          content:
            "Small organizations face higher turnover, and alumni often take their institutional knowledge and expertise with them when they leave.",
        },
        {
          title: "Cognitive load",
          content:
            "Applicants often apply for funding through several agencies, requiring they learn multiple processes and satisfy varying requirements.",
        },
        {
          title: "Language",
          content:
            "Applicants are faced with a lot of jargon without context or definitions, which is especially difficult when English is not their native language.",
        },
        {
          title: "Education",
          content:
            "It often requires a high level of education to comprehend the complexity and language of funding opportunity announcements.",
        },
        {
          title: "Lost at the start",
          content:
            "Novices don’t see a clear call-to-action for getting started, and they have trouble finding the one-on-one help at the beginning of the process.",
        },
        {
          title: "Overwhelmed by search",
          content:
            "New applicants misuse the keyword search function and have trouble understanding the acronyms and terminology.",
        },
        {
          title: "Confused by announcements",
          content:
            "Novices have difficulty determining their eligibility and understanding the details of the funding opportunity announcement.",
        },
        {
          title: "Time",
          content:
            'Most individuals wear a lot of hats (community advocate, program lead, etc.) and "grants applicant" is only part of their responsibilities and requires efficiency.',
        },
        {
          title: "Blindsided by requirements",
          content:
            "New applicants are caught off guard by SAM.gov registration and often miss the format and file name requirements.",
        },
      ],
    },
  },
  Process: {
    page_title: "Process | Simpler.Grants.gov",
    meta_description:
      "A one‑stop shop for all federal discretionary funding to make it easy for you to discover, understand, and apply for opportunities.",
    intro: {
      title: "Our open process",
      content:
        "This project is transparent, iterative, and agile. All of the code we’re writing is open source and our roadmap is public. As we regularly release new versions of Simpler.Grants.gov, you'll see what we're building and prioritizing. With each iteration, you'll be able to try out functional software and give us feedback on what works and what can be improved to inform what happens next.",
      boxes: [
        {
          title: "Transparent",
          content:
            "We’re building a simpler Grants.gov in the open. You can see our plans and our progress. And you can join us in shaping the vision and details of the features we build.",
        },
        {
          title: "Iterative",
          content:
            "We’re releasing features early and often through a continuous cycle of planning, implementation, and assessment. Each cycle will incrementally improve the product, as we incorporate your feedback from the prior iteration.",
        },
        {
          title: "Agile",
          content:
            "We’re building a simpler Grants.gov <italics>with you</italics>, not <italics>for you</italics>. Our process gives us the flexibility to swiftly respond to feedback and adapt to changing priorities and requirements.",
        },
      ],
    },
    milestones: {
      tag: "The high-level roadmap",
      icon_list: [
        {
          title: "Find",
          content:
            "<p>Improve how applicants discover funding opportunities that they’re qualified for and that meet their needs.</p>",
        },
        {
          title: "Advanced reporting",
          content:
            "<p>Improve stakeholders’ capacity to understand, analyze, and assess grants from application to acceptance.</p><p>Make non-confidential Grants.gov data open for public analysis.</p>",
        },
        {
          title: "Apply",
          content:
            "<p>Streamline the application process to make it easier for all applicants to apply for funding opportunities.</p>",
        },
      ],
      roadmap_1: "Find",
      title_1: "Milestone 1",
      name_1:
        "Laying the foundation with a modern Application Programming Interface (API)",
      paragraph_1:
        "To make it easier to discover funding opportunities, we’re starting with a new modern API to make grants data more accessible. Our API‑first approach will prioritize data at the beginning, and make sure data remains a priority as we iterate. It’s crucial that the Grants.gov website, 3rd‑party apps, and other services can more easily access grants data. Our new API will foster innovation and be a foundation for interacting with grants in new ways, like SMS, phone, email, chat, and notifications.",
      sub_title_1: "What’s an API?",
      sub_paragraph_1:
        "Think of the API as a liaison between the Grants.gov website and the information and services that power it. It’s software that allows two applications to talk to each other or sends data back and forth between a website and a user.",
      sub_title_2: "Are you interested in the tech?",
      sub_paragraph_2:
        "We’re building a RESTful API. And we’re starting with an initial endpoint that allows API users to retrieve basic information about each funding opportunity.",
      cta_1: "View the API milestone on GitHub",
      roadmap_2: "Find",
      title_2: "Milestone 2",
      name_2: "A new search interface accessible to everyone",
      paragraph_2:
        "Once our new API is in place, we’ll begin focusing on how applicants most commonly access grants data. Our first user-facing milestone will be a simple search interface that makes data from our modern API accessible to anyone who wants to try out new ways to search for funding opportunities.",
      sub_title_3: "Can’t wait to try out the new search?",
      sub_paragraph_3:
        "Search will be the first feature on Simpler.Grants.gov that you’ll be able to test. It’ll be quite basic at first, and you’ll need to continue using <LinkToGrants>www.grants.gov</LinkToGrants> as we iterate. But your feedback will inform what happens next.",
      sub_paragraph_4:
        "Be sure to <LinkToNewsletter>sign up for product updates</LinkToNewsletter> so you know when the new search is available.",
      cta_2: "View the search milestone on GitHub",
    },
    involved: {
      title_1: "Do you have data expertise?",
      paragraph_1:
        "We're spending time up-front collaborating with stakeholders on API design and data standards. If you have subject matter expertise with grants data, we want to talk. Contact us at <strong><email>simpler@grants.gov</email></strong>.",
      title_2: "Are you code-savvy?",
      paragraph_2:
        "If you’re interested in contributing to the open-source project or exploring the details of exactly what we’re building, check out the project at <strong><github>https://github.com/HHS/simpler-grants-gov</github></strong> or join our community at <strong><wiki>wiki.simpler.hhs.gov</wiki></strong>.",
    },
  },
  Newsletter: {
    page_title: "Newsletter | Simpler.Grants.gov",
    title: "Newsletter signup",
    intro: "Subscribe to get Simpler.Grants.gov project updates in your inbox!",
    paragraph_1:
      "If you sign up for the Simpler.Grants.gov newsletter, we’ll keep you informed of our progress and you’ll know about every opportunity to get involved.",
    list: "<ul><li>Hear about upcoming milestones</li><li>Be the first to know when we launch new code</li><li>Test out new features and functionalities</li><li>Participate in usability tests and other user research efforts</li><li>Learn about ways to provide feedback </li></ul>",
    disclaimer:
      "The Simpler.Grants.gov newsletter is powered by the Sendy data service. Personal information is not stored within Simpler.Grants.gov.",
    errors: {
      missing_name: "Enter your first name.",
      missing_email: "Enter your email address.",
      invalid_email:
        "Enter an email address in the correct format, like name@example.com.",
      already_subscribed:
        "<email_address/> is already subscribed. If you’re not seeing our emails, check your spam folder and add no-reply@grants.gov to your contacts, address book, or safe senders list. If you continue to not receive our emails, contact <email>simpler@grants.gov</email>.",
      sendy:
        "Sorry, an unexpected error in our system occured when trying to save your subscription. If this continues to happen, you may email <email>simpler@grants.gov</email>. Error: <sendy_error/>",
    },
  },
  Newsletter_confirmation: {
    page_title: "Newsletter Confirmation | Simpler.Grants.gov",
    title: "You’re subscribed",
    intro:
      "You are signed up to receive project updates from Simpler.Grants.gov.",
    paragraph_1:
      "Thank you for subscribing. We’ll keep you informed of our progress and you’ll know about every opportunity to get involved.",
    heading: "Learn more",
    paragraph_2:
      "You can read all about our <strong><process-link>transparent process</process-link></strong> and what we’re doing now, or explore <strong><research-link>our existing user research</research-link></strong> and the findings that are guiding our work.",
    disclaimer:
      "The Simpler.Grants.gov newsletter is powered by the Sendy data service. Personal information is not stored within Simpler.Grants.gov. ",
  },
  Newsletter_unsubscribe: {
    page_title: "Newsletter Unsubscribe | Simpler.Grants.gov",
    title: "You have unsubscribed",
    intro:
      "You will no longer receive project updates from Simpler.Grants.gov. ",
    paragraph_1: "Did you unsubscribe by accident? Sign up again.",
    button_resub: "Re-subscribe",
    heading: "Learn more",
    paragraph_2:
      "You can read all about our <strong><process-link>transparent process</process-link></strong> and what we’re doing now, or explore <strong><research-link>our existing user research</research-link></strong> and the findings that are guiding our work.",
    disclaimer:
      "The Simpler.Grants.gov newsletter is powered by the Sendy data service. Personal information is not stored within Simpler.Grants.gov. ",
  },
  ErrorPages: {
    page_title: "Page Not Found | Simpler.Grants.gov",
    page_not_found: {
      title: "Oops! Page Not Found",
      message_content_1:
        "The page you have requested cannot be displayed because it does not exist, has been moved, or the server has been instructed not to let you view it. There is nothing to see here.",
      visit_homepage_button: "Return Home",
    },
  },
  Header: {
    nav_link_home: "Home",
    nav_link_process: "Process",
    nav_link_research: "Research",
    nav_link_newsletter: "Newsletter",
    nav_menu_toggle: "Menu",
    nav_link_search: "Search",
    title: "Simpler.Grants.gov",
  },
  Hero: {
    title: "We're building a simpler Grants.gov!",
    content:
      "This new website will be your go‑to resource to follow our progress as we improve and modernize the Grants.gov experience, making it easier to find, share, and apply for grants.",
    github_link: "Follow on GitHub",
  },
  Footer: {
    agency_name: "Grants.gov",
    agency_contact_center: "Grants.gov Program Management Office",
    telephone: "1-877-696-6775",
    return_to_top: "Return to top",
    link_twitter: "Twitter",
    link_youtube: "YouTube",
    link_github: "Github",
    link_rss: "RSS",
    link_newsletter: "Newsletter",
    link_blog: "Blog",
    logo_alt: "Grants.gov logo",
  },
  Identifier: {
    identity:
      "An official website of the <hhsLink>U.S. Department of Health and Human Services</hhsLink>",
    gov_content:
      "Looking for U.S. government information and services? Visit <usaLink>USA.gov</usaLink>",
    link_about: "About HHS",
    link_accessibility: "Accessibility support",
    link_foia: "FOIA requests",
    link_fear: "EEO/No Fear Act",
    link_ig: "Office of the Inspector General",
    link_performance: "Performance reports",
    link_privacy: "Privacy Policy",
    logo_alt: "HHS logo",
  },
  Layout: {
    skip_to_main: "Skip to main content",
  },
  Search: {
    title: "Search Funding Opportunities | Simpler.Grants.gov",
    meta_description:
      "A one‑stop shop for all federal discretionary funding to make it easy for you to discover, understand, and apply for opportunities.",
    description: "Try out our experimental search page.",
    accordion: {
      titles: {
        funding: "Funding instrument",
        eligibility: "Eligibility",
        agency: "Agency",
        category: "Category",
      },
    },
    bar: {
      label:
        "<strong>Search terms </strong><small>Enter keywords, opportunity numbers, or assistance listing numbers</small>",
      button: "Search",
    },
    callToAction: {
      title: "Search funding opportunities",
      description:
        "We’re incrementally improving this experimental search page. How can we make it easier to discover grants that are right for you? Let us know at <mail>simpler@grants.gov</mail>.",
    },
    opportunityStatus: {
      title: "Opportunity status",
      label: {
        forecasted: "Forecasted",
        posted: "Posted",
        closed: "Closed",
        archived: "Archived",
      },
    },
    resultsHeader: {
      message: "{count, plural, =1 {1 Opportunity} other {# Opportunities}}",
    },
    resultsListFetch: {
      title: "Your search did not return any results.",
      body: "<li>Check any terms you've entered for typos</li><li>Try different keywords</li><li>Make sure you've selected the right statuses</li><li>Try resetting filters or selecting fewer options</li>",
      paginationError:
        "You're trying to access opportunity results that are beyond the last page of data.",
    },
    resultsListItem: {
      status: {
        archived: "Archived: ",
        closed: "Closed: ",
        posted: "Closing: ",
        forecasted: "Forecasted",
      },
      summary: {
        posted: "Posted: ",
        agency: "Agency: ",
      },
      opportunity_number: "Opportunity Number: ",
      award_ceiling: "Award Ceiling: ",
      floor: "Floor: ",
    },
    sortBy: {
      options: {
        posted_date_desc: "Posted Date (newest)",
        posted_date_asc: "Posted Date (oldest)",
        close_date_desc: "Close Date (newest)",
        close_date_asc: "Close Date (oldest)",
        opportunity_title_asc: "Opportunity Title (A to Z)",
        opportunity_title_desc: "Opportunity Title (Z to A)",
        agency_asc: "Agency (A to Z)",
        agency_desc: "Agency (Z to A)",
        opportunity_number_asc: "Opportunity Number (descending)",
        opportunity_number_desc: "Opportunity Number (ascending)",
      },
      label: "Sort By",
    },
    filterToggleAll: {
      select: "Select All",
      clear: "Clear All",
    },
  },
};
