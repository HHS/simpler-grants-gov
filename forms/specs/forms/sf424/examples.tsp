import "./form.tsp";

namespace Forms.SF424Regular.Examples;

const nonprofit: SF424 = #{
  application: #{
    submissionType: RegularSubmissionType.Application,
    applicationType: RegularApplicationType.New,
    dateReceived: plainDate.fromISO("2026-11-05"),
  },
  applicant: #{
    legalName: "Prairie Community Research Center",
    ein: "12-3456789",
    uei: "PCRA12345678",
    address: #{
      street1: "128 Oak Avenue",
      city: "Springfield",
      county: "Sangamon",
      state: Questions.Types.StateCode.IL,
      country: Questions.Types.CountryCode.USA,
      zipCode: "62701-1234",
    },
  },
  contact: #{
    name: #{ firstName: "Jordan", lastName: "Reyes" },
    title: "Grants Administrator",
    phone: "2175550102",
    email: "jordan.reyes@example.org",
  },
  applicantType: #{ codes: #[Questions.Organizations.ApplicantType.M] },
  opportunity: #{
    agencyName: "Department of Community Programs",
    assistanceListingNumber: "99.999",
    assistanceListingTitle: "Community Research Demonstration",
    number: "DEMO-2027-001",
    title: "Community Research Demonstration",
  },
  project: #{
    title: "Neighborhood Heat Resilience Study",
    congressionalDistrictApplicant: "IL-013",
    congressionalDistrictProgramProject: "IL-013",
    startDate: Questions.Projects.ProjectStartDate.fromISO("2027-01-01"),
    endDate: Questions.Projects.ProjectEndDate.fromISO("2027-12-31"),
  },
  funding: #{
    federal: "25000.00",
    applicant: "5000.00",
    state: "0.00",
    local: "0.00",
    other: "0.00",
    programIncome: "0.00",
    total: "30000.00",
  },
  stateReview: #{ status: RegularStateReviewStatus.NotCovered },
  debt: #{ isDelinquent: false },
  certification: #{ agree: true },
  authorizedRepresentative: #{
    name: #{ firstName: "Morgan", lastName: "Chen" },
    title: "Executive Director",
    phone: "2175550103",
    email: "morgan.chen@example.org",
    signature: "Morgan Chen",
    dateSigned: Questions.Certifications.DateSigned.fromISO("2026-11-05"),
  },
};
