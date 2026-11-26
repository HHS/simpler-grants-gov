import "./form.tsp";

namespace Forms.SF424Regular.Examples;

const nonprofit: SF424 = #{
  opportunity: #{
    agencyName: "Department of Community Programs",
    assistanceListing: #{
      number: "99.999",
      title: "Community Research Demonstration",
    },
    number: "DEMO-2027-001",
    title: "Community Research Demonstration",
  },
  application: #{
    submissionType: SF424SubmissionType.Application,
    applicationType: SF424ApplicationType.New,
    dateReceived: Questions.Applications.DateReceived.fromISO("2026-11-05"),
    stateReview: #{ status: SF424StateReviewStatus.NotCovered },
  },
  applicant: #{
    organization: #{
      name: "Prairie Community Research Center",
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
    type: #{ codes: #[Questions.Organizations.ApplicantType.M] },
    congressionalDistrict: "IL-013",
    delinquentFederalDebt: #{ answer: false },
  },
  project: #{
    title: "Neighborhood Heat Resilience Study",
    congressionalDistrict: "IL-013",
    timeline: #{
      startDate: Questions.Projects.ProjectStartDate.fromISO("2027-01-01"),
      endDate: Questions.Projects.ProjectEndDate.fromISO("2027-12-31"),
    },
  },
  contacts: #{
    pointOfContact: #{
      name: #{ firstName: "Jordan", lastName: "Reyes" },
      title: "Grants Administrator",
      phone: "2175550102",
      email: "jordan.reyes@example.org",
    },
    authorizedRepresentative: #{
      name: #{ firstName: "Morgan", lastName: "Chen" },
      title: "Executive Director",
      phone: "2175550103",
      email: "morgan.chen@example.org",
    },
  },
  budget: #{
    fundingSources: #{
      federal: "25000.00",
      applicant: "5000.00",
      state: "0.00",
      local: "0.00",
      other: "0.00",
      programIncome: "0.00",
      total: "30000.00",
    },
  },
  certification: #{
    agree: true,
    signature: "Morgan Chen",
    dateSigned: Questions.Certifications.DateSigned.fromISO("2026-11-05"),
  },
};
