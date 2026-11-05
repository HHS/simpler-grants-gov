import "./form.tsp";

namespace Forms.SF424Research.Examples;

const shared = #{
  applicantOrganization: #{
    name: "Willow Research Institute",
    uei: "A1B2C3D4E5F6",
    department: "Sponsored Research",
    division: "Research Operations",
    address: #{
      street1: "10 Orchard Street",
      city: "Boston",
      state: Questions.Types.StateCode.MA,
      zipCode: "02108-1234",
      country: Questions.Types.CountryCode.USA,
    },
    employerId: "12-3456789",
  },
  applicantContact: #{
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
  applicantType: #{ code: ApplicantCode.M },
  opportunity: #{
    agencyName: "Example Research Agency",
    assistanceListingNumber: "93.123",
    assistanceListingTitle: "Community Research",
  },
  project: #{
    title: "Measuring the Effects of Urban Tree Canopy",
    startDate: Questions.Projects.ProjectStartDate.fromISO("2027-01-01"),
    endDate: Questions.Projects.ProjectEndDate.fromISO("2027-12-31"),
    congressionalDistrict: "MA-007",
  },
  principalInvestigator: #{
    name: #{ firstName: "Avery", lastName: "Tran" },
    address: #{
      street1: "24 Orchard Street",
      city: "Boston",
      state: Questions.Types.StateCode.MA,
      zipCode: "02108-3456",
      country: Questions.Types.CountryCode.USA,
    },
    phone: "6175550101",
    email: "avery.tran@example.org",
    organizationName: "Willow Research Institute",
    department: "Urban Ecology",
    division: "Research",
  },
  funding: #{
    federal: "100000.29",
    nonFederal: "1.15",
    total: "100001.44",
    programIncome: "0.00",
  },
  authorizedRepresentative: #{
    name: #{ firstName: "Jordan", lastName: "Santos" },
    title: "Director of Sponsored Programs",
    address: #{
      street1: "32 Orchard Street",
      city: "Boston",
      state: Questions.Types.StateCode.MA,
      zipCode: "02108-4567",
      country: Questions.Types.CountryCode.USA,
    },
    phone: "6175550102",
    email: "jordan.santos@example.org",
    organizationName: "Willow Research Institute",
    department: "Grants Administration",
    division: "Operations",
  },
  attachments: #{},
};

const newApplication: ResearchCover = #{
  ...shared,
  application: #{
    submissionType: SubmissionType.Application,
    applicationType: ApplicationType.New,
    submittedToOtherAgencies: false,
  },
  stateReview: #{ status: StateReviewStatus.NotCovered },
  certification: #{ agree: true },
};

const revision: ResearchCover = #{
  ...shared,
  application: #{
    submissionType: SubmissionType.Corrected,
    submittedDate: plainDate.fromISO("2026-11-05"),
    federalId: "R01EX123456",
    trackingId: "GRANT12345678",
    applicationType: ApplicationType.Revision,
    revisionCode: RevisionCode.AC,
    submittedToOtherAgencies: true,
    otherAgencyExplanation: "Example Foundation",
  },
  stateReview: #{
    status: StateReviewStatus.Yes,
    date: plainDate.fromISO("2026-11-02"),
  },
  certification: #{
    agree: true,
    signature: "Jordan Santos",
    dateSigned: Questions.Certifications.DateSigned.fromISO("2026-11-05"),
  },
};
