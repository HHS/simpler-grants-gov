import "./form.tsp";

namespace Forms.SF424Mandatory.Examples;

// Synthetic context/signing values are inspectable examples, not uploaded files or signatures.
const complete: SF424Mandatory = #{
  submission: #{
    type: MandatorySubmissionType.Other,
    typeOtherDescription: "Synthetic formula grant request",
    frequency: MandatoryFrequency.Other,
    frequencyOtherDescription: "Semiannual",
    consolidatedRequest: true,
    consolidatedRequestExplanation: "Synthetic consolidated submission for two community programs.",
    version: MandatorySubmissionVersion.Initial,
  },
  dates: #{
    receivedDate: plainDate.fromISO("2026-11-03"),
    stateReceivedDate: plainDate.fromISO("2026-10-29"),
  },
  identifiers: #{
    applicantId: "SYN-APPLICANT-01",
    federalEntityId: "SYN-ENTITY-01",
    federalAwardId: "SYN-AWARD-01",
    stateApplicationId: "SYN-STATE-01",
  },
  applicant: #{
    legalName: "Example Community Organization",
    ein: "12-3456789",
    uei: "SYNTHETIC001",
    department: "Community Programs",
    division: "Education",
    address: #{
      street1: "100 Grant Avenue",
      street2: "Suite 400",
      city: "Baltimore",
      county: "Baltimore City",
      state: Questions.Types.StateCode.MD,
      country: Questions.Types.CountryCode.USA,
      zipCode: "21218-1234",
    },
    type: #{
      code: MandatoryApplicantTypeCode.X,
      otherSpecify: "Synthetic community partnership",
      additionalDescription: "Educational community organization",
    },
  },
  contact: #{
    name: #{
      prefix: "Dr.",
      firstName: "Alicia",
      middleName: "Marie",
      lastName: "Reyes",
      suffix: "PhD",
    },
    title: "Program Director",
    organizationalAffiliation: "Example Community Organization",
    phone: "4105550100",
    fax: "4105550199",
    email: "alicia.reyes@example.org",
  },
  opportunity: #{
    agencyName: "Department of Education",
    assistanceListing: #{
      number: "84.027",
      title: "Synthetic Education Program",
    },
  },
  project: #{
    title: "Community Learning Program",
    areasAffected: "Baltimore City",
  },
  congressionalDistricts: #{
    applicant: "MD-007",
    project: "MD-007",
    additionalAttachment: "00000000-0000-4000-8000-000000007121",
  },
  funding: #{
    startDate: plainDate.fromISO("2027-01-01"),
    endDate: plainDate.fromISO("2027-12-31"),
    estimatedFederal: 12345.67,
    estimatedMatch: 0,
  },
  stateReview: #{
    status: MandatoryStateReviewStatus.Available,
    availableDate: plainDate.fromISO("2026-10-28"),
  },
  debt: #{
    isDelinquent: true,
    explanation: "Synthetic debt explanation for exercising the conditional question.",
  },
  certification: #{ agree: true },
  authorizedRepresentative: #{
    name: #{
      prefix: "Ms.",
      firstName: "Priya",
      middleName: "K",
      lastName: "Patel",
      suffix: "Jr.",
    },
    title: "Executive Director",
    organizationalAffiliation: "Example Community Organization",
    phone: "4105550101",
    fax: "4105550198",
    email: "priya.patel@example.org",
    signature: "Priya Patel",
    dateSigned: Questions.Certifications.DateSigned.fromISO("2026-11-03"),
  },
  attachments: #[
    "00000000-0000-4000-8000-000000007122",
    "00000000-0000-4000-8000-000000007123"
  ],
};

const minimum: SF424Mandatory = #{
  submission: #{
    type: MandatorySubmissionType.Application,
    frequency: MandatoryFrequency.Annual,
    consolidatedRequest: false,
    version: MandatorySubmissionVersion.Initial,
  },
  applicant: #{
    legalName: "Example Community Organization",
    ein: "12-3456789",
    uei: "SYNTHETIC001",
    address: #{
      street1: "100 Grant Avenue",
      city: "Baltimore",
      state: Questions.Types.StateCode.MD,
      country: Questions.Types.CountryCode.USA,
      zipCode: "21218-1234",
    },
    type: #{ code: MandatoryApplicantTypeCode.A },
  },
  contact: #{
    name: #{ firstName: "Alicia", lastName: "Reyes" },
    phone: "4105550100",
    email: "alicia.reyes@example.org",
  },
  opportunity: #{ agencyName: "Department of Education" },
  project: #{ title: "Community Learning Program" },
  congressionalDistricts: #{ applicant: "MD-007" },
  funding: #{
    startDate: plainDate.fromISO("2027-01-01"),
    endDate: plainDate.fromISO("2027-12-31"),
    estimatedFederal: 0,
  },
  stateReview: #{ status: MandatoryStateReviewStatus.NotNeeded },
  debt: #{ isDelinquent: false },
  certification: #{ agree: true },
  authorizedRepresentative: #{
    name: #{ firstName: "Priya", lastName: "Patel" },
    title: "Executive Director",
    phone: "4105550101",
    email: "priya.patel@example.org",
  },
};
