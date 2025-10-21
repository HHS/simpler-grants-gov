export const messages = {
  Homepage: {
    pageTitle: "Let's build a simpler Grants.gov together",
    pageDescription:
      "Simpler.Grants.gov is our testing ground for the next generation of Grants.gov. With your help, we're setting a new standard for transparency and usability in government services. ",
    githubLink: "Follow on GitHub",
    sections: {
      experimental: {
        title: "Test out our experimental features",
        canDoHeader: "Tell us what's working (and what's not)",
        canDoSubHeader: "What you can do now",
        canDoParagraph:
          "Search real Grants.gov data here on Simpler.Grants.gov. Our search aims to deliver closer matches to your keywords and filters. We also redesigned the results and opportunity listings to make them easier to navigate and read.",
        tryLink: "Try the new simpler search",
        cantDoHeader: "What you can't do quite yet",
        cantDoParagraph:
          "For now, you need to visit Grants.gov to access more advanced features like applying. We're working to bring the application process to this website soon. In the meantime, follow our roadmap to stay updated on our progress.",
        iconSections: [
          {
            description:
              "We're excited to hear from you to learn how we can improve.",
            http: "mailto:simpler@grants.gov",
            iconName: "build",
            link: "Contact us at simpler@grants.gov",
            title: "Send us your feedback and suggestions.",
          },
          {
            description:
              "Our newsletter delivers the latest news straight to your inbox.",
            http: "/newsletter",
            iconName: "mail",
            link: "Subscribe to our newsletter",
            title: "Be the first to hear about new features.",
          },
        ],
      },
      building: {
        title: "Building <span>with</span> you, not <span>for</span> you",
        paragraphs: [
          "Transparency is the foundation of good government. That's why we're committed to sharing our process and working in the open.",
          "All of our code is open-source and the roadmap is public. We welcome everyone to collaborate with us on the vision and details of every feature we build.",
        ],
      },
      involved: {
        title: "More ways to get involved",
        technicalTitle: "Contribute your technical expertise",
        technicalDescription:
          "We're always excited to welcome new open source developers to our community.",
        technicalLink: "Learn how to contribute code",
        participateTitle: "Participate in user research",
        participateDescription:
          "Be a part of the design process by taking part in usability tests and interviews.",
        participateLink: "Sign up to participate in future studies",
        discourseLink: "Chat on the Discourse forum",
      },
    },
  },
  Events: {
    pageTitle: "Events | Simpler.Grants.gov",
    pageDescription:
      "From new developments to upcoming opportunities, we want you to be a part of the journey.",
    header: "Events",
    upcoming: {
      title: "Upcoming Events",
      startDate: "Begins March 10, 2025",
      header: "Spring 2025 Collaborative Coding Challenge",
      description:
        "The next Simpler.Grants.gov Coding Challenge gives participants an opportunity to showcase their creativity and coding capabilities while competing for awards from our $4,000 prize pool.",
      link: "Sign up to participate",
    },
    demo: {
      title: "Simpler.Grants.gov Big Demo",
      description:
        "The Simpler.Grants.gov team hosts public demonstrations of our newest features and functionality.  These virtual sessions highlight our progress, share user research insights, and showcase community engagement efforts. ",
      watch: "Watch recordings of past Big Demos",
      watchLink: "January 15, 2025",
    },
    codingChallenge: {
      title: "Collaborative Coding Challenge",
      descriptionP1:
        "The Simpler.Grants.gov Collaborative Coding Challenge is an entirely virtual interactive event attended by members of the public, government, stakeholders, and our internal development team.",
      descriptionP2:
        "Small teams of external developers, designers, and researchers pitch a proposal to solve a problem with the strongest of them added to the product roadmap.",
      link: "Read about the Spring 2025 Coding Challenge",
    },
  },
  BetaAlert: {
    alertTitle:
      "This site is a work in progress, with new features and updates based on your feedback.",
    alert:
      "Search for grants here. To use more advanced features or to apply, go to <LinkToGrants>Grants.gov</LinkToGrants>.",
  },
  OpportunityListing: {
    pageTitle: "Opportunity Listing",
    metaDescription:
      "Read detailed information about this funding opportunity.",
    saveButton: {
      save: "Save",
      saved: "Saved",
      loading: "Updating",
    },
    saveMessage: {
      save: "This opportunity was saved to <linkSavedOpportunities>Saved opportunities</linkSavedOpportunities>.",
      unsave: "This opportunity was unsaved.",
      errorSave: "Error saving. Please try again.",
      errorUnsave: "Error undoing save. Please try again.",
    },
    saveloginModal: {
      button: "Sign in with Login.gov",
      close: "Cancel",
      description:
        "You'll be redirected to Login.gov to sign in or create an account. Then, you'll return to Simpler.Grants.gov as a signed-in user.",
      help: "Use your Login.gov account to sign in to Simpler.Grants.gov. Don't have an account? You can create one.",
      title: "Sign in to save this opportunity",
    },
    startApplicationModal: {
      startApplicationButtonText: "Start new application",
      cancelButtonText: "Cancel",
      error: "Error starting the application. Please try again.",
      login: "Sign in to work on the application",
      loggedOut:
        "You must be logged in to proceed. Please login and start your application again.",
      requiredText: "All fields are required.",
      saveButtonText: "Create Application",
      title: "Start a new application",
      ineligibleTitle:
        "It looks like you're not eligible to start a new application through this site",
      applyingFor: "Applying for: ",
      fields: {
        name: {
          label: "Name of this application",
          description:
            "Create a unique and descriptive application filing name so it is easy for you and the granting agency to track.",
          validationError: "Enter a filing name. You can change this later.",
        },
        organizationSelect: {
          label: "Who's applying?",
          default: "-Select-",
          notListed: "My organization isn't listed",
          validationError:
            "Select an organization. If yours isn't listed, you'll need to apply through Grants.gov.",
        },
      },
      description: {
        organizationIntro:
          "This opportunity is part of a pilot program. To apply through Simpler.Grants.gov, you must:",
        pilotIntro:
          "Welcome to our new, simpler application process. In partnership with the Bureau of Reclamation, we ensure your application is processed by the agency normally.",
        organizationApply: "To apply as part of an organization you must:",
        applyingForOrg:
          "Be applying on behalf of an organization (individual applications aren't accepted at this time)",
        poc: "Be the EBiz POC (Electronic Business Point of Contact) for your organization",
        uei: "Have a valid UEI (a Unique Entity ID <link>registered through SAM.gov</link>)",
        ineligibleGoToGrants:
          "If you believe this is an error or prefer not to participate in this pilot, we recommend applying through <link>Grants.gov</link>.",
        goToGrants:
          "If you prefer not to participate in this pilot, we recommend applying through <link>Grants.gov</link>.",
        support:
          "For product support, contact us at <telephone>1-800-581-4726</telephone> or <email>simpler@grants.gov</email>. You can also apply through <link>Grants.gov</link> if you prefer.",
        pilotGoToGrants:
          "This opportunity is part of a pilot program. If you prefer not to participate in this pilot, we recommend applying through <link>Grants.gov</link>.",
        organizationIndividualIntro:
          "You can apply as an individual or organization. To apply as part of an organization you must:",
      },
    },
    intro: {
      agency: "Agency: ",
      assistanceListings: "Assistance Listings:",
      lastUpdated: "Last Updated: ",
      versionHistory: "View version history on Grants.gov",
    },
    description: {
      title: "Description",
      eligibility: "Eligibility",
      eligibleApplicants: "Eligible applicants",
      additionalInfo: "Additional information",
      contactInfo: "Grantor contact information",
      contactDescription: "Description",
      email: "Email",
      showDescription: "Show full description",
      hideSummaryDescription: "Hide full description",
      jumpToDocuments: "Jump to all documents",
      zipDownload: "Download all",
    },
    documents: {
      title: "Documents",
      tableColDescription: "Description",
      tableColFileName: "File name",
      tableColLastUpdated: "Last updated",
      type: {
        fundingDetails: "Funding Details",
        other: "Other",
      },
      noDocuments: "No documents are currently available.",
    },
    awardInfo: {
      yes: "Yes",
      no: "No",
      programFunding: "Program Funding",
      expectedAwards: "Expected awards",
      awardCeiling: "Award Maximum",
      awardFloor: "Award Minimum",
      opportunityNumber: "Funding opportunity number",
      costSharing: "Cost sharing or matching requirement",
      fundingInstrument: "Funding instrument type",
      opportunityCategory: "Opportunity Category",
      opportunityCategoryExplanation: "Opportunity Category Explanation",
      fundingActivity: "Category of Funding Activity",
      categoryExplanation: "Category Explanation",
    },
    history: {
      history: "History",
      postedDate: "Posted date",
      forecastPostedDate: "Forecast posted date",
      closingDate: "Original closing date for applications",
      archiveDate: "Archive date",
      forecastedAwardDate: "Estimated Award Date",
      forecastedPostDate: "Estimated Post Date",
      forecastedCloseDate: "Estimated Application Due Date",
      forecastedCloseDateDescription: "Estimated Due Date Description",
      forecastedCloseDateDescriptionNotAvailable: "Not available",
      forecastedProjectStartDate: "Estimated Project Start Date",
      forecastedLastUpdated: "Last Updated Date",
      fiscalYear: "Fiscal Year",

      version: "Version",
    },
    link: {
      title: "Link to additional information",
    },
    statusWidget: {
      archived: "Archived: ",
      closed: "Closed: ",
      closing: "Closing: ",
      forecasted: "Forecasted",
    },
    cta: {
      applyTitle: "Application process",
      applyContent:
        "This site is a work in progress. Go to www.grants.gov to apply, track application status, and subscribe to updates.",
      buttonContent: "View on Grants.gov",
    },
    genericErrorCta: "Please try refreshing the page.",
  },
  Application: {
    title: "Application",
    submissionValidationError: {
      title: "Your application could not be submitted",
      description:
        "All required fields or attachments in required forms must be completed or uploaded.",
      incompleteForm: "is incomplete. Answer all required questions to submit.",
      notStartedForm: "has not been started. Complete the form to submit.",
      missingIncludeInSubmission:
        'Select Yes or No for "Submit with application?" column in Conditionally-Required Forms section.',
    },
    submissionError: {
      title: "Your application could not be submitted",
      description:
        "<p>There was a technical problem on our end. Please try again.</p><p>If the problem persists, contact <email-link>simpler@grants.gov</email-link>.</p>",
    },
    submissionSuccess: {
      title: "Your application has been submitted",
      description:
        "The awarding agency will review and process it independently of Grants.gov. Once they receive your application, they will manage all further updates. Grants.gov won't have access to the status of your award.",
    },
    information: {
      applicant: "Applicant",
      applicantTypeIndividual: "Individual",
      applicationDownloadInstructions: "Download application instructions",
      applicationDownloadInstructionsLabel: "Instructions",
      specialInstructionsLabel: "Special instructions",
      specialInstructions: "No longer accepting applications",
      statusLabel: "Status",
      statusInProgress: "In progress",
      statusSubmitted: "Submitted",
      statusAccepted: "Accepted",
      uei: "UEI",
      renewal: "Renewal",
      closeDate: "Close date",
      closed: "Closed",
      status: "Status",
      submit: "Submit application",
      editApplicationFilingNameModal: {
        buttonText: "Edit filing name",
        title: "Change application filing name",
        label: "Application filing name",
        appliedFor: "Applying for: ",
        fieldRequirements: "All fields are required.",
        helperText:
          "Create a unique and descriptive name for this application so it's easy for you to track. You can change it up until the application is submitted.",
        buttonAction: "Save",
        buttonCancel: "Cancel",
      },
    },
    opportunityOverview: {
      opportunity: "Opportunity",
      name: "Name",
      number: "Number",
      posted: "Posted date",
      forecastDate: "Forecast posted date",
      agency: "Agency",
      assistanceListings: "Assistance listings",
      costSharingOrMatchingRequirement: "Cost Sharing or matching requirement",
      applicationInstruction: "Application instructions",
      grantorContactInfomation: "Grantor contact information",
      award: "Award",
      programFunding: "Program funding",
      expectedAward: "Expected award",
      awardMaximum: "Award maximum",
      awardMinimum: "Award minimum",
      estimatedAwardDate: "Estimated award date",
      estimatedProjectStartDate: "Estimated project start date",
    },
    competitionFormTable: {
      attachment: "Attachment",
      attachmentUnavailable: "Unavailable",
      conditionalForms: "Conditionally-Required Forms",
      conditionalFormsDescription:
        "These forms may be required based on your situation. Review the <instructionsLink>opportunity instructions</instructionsLink> and let us know if you plan to submit each form. If so, you'll need to complete it and upload any required documents.",
      downloadInstructions: "Download instructions",
      form: "Form",
      instructions: "Instructions",
      include: "Include with application",
      requiredForms: " Required Forms",
      status: "Status",
      statuses: {
        not_started: "Not started.",
        in_progress: "Some issues found. Check your entries.",
        complete: "No issues detected.",
        attachmentDeleted: "An attachment was deleted.",
      },
      updated: "Last updated",
      includeFormInApplicationSubmissionDataLabel: "Submit with application",
      includeFormInApplicationSubmissionIncompleteMessage:
        "Some issues found. Check your entries.",
      updatedBy: "Last updated by",
    },
    attachments: {
      attachedDocument: "Attached document",
      attachments: "Attachments",
      attachmentsInstructions:
        "If the <instructionsLink>opportunity instructions</instructionsLink> require documentation not covered by one of the forms above, upload the files here. They must be in the file format (e.g., PDF, XLS, etc.) and named as specified.",
      action: "Action",
      cancelUpload: "Cancel upload",
      delete: "Delete",
      uploading: "Uploading...",
      download: "Download",
      emptyTable: "No attachments uploaded",
      fileSize: "File Size",
      uploadBy: "Upload by",
      uploadDate: "Upload date",
      deleteModal: {
        titleText: "Delete",
        cancelDeleteCta: "Cancel",
        cautionDeletingAttachment: "Caution, deleting attachment",
        descriptionText:
          "You may have uploaded this attachment in response to a form question. Check to ensure you no longer need it.",
        deleteFileCta: "Delete file",
        deleteFilesCta: "Delete files",
        deleting: "Deleting...",
      },
    },
    applyForm: {
      errorTitle: "This form could not be saved",
      errorMessage:
        "<p>There was a technical problem on our end. Please try again.</p><p>If the problem persists, contact <email-link>simpler@grants.gov</email-link>.</p>",
      savedMessage: "No errors were detected.",
      savedTitle: "Form was saved",
      validationMessage:
        "Correct the following errors before submitting your application.",
      required: "A red asterisk <abr>*</abr> indicates a required field.",
      navTitle: "Sections in this form",
      unsavedChangesWarning:
        "You have unsaved changes or attachments that will be lost if you select OK.",
    },
  },
  Index: {
    pageTitle: "Simpler.Grants.gov",
    metaDescription:
      "Simpler.Grants.gov is improving how you discover, post, and apply for federal discretionary funding on Grants.gov.",
  },
  Vision: {
    pageTitle: "Vision | Simpler.Grants.gov",
    pageHeaderTitle: "Our vision",
    pageHeaderParagraph:
      "We believe that applying for federal financial assistance should be simple and straightforward. We aim to be the best tool for posting, finding, and sharing funding opportunities.",
    sections: {
      mission: {
        title: "Our mission",
        paragraph:
          "We're dedicated to making federal funding opportunities simpler to navigate and the grants experience more seamless for everyone.",
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
  Subscribe: {
    pageTitle: "Newsletter | Simpler.Grants.gov",
    metaDescription:
      "Sign up for email updates from the Simpler.Grants.gov team.",
    title: "Simpler Grants Newsletter",
    paragraph1:
      "Sign up to get project updates delivered to your inbox every few weeks.",
    paragraph2:
      "You'll be the first to hear about feature launches, upcoming events, user research, and more.",
    formLabel: "Subscribe to our newsletter",
    form: {
      name: "First Name",
      lastName: "Last Name",
      email: "Email",
      req: "required",
      opt: "optional",
      button: "Subscribe",
    },
    errors: {
      missingName: "Please enter a name.",
      missingEmail: "Please enter an email address.",
      invalidEmail:
        "Enter an email address in the correct format, like name@example.com.",
      server:
        "An error occurred when trying to save your subscription. If this continues to happen, email <email-link>simpler@grants.gov</email-link>.",
      alreadySubscribed: "This email address has already been subscribed.",
    },
  },
  SubscriptionConfirmation: {
    pageTitle: "Subscription Confirmation | Simpler.Grants.gov",
    title: "You're subscribed",
    intro:
      "You are signed up to receive project updates from Simpler.Grants.gov.",
    paragraph1:
      "Thank you for subscribing. We'll keep you informed of our progress and you'll know about every opportunity to get involved.",
    disclaimer:
      "The Simpler.Grants.gov email subscriptions are powered by the Sendy data service. Personal information is not stored within Simpler.Grants.gov.",
  },
  UnsubscriptionConfirmation: {
    pageTitle: "Unsubscribe | Simpler.Grants.gov",
    title: "You have unsubscribed",
    intro:
      "You will no longer receive project updates from Simpler.Grants.gov. ",
    paragraph: "Did you unsubscribe by accident? Sign up again.",
    buttonResub: "Re-subscribe",
    disclaimer:
      "The Simpler.Grants.gov email subscriptions are powered by the Sendy data service. Personal information is not stored within Simpler.Grants.gov.",
  },
  ErrorPages: {
    genericError: {
      pageTitle: "Error | Simpler.Grants.gov",
    },
    unauthorized: {
      pageTitle: "Unauthorized | Simpler.Grants.gov",
    },
    unauthenticated: {
      pageTitle: "Unauthenticated | Simpler.Grants.gov",
    },
    pageNotFound: {
      pageTitle: "Page Not Found | Simpler.Grants.gov",
      title: "Oops, we can't find that page.",
      messageContent: "It may have been moved or no longer exists.",
      visitHomepageButton: "Visit our homepage",
    },
  },
  Developer: {
    pageTitle: "Developer Portal | Simpler.Grants.gov",
    pageDescription:
      "Tools and resources for developers working on Simpler.Grants.gov",
    infoTitle: "API tools & management",
    canDoHeader: "What's available for developers",
    canDoSubHeader: "What you can do with an API key now",
    canDoParagraph:
      "You can call our REST endpoints to search the full catalog of funding opportunities and retrieve detailed information for any record. Current capabilities include keywords, fielded search, pagination, sorting for large result sets, and fetching structured details for a single opportunity. You can also manage your own credentials to create, view, rotate, and revoke API keys.",
    cantDoHeader: "Current limitations",
    cantDoParagraph:
      "<ul><li>Inactive API keys are automatically disabled after 30 days without use.</li><li>Write operations are not supported at this time, which means you cannot apply for funding, post/create opportunities, or create projects within an organization through the API.</li><li>Rate limiting is enforced to ensure reliability for all users; by default, 60 requests per minute and 10,000 requests per day per key. if you need higher throughput for a production integration, please contact us to discuss options.</li></ul><p>Additional management features (such as organization-level projects and roles) are on the roadmap but aren't available yet.</p>",
    apiDashboardLink: "Manage API Keys",
    iconSections: [
      {
        description:
          "Make your first API request in minutes. Learn the basics of the Simpler.Grants.gov API.",
        http: "https://wiki.simpler.grants.gov/product/api",
        iconName: "code",
        link: "Get started",
        title: "Developer quickstart",
      },
      {
        description: "Learn more about integrating our API into your project.",
        http: "https://api.simpler.grants.gov/docs#/",
        iconName: "local_library",
        link: "Read the docs",
        title: "API reference",
      },
    ],
  },
  ApiDashboard: {
    pageTitle: "API Dashboard | Simpler.Grants.gov",
    metaDescription: "Manage your API keys for Simpler.Grants.gov",
    heading: "API Dashboard",
    errorLoadingKeys: "Failed to load API keys",
    table: {
      headers: {
        apiKey: "API Key",
        dates: "Dates",
        editName: "Edit Name",
        deleteKey: "Delete Key",
      },
      dateLabels: {
        created: "Created:",
        lastUsed: "Last used:",
        never: "Never",
      },
      deleteButton: "Delete Key",
      deleteButtonTitle: "Delete this API key",
      emptyState:
        "You don't have any API keys yet. Create your first API key to get started.",
    },
    modal: {
      apiKeyNameLabel: "Name <required>(required)</required>",
      placeholder: "e.g., Production API Key",
      createTitle: "Create New API Key",
      createDescription:
        "Create a new key for use with the Simpler.Grants.gov API",
      editDescription: "Change the name of your Simpler.Grants.gov API key",
      createSuccessHeading: "API Key Created Successfully",
      editSuccessHeading: "API Key Renamed Successfully",
      createSuccessMessage:
        'Your API key "{keyName}" has been created successfully.',
      editSuccessMessage:
        'Your API key has been renamed from "{originalName}" to "{keyName}".',
      close: "Close",
      createErrorMessage:
        "There was an error creating your API key. Please try again.",
      editErrorMessage:
        "There was an error renaming your API key. Please try again.",
      nameRequiredError: "API key name is required",
      nameChangedError: "Please enter a different name",
      editTitle: "Rename API Key",
      createButtonText: "Create API Key",
      editNameButtonText: "Edit Name",
      creating: "Creating...",
      saving: "Saving...",
      saveChanges: "Save Changes",
      cancel: "Cancel",
      deleteTitle: "Delete API Key",
      deleteDescription:
        'To confirm deletion, type "delete" in the field below:',
      deleteConfirmationLabel:
        'Type "delete" to confirm <required>(required)</required>',
      deleteConfirmationPlaceholder: "delete",
      deleteConfirmationError: 'Please type "delete" to confirm deletion',
      deleteSuccessHeading: "API Key Deleted Successfully",
      deleteSuccessMessage:
        'Your API key "{keyName}" has been deleted successfully.',
      deleteErrorMessage:
        "There was an error deleting your API key. Please try again.",
      deleteButtonText: "Delete Key",
      deleting: "Deleting...",
    },
  },
  Header: {
    navLinks: {
      about: "About",
      community: "Community",
      developer: "Developer Portal",
      developers: "Developers",
      events: "Events",
      forum: "Discussion forum",
      home: "Home",
      login: "Sign in",
      logout: "Sign out",
      menuToggle: "Menu",
      research: "Research",
      roadmap: "Product roadmap",
      savedOpportunities: "Saved opportunities",
      savedSearches: "Saved search queries",
      search: "Search",
      newsletter: "Newsletter",
      vision: "Our vision",
      wiki: "Public wiki",
      workspace: "Workspace",
      account: "My account",
    },
    title: "Simpler.Grants.gov",
    tokenExpired: "You've been logged out. Please sign in again.",
  },
  HeaderLoginModal: {
    title: "Sign in to Simpler.Grants.gov",
    help: "Simpler.Grants.gov uses Login.gov to verify your identity and manage your account securely. You don't need a separate username or password for this site.",
    description:
      "You'll be redirected to Login.gov to sign in or create an account. Then, you'll return to Simpler.Grants.gov as a signed-in user.",
    button: "Sign in with Login.gov",
    close: "Cancel",
  },
  Footer: {
    agencyName: "Grants.gov",
    agencyContactCenter: "Grants.gov Program Management Office",
    telephone: "1-800-518-4726",
    returnToTop: "Return to top",
    logoAlt: "Grants.gov logo",
    explore: "Explore",
    simpler: "Simpler.Grants.gov",
    links: {
      home: "Home",
      search: "Search",
      vision: "Vision",
      roadmap: "Roadmap",
      events: "Events",
      newsletter: "Newsletter",
      subscribe: "Subscribe",
    },
    feedback: "To give feedback, contact: <email>simpler@grants.gov</email>",
    supportCenter: "Grants.gov Support Center",
    techSupport:
      "For technical support, contact: <email>support@grants.gov</email>",
    grantorSupport:
      "Grantors, contact the PMO through your <poc>Agency Point of Contact</poc>.",
  },
  Identifier: {
    identity:
      "An official website of the <hhsLink>U.S. Department of Health and Human Services</hhsLink>",
    govContent:
      "Looking for U.S. government information and services? Visit <usaLink>USA.gov</usaLink>",
    linkAbout: "About HHS",
    linkAccessibility: "Accessibility support",
    linkFoia: "FOIA requests",
    linkFear: "EEO/No Fear Act",
    linkIg: "Office of the Inspector General",
    linkPerformance: "Performance reports",
    linkPrivacy: "Privacy Policy",
    logoAlt: "HHS logo",
  },
  Layout: {
    skipToMain: "Skip to main content",
  },
  Errors: {
    heading: "We're sorry.",
    genericMessage: "There seems to have been an error.",
    tryAgain: "Please try again.",
    unauthorized: "Unauthorized",
    unauthenticated: "Not signed in",
    authorizationFail:
      "Sign in or user authorization failed. Please try again.",
    signInCTA: "Sign in first in order to view this page",
  },
  Search: {
    title: "Search Funding Opportunities | Simpler.Grants.gov",
    metaDescription:
      "Search for and discover relevant opportunities using our improved search.",
    description: "Try out our experimental search page.",
    filters: {
      searchNoResults: {
        title: "Your search didn't return any results.",
        heading: "Suggestions:",
        suggestions: [
          "Check any terms you've entered for typos",
          "Try different keywords",
          "Try resetting filters or selecting fewer options",
        ],
      },
    },
    table: {
      headings: {
        closeDate: "Close date",
        status: "Status",
        title: "Title",
        agency: "Agency",
        awardMin: "Award min",
        awardMax: "Award max",
      },
      statuses: {
        posted: "Open",
        forecasted: "Forecasted",
        archived: "Archived",
        closed: "Closed",
      },
      number: "Number",
      published: "Posted date",
      expectedAwards: "Expected awards",
      tbd: "TBD",
      saved: "Saved",
    },
    accordion: {
      any: "Any",
      all: "All",
      titles: {
        funding: "Funding instrument",
        eligibility: "Eligibility",
        agency: "Agency",
        category: "Category",
        status: "Opportunity status",
        closeDate: "Closing date range",
        costSharing: "Cost sharing",
      },
      options: {
        status: {
          forecasted: "Forecasted",
          posted: "Open",
          closed: "Closed",
          archived: "Archived",
        },
      },
    },
    bar: {
      label:
        "<strong>Search terms </strong><small>Enter keywords, opportunity numbers, or assistance listing numbers</small>",
      button: "Search",
      exclusionTip: `Tip: Use a minus sign to exclude words or phrases, like "-research"`,
    },
    drawer: {
      title: "Filters",
      submit: "View results",
      clearFilters: "Clear filters",
      toggleButton: "Filters",
    },
    callToAction: {
      title: "Search funding opportunities",
    },
    opportunitySaved: "Saved",
    resultsHeader: {
      message: "{count, plural, =1 {1 Opportunity} other {# Opportunities}}",
    },
    resultsListItem: {
      status: {
        archived: "Archived: ",
        closed: "Closed: ",
        posted: "Closing: ",
        forecasted: "Forecasted",
      },
      summary: {
        forecasted: "Forecast posted date: ",
        posted: "Posted date: ",
        agency: "Agency: ",
      },
      opportunityNumber: "Opportunity Number: ",
      awardCeiling: "Award Maximum: ",
      floor: "Minimum: ",
    },
    sortBy: {
      label: "Sort by",
    },
    filterToggleAll: {
      select: "Select All",
      clear: "Clear All",
    },
    loading: "Loading Results",
    genericErrorCta: "Please try your search again.",
    validationError: "Search Validation Error",
    tooLongError: "Search terms must be no longer than 100 characters.",
    exportButton: {
      title: "Export results",
    },
    betaAlert: {
      alertTitle: "How can we build a simpler search experience?",
      alert:
        "Fill out a <ethnioSurveyLink>1-minute survey</ethnioSurveyLink> and share your experience with Simpler and Classic Search.",
    },
    saveSearch: {
      heading: "Current search query",
      defaultSelect: "Select saved query",
      fetchSavedError: "Error loading saved query. Try again later.",
      help: {
        unauthenticated:
          "Use this set of search terms and filters often? Sign in to save this query to your account and use it again later. You can also copy and share the link to this query without signing in.",
        noSavedQueries:
          "Save this frequently used search query to your account. Apply it again later to save time when searching for opportunities.",
        authenticated:
          "Manage your saved search queries in your <strong>Workspace</strong>.",
        general: "About saved searches",
      },
      modal: {
        title: "Name this search query",
        loading: "Saving",
        description:
          "Save these search terms and filters with a name for easy access later.",
        inputLabel: "Name <required>(required)</required>",
        saveText: "Save",
        cancelText: "Cancel",
        closeText: "Close",
        emptyNameError: "Please name this query.",
        successTitle: "Query successfully saved",
        successDescription:
          "Manage your queries in your <workspaceLink>Workspace</workspaceLink>.",
        apiError: "Error loading saved query. Try again later.",
      },
      copySearch: {
        copy: {
          unauthenticated: "Copy this search query",
          authenticated: "Copy",
        },
        copying: "Copying",
        copied: "Copied!",
        snackbar:
          "This search query was copied to your clipboard. Paste it as a link anywhere.",
      },
    },
  },
  Maintenance: {
    heading: "Simpler.Grants.gov Is Currently Undergoing Maintenance",
    body: "Our team is working to improve the site, and we'll have it back up as soon as possible. In the meantime, please visit <LinkToGrants>www.Grants.gov</LinkToGrants> to search for funding opportunities and manage your applications.",
    signOff: "Thank you for your patience.",
    pageTitle: "Simpler.Grants.gov - Maintenance",
  },
  SavedSearches: {
    heading: "Saved search queries",
    noSavedCTAParagraphOne: "You don't have any saved queries yet.",
    noSavedCTAParagraphTwo:
      "As you search for opportunities, save your preferred combinations of terms and filters for easy access later. Return here to view and manage your saved queries.",
    searchButton: "Start a new search",
    title: "Saved Search Queries | Simpler.Grants.gov",
    error:
      "We encountered an issue while loading your saved search queries. If this keeps happening, please email simpler@grants.gov for help.",
    edit: "Edit name",
    delete: "Delete",
    // keys need to match exactly against keys defined in validSearchQueryParamKeys
    parameterNames: {
      status: "Status",
      fundingInstrument: "Funding instrument",
      eligibility: "Eligibility",
      agency: "Agency",
      category: "Category",
      query: "Search terms",
      page: "Page",
      sortby: "Sort by",
      closeDate: "Close date",
      costSharing: "Cost sharing",
      topLevelAgency: "Top level agency",
      andOr: "Query and/or operator",
    },
    editModal: {
      loading: "Updating",
      title: "Edit",
      inputLabel: "New name <required>(required)</required>",
      saveText: "Save",
      cancelText: "Cancel",
      closeText: "Close",
      emptyNameError: "Please name this query.",
      successTitle: "Query successfully updated",
      updatedNotification: "has been successfully updated to",
      apiError: "Error updating saved query. Try again later.",
    },
    deleteModal: {
      loading: "Deleting",
      title: "Delete saved query?",
      deleteText: "Yes, delete",
      cancelText: "Cancel",
      apiError: "Error deleting saved query. Try again later.",
      description: "Delete ",
    },
  },
  SavedOpportunities: {
    metaDescription: "View your saved funding opportunities.",
    heading: "Saved opportunities",
    noSavedCTAParagraphOne:
      "To add an opportunity to your list, use the Save button next to its title on the listing's page.",
    noSavedCTAParagraphTwo:
      "Saved opportunities will be starred in your search results, but you can only save and un-save from the specific opportunity page",
    searchButton: "Start a new search",
    title: "Saved Opportunities | Simpler.Grants.gov",
  },
  Roadmap: {
    pageTitle: "Roadmap | Simpler.Grants.gov",
    pageHeaderTitle: "Product roadmap",
    pageHeaderParagraph:
      "This project is transparent, iterative, and agile. All of the code we're writing is open source and our roadmap is public. See what we're building and prioritizing.",
    sections: {
      progress: {
        title: "What we're working on",
        contentItems: [
          [
            {
              title: "Beta launch of Simpler Search on Grants.gov",
              content:
                "<p>We're launching Simpler Search directly on Grants.gov alongside the classic search experience. This gives users a choice, helps us test traffic, and supports tools to improve usability and iterate more quickly based on user data.</p><p><linkGithub4571>Follow #4571 on GitHub</linkGithub4571></p>",
            },
            {
              title: "New opportunities for open-source collaboration",
              content:
                "<p>We're strengthening our open-source community by hosting our Discourse forum on a .gov domain and establishing regular public meetings to foster collaboration and transparency.</p><p><linkGithub4577>Follow #4577 on GitHub</linkGithub4577></p>",
            },
          ],
          [
            {
              title: "An 'Apply' workflow pilot",
              content:
                "<p>We're piloting the end-to-end grant application journey with grant seekers, testing submissions to help scale future support for all agencies.</p><p><linkGithub4572>Follow #4572 on GitHub</linkGithub4572></p>",
            },
            {
              title: "SOAP Proxy for the 'Apply' workflow",
              content:
                "<p>We're building a SOAP proxy to route all external applicant API traffic through Simpler.Grants.gov, setting the stage for a smooth shift to a modern REST interface.</p><p><linkGithub4575>Follow #4575 on GitHub</linkGithub4575></p>",
            },
          ],
          [
            {
              title: "User research on permissions",
              content:
                "<p>We're researching how users manage roles and permissions, shaping a new model to support most Grants.gov applicants and simplify authorization.</p><p><linkGithub4576>Follow #4576 on GitHub</linkGithub4576></p>",
            },
            {
              title: "Automated API key management",
              content:
                "<p>We're building tools so authorized users can securely generate and manage their API keys independently without admin support.</p><p><linkGithub4579>Follow #4579 on GitHub</linkGithub4579></p>",
            },
          ],
        ],
        link: "View all deliverables on GitHub",
      },
      milestones: {
        title: "What we've delivered",
        contentTitle: "Early 2025",
        contentItems: [
          {
            title: "Simpler application workflow prototype",
            content:
              "We created a comprehensive service blueprint showing how the existing Grants.gov application process could be simplified. Then, we prototyped an application form with persistent data storage and scoped a pilot for a small subset of opportunities.",
          },
          {
            title:
              "Full support for opportunity page attachments (NOFOs/downloads)",
            content:
              "The opportunity listings on Simpler.Grants.gov now show all of the information and file attachments available on Grants.gov. Design updates made the Notice of Funding Opportunity (NOFO) easier to access.",
          },
          {
            title: "Authentication via Login.gov",
            content:
              "Finalizing authentication enabled grant seekers to create an account using Login.gov's single sign-on platform. This move reduced the steps and friction users experience when signing up.",
          },
          {
            title: "Search & opportunity page improvements",
            content:
              "Applying feedback from the community, we iterated on improvements that made it easier to adjust search filter criteria, share search results, and save relevant results and opportunities.",
          },
        ],
        archivedRoadmapTitle: "Late 2024",
        archivedRoadmapItems: [
          {
            title: "RESTful API launch",
            content:
              "Our new modern API makes grants opportunity data more accessible, with an API‑first approach that prioritizes data and ensures that the Grants.gov website, 3rd‑party apps, and other services can more easily access grants data.",
          },
          {
            title: "Coding Challenge pilot",
            content:
              "We're excited to announce the successful pilot of the Collaborative Coding Challenge, which laid the groundwork for a scalable framework to support future open-source contributions. This event was conducted in a fully remote environment to bring together participants who engaged in innovative problem-solving and collaboration.",
          },
          {
            title: "Search UI usability test",
            content:
              "We've conducted sessions with grant seekers, grantors, and HHS staff to test the new design. This study revealed findings and uncovered tangible issues to be resolved in the next Search UI iteration.",
          },
          {
            title: "Opportunity page launch",
            content:
              "You can now view opportunity details on Simpler.Grants.gov, with action-oriented information in the right column and detailed content on the left. With this new design, grant seekers can make faster, more informed decisions about opportunities.",
          },
          {
            title: "First Co-Design Group recruitment",
            content:
              "We've recruited a cohort of community members with lived experience using Grants.gov to participate in the design process. Through a long-term engagement, these co-designers will ensure what we build delivers the most value to grant seekers who struggle most with the grants experience.",
          },
          {
            title: "Search interface launch",
            content:
              "Simpler.Grants.gov now has improved search capabilities that make it easier to find funding opportunities published by Grants.gov.",
          },
        ],
      },
      process: {
        title: "How we work",
        sectionSummary:
          "With each iteration of Simpler.Grants.gov, you'll be able to try out functional software and give us feedback on what works and what can be improved to inform what happens next.",
        contentItems: [
          {
            title: "Transparent",
            content:
              "We're building a simpler Grants.gov in the open. All of the code we're writing is open source and our roadmap is public.",
          },
          {
            title: "Agile",
            content:
              "We swiftly adapt to changing priorities and requirements based on the feedback we receive.",
          },
          {
            title: "Iterative",
            content:
              "We continuously release features, refining the product with each cycle based on public input. Send us your feedback and suggestions.",
            link: "mailto:simpler@grants.gov",
            linkText: "Contact us at simpler@grants.gov",
          },
          {
            title: "Co-planning",
            content:
              "We prioritize improvements to align with user needs through public ranking. Let us know what’s important to you.",
            link: "https://simplergrants.fider.io",
            linkText: "Vote on our proposals board",
          },
        ],
      },
      timeline: {
        title: "Key milestones",
        contentItems: [
          {
            date: "Summer 2025",
            title: "Simpler search, by default",
            content:
              "<p>Our easier-to-use search experience will become the default way to discover funding opportunities on Grants.gov. It's built to deliver stronger results with less fuss.</p><p><link-search>Try the new search now</link-search>.</p>",
          },
          {
            date: "Fall 2025",
            title: "Piloting a new way to apply",
            content:
              "<p>We'll test a simpler, more intuitive application workflow with a small group of partner agencies and funding opportunities.</p><p>Is your agency interested in participating? <link-form>Complete our interest form</link-form>, and we'll be in touch.</p>",
          },
          {
            date: "Next year",
            title: "A better application experience for everyone",
            content:
              "<p>All applicants will have the option to use our simpler workflow when applying through Grants.gov. We'll continue scaling up to support the needs of all agencies.</p>",
          },
        ],
      },
    },
  },
  // These values are currently for form enum translation, values coming fromt the API
  Form: {
    "AL: Alabama": "Alabama",
    "AK: Alaska": "Alaska",
    "AZ: Arizona": "Arizona",
    "AR: Arkansas": "Arkansas",
    "CA: California": "California",
    "CO: Colorado": "Colorado",
    "CT: Connecticut": "Connecticut",
    "DE: Delaware": "Delaware",
    "DC: District of Columbia": "District of Columbia",
    "FL: Florida": "Florida",
    "GA: Georgia": "Georgia",
    "HI: Hawaii": "Hawaii",
    "ID: Idaho": "Idaho",
    "IL: Illinois": "Illinois",
    "IN: Indiana": "Indiana",
    "IA: Iowa": "Iowa",
    "KS: Kansas": "Kansas",
    "KY: Kentucky": "Kentucky",
    "LA: Louisiana": "Louisiana",
    "ME: Maine": "Maine",
    "MD: Maryland": "Maryland",
    "MA: Massachusetts": "Massachusetts",
    "MI: Michigan": "Michigan",
    "MN: Minnesota": "Minnesota",
    "MS: Mississippi": "Mississippi",
    "MO: Missouri": "Missouri",
    "MT: Montana": "Montana",
    "NE: Nebraska": "Nebraska",
    "NV: Nevada": "Nevada",
    "NH: New Hampshire": "New Hampshire",
    "NJ: New Jersey": "New Jersey",
    "NM: New Mexico": "New Mexico",
    "NY: New York": "New York",
    "NC: North Carolina": "North Carolina",
    "ND: North Dakota": "North Dakota",
    "OH: Ohio": "Ohio",
    "OK: Oklahoma": "Oklahoma",
    "OR: Oregon": "Oregon",
    "PA: Pennsylvania": "Pennsylvania",
    "RI: Rhode Island": "Rhode Island",
    "SC: South Carolina": "South Carolina",
    "SD: South Dakota": "South Dakota",
    "TN: Tennessee": "Tennessee",
    "TX: Texas": "Texas",
    "UT: Utah": "Utah",
    "VT: Vermont": "Vermont",
    "VA: Virginia": "Virginia",
    "WA: Washington": "Washington",
    "WV: West Virginia": "West Virginia",
    "WI: Wisconsin": "Wisconsin",
    "WY: Wyoming": "Wyoming",
    "AS: American Samoa": "American Samoa",
    "FM: Federated States of Micronesia": "Federated States of Micronesia",
    "GU: Guam": "Guam",
    "MH: Marshall Islands": "Marshall Islands",
    "MP: Northern Mariana Islands": "Northern Mariana Islands",
    "PW: Palau": "Palau",
    "PR: Puerto Rico": "Puerto Rico",
    "VI: Virgin Islands": "Virgin Islands",
    "FQ: Baker Island": "Baker Island",
    "HQ: Howland Island": "Howland Island",
    "DQ: Jarvis Island": "Jarvis Island",
    "JQ: Johnston Atoll": "Johnston Atoll",
    "KQ: Kingman Reef": "Kingman Reef",
    "MQ: Midway Islands": "Midway Islands",
    "BQ: Navassa Island": "Navassa Island",
    "LQ: Palmyra Atoll": "Palmyra Atoll",
    "WQ: Wake Island": "Wake Island",
    "AA: Armed Forces Americas (except Canada)":
      "Armed Forces Americas (except Canada)",
    "AE: Armed Forces Europe, the Middle East, and Canada":
      "Armed Forces Europe, the Middle East, and Canada",
    "AP: Armed Forces Pacific": "Armed Forces Pacific",
    "AFG: AFGHANISTAN": "Afghanistan",
    "XQZ: AKROTIRI": "Akrotiri",
    "ALB: ALBANIA": "Albania",
    "DZA: ALGERIA": "Algeria",
    "AND: ANDORRA": "Andorra",
    "AGO: ANGOLA": "Angola",
    "AIA: ANGUILLA": "Anguilla",
    "ATA: ANTARCTICA": "Antarctica",
    "ATG: ANTIGUA AND BARBUDA": "Antigua And Barbuda",
    "ARG: ARGENTINA": "Argentina",
    "ARM: ARMENIA": "Armenia",
    "ABW: ARUBA": "Aruba",
    "XAC: ASHMORE AND CARTIER ISLANDS": "Ashmore And Cartier Islands",
    "AUS: AUSTRALIA": "Australia",
    "AUT: AUSTRIA": "Austria",
    "AZE: AZERBAIJAN": "Azerbaijan",
    "BHS: BAHAMAS, THE": "Bahamas, The",
    "BHR: BAHRAIN": "Bahrain",
    "BGD: BANGLADESH": "Bangladesh",
    "BRB: BARBADOS": "Barbados",
    "XBI: BASSAS DA INDIA": "Bassas Da India",
    "BLR: BELARUS": "Belarus",
    "BEL: BELGIUM": "Belgium",
    "BLZ: BELIZE": "Belize",
    "BEN: BENIN": "Benin",
    "BMU: BERMUDA": "Bermuda",
    "BTN: BHUTAN": "Bhutan",
    "BOL: BOLIVIA": "Bolivia",
    "BES: BONAIRE, SINT EUSTATIUS, AND SABA":
      "Bonaire, Sint Eustatius, And Saba",
    "BIH: BOSNIA AND HERZEGOVINA": "Bosnia And Herzegovina",
    "BWA: BOTSWANA": "Botswana",
    "BVT: BOUVET ISLAND": "Bouvet Island",
    "BRA: BRAZIL": "Brazil",
    "IOT: BRITISH INDIAN OCEAN TERRITORY": "British Indian Ocean Territory",
    "BRN: BRUNEI": "Brunei",
    "BGR: BULGARIA": "Bulgaria",
    "BFA: BURKINA FASO": "Burkina Faso",
    "MMR: BURMA": "Burma",
    "BDI: BURUNDI": "Burundi",
    "CPV: CABO VERDE": "Cabo Verde",
    "KHM: CAMBODIA": "Cambodia",
    "CMR: CAMEROON": "Cameroon",
    "CAN: CANADA": "Canada",
    "CYM: CAYMAN ISLANDS": "Cayman Islands",
    "CAF: CENTRAL AFRICAN REPUBLIC": "Central African Republic",
    "TCD: CHAD": "Chad",
    "CHL: CHILE": "Chile",
    "CHN: CHINA": "China",
    "CXR: CHRISTMAS ISLAND": "Christmas Island",
    "CPT: CLIPPERTON ISLAND": "Clipperton Island",
    "CCK: COCOS (KEELING) ISLANDS": "Cocos (Keeling) Islands",
    "COL: COLOMBIA": "Colombia",
    "COM: COMOROS": "Comoros",
    "COG: CONGO (BRAZZAVILLE)": "Congo (Brazzaville)",
    "COD: CONGO (KINSHASA)": "Congo (Kinshasa)",
    "COK: COOK ISLANDS": "Cook Islands",
    "XCS: CORAL SEA ISLANDS": "Coral Sea Islands",
    "CRI: COSTA RICA": "Costa Rica",
    "CIV: CÔTE D'IVOIRE": "Côte D'Ivoire",
    "HRV: CROATIA": "Croatia",
    "CUB: CUBA": "Cuba",
    "CUW: CURAÇAO": "Curaçao",
    "CYP: CYPRUS": "Cyprus",
    "CZE: CZECHIA": "Czechia",
    "DNK: DENMARK": "Denmark",
    "XXD: DHEKELIA": "Dhekelia",
    "DGA: DIEGO GARCIA": "Diego Garcia",
    "DJI: DJIBOUTI": "Djibouti",
    "DMA: DOMINICA": "Dominica",
    "DOM: DOMINICAN REPUBLIC": "Dominican Republic",
    "ECU: ECUADOR": "Ecuador",
    "EGY: EGYPT": "Egypt",
    "SLV: EL SALVADOR": "El Salvador",
    "XAZ: ENTITY 1": "Entity 1",
    "XCR: ENTITY 2": "Entity 2",
    "XCY: ENTITY 3": "Entity 3",
    "XKM: ENTITY 4": "Entity 4",
    "XKN: ENTITY 5": "Entity 5",
    "AX3: ENTITY 6": "Entity 6",
    "GNQ: EQUATORIAL GUINEA": "Equatorial Guinea",
    "ERI: ERITREA": "Eritrea",
    "EST: ESTONIA": "Estonia",
    "SWZ: ESWATINI": "Eswatini",
    "ETH: ETHIOPIA": "Ethiopia",
    "XEU: EUROPA ISLAND": "Europa Island",
    "FLK: FALKLAND ISLANDS (ISLAS MALVINAS)":
      "Falkland Islands (Islas Malvinas)",
    "FRO: FAROE ISLANDS": "Faroe Islands",
    "FJI: FIJI": "Fiji",
    "FIN: FINLAND": "Finland",
    "FRA: FRANCE": "France",
    "GUF: FRENCH GUIANA": "French Guiana",
    "PYF: FRENCH POLYNESIA": "French Polynesia",
    "ATF: FRENCH SOUTHERN AND ANTARCTIC LANDS":
      "French Southern And Antarctic Lands",
    "GAB: GABON": "Gabon",
    "GMB: GAMBIA, THE": "Gambia, The",
    "XGZ: GAZA STRIP": "Gaza Strip",
    "GEO: GEORGIA": "Georgia",
    "DEU: GERMANY": "Germany",
    "GHA: GHANA": "Ghana",
    "GIB: GIBRALTAR": "Gibraltar",
    "XGL: GLORIOSO ISLANDS": "Glorioso Islands",
    "GRC: GREECE": "Greece",
    "GRL: GREENLAND": "Greenland",
    "GRD: GRENADA": "Grenada",
    "GLP: GUADELOUPE": "Guadeloupe",
    "GTM: GUATEMALA": "Guatemala",
    "GGY: GUERNSEY": "Guernsey",
    "GIN: GUINEA": "Guinea",
    "GNB: GUINEA-BISSAU": "Guinea-Bissau",
    "GUY: GUYANA": "Guyana",
    "HTI: HAITI": "Haiti",
    "HMD: HEARD ISLAND AND MCDONALD ISLANDS":
      "Heard Island And Mcdonald Islands",
    "HND: HONDURAS": "Honduras",
    "HKG: HONG KONG": "Hong Kong",
    "HUN: HUNGARY": "Hungary",
    "ISL: ICELAND": "Iceland",
    "IND: INDIA": "India",
    "IDN: INDONESIA": "Indonesia",
    "IRN: IRAN": "Iran",
    "IRQ: IRAQ": "Iraq",
    "IRL: IRELAND": "Ireland",
    "IMN: ISLE OF MAN": "Isle Of Man",
    "ISR: ISRAEL": "Israel",
    "ITA: ITALY": "Italy",
    "JAM: JAMAICA": "Jamaica",
    "XJM: JAN MAYEN": "Jan Mayen",
    "JPN: JAPAN": "Japan",
    "JEY: JERSEY": "Jersey",
    "JOR: JORDAN": "Jordan",
    "XJN: JUAN DE NOVA ISLAND": "Juan De Nova Island",
    "KAZ: KAZAKHSTAN": "Kazakhstan",
    "KEN: KENYA": "Kenya",
    "KIR: KIRIBATI": "Kiribati",
    "PRK: KOREA, NORTH": "Korea, North",
    "KOR: KOREA, SOUTH": "Korea, South",
    "XKS: KOSOVO": "Kosovo",
    "KWT: KUWAIT": "Kuwait",
    "KGZ: KYRGYZSTAN": "Kyrgyzstan",
    "LAO: LAOS": "Laos",
    "LVA: LATVIA": "Latvia",
    "LBN: LEBANON": "Lebanon",
    "LSO: LESOTHO": "Lesotho",
    "LBR: LIBERIA": "Liberia",
    "LBY: LIBYA": "Libya",
    "LIE: LIECHTENSTEIN": "Liechtenstein",
    "LTU: LITHUANIA": "Lithuania",
    "LUX: LUXEMBOURG": "Luxembourg",
    "MAC: MACAU": "Macau",
    "MDG: MADAGASCAR": "Madagascar",
    "MWI: MALAWI": "Malawi",
    "MYS: MALAYSIA": "Malaysia",
    "MDV: MALDIVES": "Maldives",
    "MLI: MALI": "Mali",
    "MLT: MALTA": "Malta",
    "MTQ: MARTINIQUE": "Martinique",
    "MRT: MAURITANIA": "Mauritania",
    "MUS: MAURITIUS": "Mauritius",
    "MYT: MAYOTTE": "Mayotte",
    "MEX: MEXICO": "Mexico",
    "MDA: MOLDOVA": "Moldova",
    "MCO: MONACO": "Monaco",
    "MNG: MONGOLIA": "Mongolia",
    "MNE: MONTENEGRO": "Montenegro",
    "MSR: MONTSERRAT": "Montserrat",
    "MAR: MOROCCO": "Morocco",
    "MOZ: MOZAMBIQUE": "Mozambique",
    "NAM: NAMIBIA": "Namibia",
    "NRU: NAURU": "Nauru",
    "NPL: NEPAL": "Nepal",
    "NLD: NETHERLANDS": "Netherlands",
    "NCL: NEW CALEDONIA": "New Caledonia",
    "NZL: NEW ZEALAND": "New Zealand",
    "NIC: NICARAGUA": "Nicaragua",
    "NER: NIGER": "Niger",
    "NGA: NIGERIA": "Nigeria",
    "NIU: NIUE": "Niue",
    "NFK: NORFOLK ISLAND": "Norfolk Island",
    "MKD: NORTH MACEDONIA": "North Macedonia",
    "NOR: NORWAY": "Norway",
    "OMN: OMAN": "Oman",
    "PAK: PAKISTAN": "Pakistan",
    "PAN: PANAMA": "Panama",
    "PNG: PAPUA NEW GUINEA": "Papua New Guinea",
    "XPR: PARACEL ISLANDS": "Paracel Islands",
    "PRY: PARAGUAY": "Paraguay",
    "PER: PERU": "Peru",
    "PHL: PHILIPPINES": "Philippines",
    "PCN: PITCAIRN ISLANDS": "Pitcairn Islands",
    "POL: POLAND": "Poland",
    "PRT: PORTUGAL": "Portugal",
    "QAT: QATAR": "Qatar",
    "REU: REUNION": "Reunion",
    "ROU: ROMANIA": "Romania",
    "RUS: RUSSIA": "Russia",
    "RWA: RWANDA": "Rwanda",
    "BLM: SAINT BARTHELEMY": "Saint Barthelemy",
    "SHN: SAINT HELENA, ASCENSION, AND TRISTAN DA CUNHA":
      "Saint Helena, Ascension, And Tristan Da Cunha",
    "KNA: SAINT KITTS AND NEVIS": "Saint Kitts And Nevis",
    "LCA: SAINT LUCIA": "Saint Lucia",
    "MAF: SAINT MARTIN": "Saint Martin",
    "SPM: SAINT PIERRE AND MIQUELON": "Saint Pierre And Miquelon",
    "VCT: SAINT VINCENT AND THE GRENADINES": "Saint Vincent And The Grenadines",
    "WSM: SAMOA": "Samoa",
    "SMR: SAN MARINO": "San Marino",
    "STP: SAO TOME AND PRINCIPE": "Sao Tome And Principe",
    "SAU: SAUDI ARABIA": "Saudi Arabia",
    "SEN: SENEGAL": "Senegal",
    "SRB: SERBIA": "Serbia",
    "SYC: SEYCHELLES": "Seychelles",
    "SLE: SIERRA LEONE": "Sierra Leone",
    "SGP: SINGAPORE": "Singapore",
    "SXM: SINT MAARTEN": "Sint Maarten",
    "SVK: SLOVAKIA": "Slovakia",
    "SVN: SLOVENIA": "Slovenia",
    "SLB: SOLOMON ISLANDS": "Solomon Islands",
    "SOM: SOMALIA": "Somalia",
    "ZAF: SOUTH AFRICA": "South Africa",
    "SGS: SOUTH GEORGIA AND SOUTH SANDWICH ISLANDS":
      "South Georgia And South Sandwich Islands",
    "SSD: SOUTH SUDAN": "South Sudan",
    "ESP: SPAIN": "Spain",
    "XSP: SPRATLY ISLANDS": "Spratly Islands",
    "LKA: SRI LANKA": "Sri Lanka",
    "SDN: SUDAN": "Sudan",
    "SUR: SURINAME": "Suriname",
    "XSV: SVALBARD": "Svalbard",
    "SWE: SWEDEN": "Sweden",
    "CHE: SWITZERLAND": "Switzerland",
    "SYR: SYRIA": "Syria",
    "TWN: TAIWAN": "Taiwan",
    "TJK: TAJIKISTAN": "Tajikistan",
    "TZA: TANZANIA": "Tanzania",
    "THA: THAILAND": "Thailand",
    "TLS: TIMOR-LESTE": "Timor-Leste",
    "TGO: TOGO": "Togo",
    "TKL: TOKELAU": "Tokelau",
    "TON: TONGA": "Tonga",
    "TTO: TRINIDAD AND TOBAGO": "Trinidad And Tobago",
    "XTR: TROMELIN ISLAND": "Tromelin Island",
    "TUN: TUNISIA": "Tunisia",
    "TUR: TURKEY": "Turkey",
    "TKM: TURKMENISTAN": "Turkmenistan",
    "TCA: TURKS AND CAICOS ISLANDS": "Turks And Caicos Islands",
    "TUV: TUVALU": "Tuvalu",
    "UGA: UGANDA": "Uganda",
    "UKR: UKRAINE": "Ukraine",
    "ARE: UNITED ARAB EMIRATES": "United Arab Emirates",
    "GBR: UNITED KINGDOM": "United Kingdom",
    "USA: UNITED STATES": "United States",
    "URY: URUGUAY": "Uruguay",
    "UZB: UZBEKISTAN": "Uzbekistan",
    "VUT: VANUATU": "Vanuatu",
    "VAT: VATICAN CITY": "Vatican City",
    "VEN: VENEZUELA": "Venezuela",
    "VNM: VIETNAM": "Vietnam",
    "VGB: VIRGIN ISLANDS, BRITISH": "Virgin Islands, British",
    "WLF: WALLIS AND FUTUNA": "Wallis And Futuna",
    "XWB: WEST BANK": "West Bank",
    "ESH: WESTERN SAHARA": "Western Sahara",
    "YEM: YEMEN": "Yemen",
    "ZMB: ZAMBIA": "Zambia",
    "ZWE: ZIMBABWE": "Zimbabwe",
  },
  returnToGrants: {
    message: "Return to Grants.gov",
  },
  BookmarkBanner: {
    title: "Bookmark this page",
    message:
      "This application is part of a pilot program. More functionality is coming soon, including easier ways to return to this application. Until then, please save this URL to revisit your application.",
    technicalSupportMessage:
      "For technical support or to give feedback, email <mailToGrants>simpler@grants.gov</mailToGrants>.",
  },
  UserAccount: {
    pageTitle: "User Account | Simpler.Grants.gov",
    title: "User Account",
    inputs: {
      firstName: "First name",
      middleName: "Middle name",
      lastName: "Last name",
      email: "Email",
    },
    save: "Save",
    validationErrors: {
      firstName: "First name is required",
      lastName: "Last name is required",
    },
    fetchError: "Error fetching user data. Please try refreshing the page.",
    pending: "Saving...",
    errorHeading: "Error",
    successHeading: "Account updated",
  },
  UserWorkspace: {
    pageTitle: "User Workspace | Simpler.Grants.gov",
    title: "<color>Welcome</color> to your workspace.",
    fetchError: "Error fetching user data. Please try refreshing the page.",
    organizations: "Your organizations",
    noOrganizations: {
      title: "You're not a member of any organizations yet",
      description:
        "You'll be notified when an organization adds you, and you can accept the invitation to access their details.",
    },
    organizationButtons: {
      view: "View organization details",
      manage: "Manage users",
    },
  },
  OrganizationDetail: {
    pageTitle: "Organization",
    fetchError: "Unable to fetch organization details",
    organizationDetailsHeader: "Organization details",
    ebizPoc: "eBiz POC",
    contact: "Contact",
    uei: "UEI",
    expiration: "Exp",
    visitSam:
      "Visit <link>sam.gov</link> to make changes to your organization’s details.",
    rosterTable: {
      title: "Organization roster",
      explanation: "Your organization's active members are listed below.",
      manageUsersExplanation:
        "Manage Users to add or update roles and permissions.",
      headings: {
        email: "Email",
        name: "Name",
        roles: "Roles",
      },
    },
  },
  ManageUsers: {
    inviteUser: {
      heading: "Add users to collaborate on opportunities.",
      errorHeading: "Error",
      description:
        "Users are automatically added to your organization when they sign up. Until then, their status will be pending.",
      inputs: {
        email: {
          label: "Email address",
          placeholder: "Enter a valid email address",
        },
        role: {
          label: "Role",
          placeholder: "- Select a role -",
        },
      },
      button: {
        label: "Add to organization",
        success: "User added to pending",
      },
      validationErrors: {
        email: "Email is required",
        role: "Role is required",
      },
    },
  },
};
