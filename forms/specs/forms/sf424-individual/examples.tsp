import "./form.tsp";

namespace Forms.SF424Individual.Examples;

// Use synthetic opportunity and signing values so every source field is inspectable. The
// API, not these fixtures, owns actual pre-population and signature/submission dates.
const usCitizen: SF424Individual = #{
  opportunity: #{
    agencyName: "National Endowment for the Humanities",
    number: "SYNTHETIC-INDIVIDUAL-2026",
    title: "Synthetic Individual Research Fellowship",
    assistanceListing: #{ number: "45.160", title: "Fellowships and Stipends" },
  },
  application: #{
    dateReceived: Questions.Applications.DateReceived.fromISO("2026-11-02"),
  },
  applicant: #{
    person: #{ citizenship: #{ isUsCitizen: true } },
    congressionalDistrict: "MD-007",
  },
  project: #{
    title: "Community Archives Research",
    description: "Study and document community archives using synthetic fellowship data.",
    timeline: #{
      startDate: Questions.Projects.ProjectStartDate.fromISO("2027-01-01"),
      endDate: Questions.Projects.ProjectEndDate.fromISO("2027-12-31"),
    },
  },
  contacts: #{
    pointOfContact: #{
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
    },
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
  application: #{
    dateReceived: Questions.Applications.DateReceived.fromISO("2026-11-02"),
  },
  applicant: #{
    person: #{
      citizenship: #{
        isUsCitizen: false,
        country: Questions.Types.CountryCode.URY,
        alienRegistrationNumber: "SYNTHETIC123",
        residencyStartDate: plainDate.fromISO("2025-01-15"),
      },
    },
    congressionalDistrict: "00-000",
  },
  project: #{
    title: "Community Archives Research",
    description: "Study and document community archives using synthetic fellowship data.",
    timeline: #{
      startDate: Questions.Projects.ProjectStartDate.fromISO("2027-01-01"),
      endDate: Questions.Projects.ProjectEndDate.fromISO("2027-12-31"),
    },
  },
  contacts: #{
    pointOfContact: #{
      name: #{ firstName: "Tom", lastName: "Okafor" },
      address: #{
        street1: "456 Rio",
        city: "Montevideo",
        province: "Montevideo",
        country: Questions.Types.CountryCode.URY,
      },
      phone: "1234567890",
      email: "tom.okafor@example.org",
    },
  },
  certification: #{
    agree: true,
    signature: "Tom Okafor",
    dateSigned: Questions.Certifications.DateSigned.fromISO("2026-11-02"),
  },
};
