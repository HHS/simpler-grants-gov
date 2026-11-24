import "./form.tsp";

namespace Forms.SF424Research.Examples;

// =============================================================================
// FORM EXAMPLES
// =============================================================================

const newApplication: ResearchCover = #{
  ...shared,
  application: #{
    submissionType: ResearchSubmissionType.Application,
    applicationType: ResearchApplicationType.New,
    otherAgencies: #{ submitted: false },
    stateReview: #{ status: ResearchStateReviewStatus.NotCovered },
  },
  certification: #{ agree: true },
};

const revision: ResearchCover = #{
  ...shared,
  application: #{
    submissionType: ResearchSubmissionType.Corrected,
    dateSubmitted: plainDate.fromISO("2026-11-05"),
    federalIdentifier: "R01EX123456",
    previousTrackingId: "GRANT12345678",
    applicationType: ResearchApplicationType.Revision,
    revision: #{ type: ResearchRevisionCode.AC },
    otherAgencies: #{ submitted: true, explanation: "Example Foundation" },
    stateReview: #{
      status: ResearchStateReviewStatus.Yes,
      date: plainDate.fromISO("2026-11-02"),
    },
  },
  certification: #{
    agree: true,
    signature: "Jordan Santos",
    dateSigned: Questions.Certifications.DateSigned.fromISO("2026-11-05"),
  },
};

// =============================================================================
// SHARED ANSWERS
// =============================================================================

const shared = #{
  opportunity: #{
    agencyName: "Example Research Agency",
    assistanceListing: #{ number: "93.123", title: "Community Research" },
  },
  applicant: #{
    organization: #{
      name: "Willow Research Institute",
      uei: "A1B2C3D4E5F6",
      ein: "12-3456789",
      address: #{
        street1: "10 Orchard Street",
        city: "Boston",
        state: Questions.Types.StateCode.MA,
        zipCode: "02108-1234",
        country: Questions.Types.CountryCode.USA,
      },
      department: "Sponsored Research",
      division: "Research Operations",
    },
    type: #{ code: Questions.Organizations.ApplicantType.M },
    congressionalDistrict: "MA-007",
  },
  project: #{
    title: "Measuring the Effects of Urban Tree Canopy",
    timeline: #{
      startDate: Questions.Projects.ProjectStartDate.fromISO("2027-01-01"),
      endDate: Questions.Projects.ProjectEndDate.fromISO("2027-12-31"),
    },
  },
  contacts: #{
    authorizedRepresentative: #{
      name: #{ firstName: "Jordan", lastName: "Santos" },
      title: "Director of Sponsored Programs",
      organization: #{
        name: "Willow Research Institute",
        department: "Grants Administration",
        division: "Operations",
      },
      address: #{
        street1: "32 Orchard Street",
        city: "Boston",
        state: Questions.Types.StateCode.MA,
        zipCode: "02108-4567",
        country: Questions.Types.CountryCode.USA,
      },
      phone: "6175550102",
      email: "jordan.santos@example.org",
    },
    projectDirector: #{
      name: #{ firstName: "Avery", lastName: "Tran" },
      organization: #{
        name: "Willow Research Institute",
        department: "Urban Ecology",
        division: "Research",
      },
      address: #{
        street1: "24 Orchard Street",
        city: "Boston",
        state: Questions.Types.StateCode.MA,
        zipCode: "02108-3456",
        country: Questions.Types.CountryCode.USA,
      },
      phone: "6175550101",
      email: "avery.tran@example.org",
    },
    pointOfContact: #{
      name: #{ firstName: "Quinn", lastName: "Bennett" },
      address: #{
        street1: "15 Orchard Street",
        city: "Boston",
        state: Questions.Types.StateCode.MA,
        zipCode: "02108-2345",
        country: Questions.Types.CountryCode.USA,
      },
      phone: "6175550100",
    },
  },
  budget: #{
    fundingSources: #{
      federal: "100000.29",
      nonFederal: "1.15",
      total: "100001.44",
      programIncome: "0.00",
    },
  },
};
