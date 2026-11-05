import "./form.tsp";

namespace Forms.SF424Individual.Examples;

// Synthetic opportunity and signing values make every source field inspectable. The API,
// not these fixtures, owns actual pre-population and signature/submission dates.
const usCitizen: SF424Individual = #{
  opportunity: #{
    agencyName: "National Endowment for the Humanities",
    assistanceListing: #{ number: "45.160", title: "Fellowships and Stipends" },
    number: "SYNTHETIC-INDIVIDUAL-2026",
    title: "Synthetic Individual Research Fellowship",
  },
  dateReceived: plainDate.fromISO("2026-11-02"),
  applicant: #{
    name: #{
      prefix: "Dr.",
      firstName: "Alicia",
      middleName: "Marie",
      lastName: "Reyes",
      suffix: "PhD",
    },
    address: #{
      street1: "100 Grant Avenue",
      street2: "Unit 400",
      city: "Baltimore",
      county: "Baltimore City",
      state: Questions.Types.StateCode.MD,
      zipCode: "21218-1234",
      country: Questions.Types.CountryCode.USA,
    },
    phone: "4105550100",
    eveningPhone: "4105550101",
    fax: "4105550199",
    email: "alicia.reyes@example.org",
    citizenship: #{ isUsCitizen: true },
    congressionalDistrict: "MD-007",
  },
  project: #{
    title: "Community Archives Research",
    description: "Study and document community archives using synthetic fellowship data.",
    startDate: Questions.Projects.ProjectStartDate.fromISO("2027-01-01"),
    endDate: Questions.Projects.ProjectEndDate.fromISO("2027-12-31"),
  },
  certification: #{
    agree: true,
    signature: "Alicia Reyes",
    dateSigned: Questions.Certifications.DateSigned.fromISO("2026-11-02"),
  },
};

const nonCitizen: SF424Individual = #{
  opportunity: #{
    agencyName: "National Endowment for the Humanities",
    number: "SYNTHETIC-INDIVIDUAL-2026",
    title: "Synthetic Individual Research Fellowship",
  },
  dateReceived: plainDate.fromISO("2026-11-02"),
  applicant: #{
    name: #{ firstName: "Tom", lastName: "Okafor" },
    address: #{
      street1: "456 Rio",
      city: "Montevideo",
      province: "Montevideo",
      country: Questions.Types.CountryCode.URY,
    },
    phone: "1234567890",
    email: "tom.okafor@example.org",
    citizenship: #{
      isUsCitizen: false,
      alienRegistrationNumber: "SYNTHETIC123",
      countryOfCitizenship: Questions.Types.CountryCode.URY,
      residencyStartDate: plainDate.fromISO("2025-01-15"),
    },
    congressionalDistrict: "00-000",
  },
  project: #{
    title: "Community Archives Research",
    description: "Study and document community archives using synthetic fellowship data.",
    startDate: Questions.Projects.ProjectStartDate.fromISO("2027-01-01"),
    endDate: Questions.Projects.ProjectEndDate.fromISO("2027-12-31"),
  },
  certification: #{
    agree: true,
    signature: "Tom Okafor",
    dateSigned: Questions.Certifications.DateSigned.fromISO("2026-11-02"),
  },
};
