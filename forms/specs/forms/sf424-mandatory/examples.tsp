import "./form.tsp";

namespace Forms.SF424Mandatory.Examples;

// Use synthetic context and signing values: they aren't uploaded files or real signatures.
const complete: SF424Mandatory = #{
  opportunity: #{
    agencyName: "Department of Education",
    assistanceListing: #{
      number: "84.027",
      title: "Synthetic Education Program",
    },
  },
  application: #{
    submissionType: MandatorySubmissionType.Other,
    submissionTypeOther: "Synthetic formula grant request",
    frequency: #{ code: MandatoryFrequencyCode.Other, other: "Semiannual" },
    consolidatedRequest: #{
      answer: true,
      explanation: "Synthetic consolidated submission for two community programs.",
    },
    version: MandatorySubmissionVersion.Initial,
    dateReceived: Questions.Applications.DateReceived.fromISO("2026-11-03"),
    applicantId: "SYN-APPLICANT-01",
    federalEntityIdentifier: "SYN-ENTITY-01",
    federalAwardIdentifier: "SYN-AWARD-01",
    state: #{
      receivedDate: Questions.Applications.StateReceivedDate.fromISO("2026-10-29"),
      applicationId: "SYN-STATE-01",
    },
    stateReview: #{
      status: MandatoryStateReviewStatus.Available,
      date: plainDate.fromISO("2026-10-28"),
    },
  },
  applicant: #{
    organization: #{
      name: "Example Community Organization",
      uei: "SYNTHETIC001",
      ein: "12-3456789",
      address: #{
        street1: "100 Grant Avenue",
        street2: "Suite 400",
        city: "Baltimore",
        county: "Baltimore City",
        state: Questions.Types.StateCode.MD,
        country: Questions.Types.CountryCode.USA,
        zipCode: "21218-1234",
      },
      department: "Community Programs",
      division: "Education",
    },
    type: #{
      code: Questions.Organizations.ApplicantType.X,
      otherSpecify: "Synthetic community partnership",
      additionalDescription: "Educational community organization",
    },
    congressionalDistrict: "MD-007",
    delinquentFederalDebt: #{
      answer: true,
      explanation: "Synthetic debt explanation for exercising the conditional question.",
    },
  },
  project: #{
    title: "Community Learning Program",
    areasAffected: "Baltimore City",
    congressionalDistrict: "MD-007",
    additionalCongressionalDistricts: "00000000-0000-4000-8000-000000007121",
  },
  contacts: #{
    authorizedRepresentative: #{
      name: #{
        prefix: "Ms.",
        firstName: "Priya",
        middleName: "K",
        lastName: "Patel",
        suffix: "Jr.",
      },
      title: "Executive Director",
      organization: #{ name: "Example Community Organization" },
      phone: "4105550101",
      fax: "4105550198",
      email: "priya.patel@example.org",
    },
    pointOfContact: #{
      name: #{
        prefix: "Dr.",
        firstName: "Alicia",
        middleName: "Marie",
        lastName: "Reyes",
        suffix: "PhD",
      },
      title: "Program Director",
      organization: #{ name: "Example Community Organization" },
      phone: "4105550100",
      fax: "4105550199",
      email: "alicia.reyes@example.org",
    },
  },
  budget: #{
    fundingSources: #{ federal: "12345.67", match: "0" },
    fundingPeriod: #{
      startDate: plainDate.fromISO("2027-01-01"),
      endDate: plainDate.fromISO("2027-12-31"),
    },
  },
  certification: #{
    agree: true,
    signature: "Priya Patel",
    dateSigned: Questions.Certifications.DateSigned.fromISO("2026-11-03"),
  },
  attachments: #{
    additional: #[
      "00000000-0000-4000-8000-000000007122",
      "00000000-0000-4000-8000-000000007123"
    ],
  },
};

const minimum: SF424Mandatory = #{
  opportunity: #{ agencyName: "Department of Education" },
  application: #{
    submissionType: MandatorySubmissionType.Application,
    frequency: #{ code: MandatoryFrequencyCode.Annual },
    consolidatedRequest: #{ answer: false },
    version: MandatorySubmissionVersion.Initial,
    stateReview: #{ status: MandatoryStateReviewStatus.NotNeeded },
  },
  applicant: #{
    organization: #{
      name: "Example Community Organization",
      uei: "SYNTHETIC001",
      ein: "12-3456789",
      address: #{
        street1: "100 Grant Avenue",
        city: "Baltimore",
        state: Questions.Types.StateCode.MD,
        country: Questions.Types.CountryCode.USA,
        zipCode: "21218-1234",
      },
    },
    type: #{ code: Questions.Organizations.ApplicantType.A },
    congressionalDistrict: "MD-007",
    delinquentFederalDebt: #{ answer: false },
  },
  project: #{ title: "Community Learning Program" },
  contacts: #{
    authorizedRepresentative: #{
      name: #{ firstName: "Priya", lastName: "Patel" },
      title: "Executive Director",
      phone: "4105550101",
      email: "priya.patel@example.org",
    },
    pointOfContact: #{
      name: #{ firstName: "Alicia", lastName: "Reyes" },
      phone: "4105550100",
      email: "alicia.reyes@example.org",
    },
  },
  budget: #{
    fundingSources: #{ federal: "0" },
    fundingPeriod: #{
      startDate: plainDate.fromISO("2027-01-01"),
      endDate: plainDate.fromISO("2027-12-31"),
    },
  },
  certification: #{ agree: true },
};
