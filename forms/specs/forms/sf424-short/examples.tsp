import "./form.tsp";
using Forms.SF424Short;

@@example(
  SF424Short,
  #{
    opportunity: #{
      agencyName: "Department of Community Programs",
      assistanceListing: #{
        number: "99.999",
        title: "Community Research Demonstration",
      },
      number: "DEMO-2027-001",
      title: "Community Research Demonstration",
    },
    applicant: #{
      organization: #{
        name: "Maple Community Research Centre",
        uei: "MCRC12345678",
        ein: "44-4444444",
        address: #{
          street1: "240 Maple Street",
          street2: "Suite 210",
          city: "Ottawa",
          province: "Ontario",
          country: Questions.Types.CountryCode.CAN,
          zipCode: "K1P 1J1",
        },
        webAddress: "https://maple.example.org",
      },
      type: #{
        codes: #[
          Questions.Organizations.ApplicantType.W,
          Questions.Organizations.ApplicantType.X
        ],
        otherSpecify: "Community research partnership",
      },
      congressionalDistrict: "00-000",
    },
    project: #{
      title: "Neighborhood Heat Resilience Study",
      description: "Survey neighborhood residents and map shaded gathering spaces to guide community heat-resilience planning. The project will share findings through public workshops and a plain-language report.",
      timeline: #{
        startDate: Questions.Projects.ProjectStartDate.fromISO("2027-01-01"),
        endDate: Questions.Projects.ProjectEndDate.fromISO("2027-12-31"),
      },
    },
    contacts: #{
      authorizedRepresentative: #{
        name: #{ firstName: "Morgan", lastName: "Chen" },
        title: "Executive Director",
        phone: "613-555-0103",
        email: "morgan.chen@example.org",
      },
      projectDirector: #{
        name: #{ firstName: "Avery", lastName: "Patel" },
        title: "Research Director",
        address: #{
          street1: "240 Maple Street",
          street2: "Suite 210",
          city: "Ottawa",
          province: "Ontario",
          country: Questions.Types.CountryCode.CAN,
          zipCode: "K1P 1J1",
        },
        phone: "613-555-0101",
        email: "avery.patel@example.org",
      },
      pointOfContact: #{
        sameAsProjectDirector: false,
        name: #{ firstName: "Jordan", lastName: "Reyes" },
        title: "Grants Administrator",
        address: #{
          street1: "240 Maple Street",
          street2: "Suite 210",
          city: "Ottawa",
          province: "Ontario",
          country: Questions.Types.CountryCode.CAN,
          zipCode: "K1P 1J1",
        },
        phone: "613-555-0102",
        email: "jordan.reyes@example.org",
      },
    },
    certification: #{ agree: true },
  },
  #{
    title: "Canadian partner with Other applicant type",
    description: "Fictional Canadian addresses use Province without State. Selecting Other includes its explanation; the non-US EIN uses the DAT-prescribed 44-4444444 placeholder. Distinct director, administrator and signing role are retained; neither address validation nor a real registration, signature or submission is claimed.",
  }
);
@@example(
  SF424Short,
  #{
    opportunity: #{
      agencyName: "Department of Community Programs",
      assistanceListing: #{
        number: "99.999",
        title: "Community Research Demonstration",
      },
      number: "DEMO-2027-001",
      title: "Community Research Demonstration",
    },
    applicant: #{
      organization: #{
        name: "Prairie Community Research Center",
        uei: "PCRA12345678",
        ein: "12-3456789",
        address: #{
          street1: "128 Oak Avenue",
          city: "Springfield",
          county: "Sangamon",
          state: Questions.Types.StateCode.IL,
          country: Questions.Types.CountryCode.USA,
          zipCode: "62701-1234",
          street2: "Suite 200",
        },
        webAddress: "https://prairie.example.org",
      },
      type: #{ codes: #[Questions.Organizations.ApplicantType.M] },
      congressionalDistrict: "IL-013",
    },
    project: #{
      title: "Neighborhood Heat Resilience Study",
      description: "Survey neighborhood residents and map shaded gathering spaces to guide community heat-resilience planning. The project will share findings through public workshops and a plain-language report.",
      timeline: #{
        startDate: Questions.Projects.ProjectStartDate.fromISO("2027-01-01"),
        endDate: Questions.Projects.ProjectEndDate.fromISO("2027-12-31"),
      },
    },
    contacts: #{
      authorizedRepresentative: #{
        name: #{ firstName: "Morgan", lastName: "Chen" },
        title: "Executive Director",
        phone: "217-555-0103",
        email: "morgan.chen@example.org",
      },
      projectDirector: #{
        name: #{ firstName: "Avery", lastName: "Patel" },
        title: "Research Director",
        address: #{
          street1: "128 Oak Avenue",
          city: "Springfield",
          county: "Sangamon",
          state: Questions.Types.StateCode.IL,
          country: Questions.Types.CountryCode.USA,
          zipCode: "62701-1234",
        },
        phone: "217-555-0101",
        email: "avery.patel@example.org",
      },
      pointOfContact: #{
        sameAsProjectDirector: false,
        name: #{ firstName: "Jordan", lastName: "Reyes" },
        title: "Grants Administrator",
        address: #{
          street1: "128 Oak Avenue",
          city: "Springfield",
          county: "Sangamon",
          state: Questions.Types.StateCode.IL,
          country: Questions.Types.CountryCode.USA,
          zipCode: "62701-1234",
        },
        phone: "217-555-0102",
        email: "jordan.reyes@example.org",
      },
    },
    certification: #{ agree: true },
  },
  #{
    title: "US nonprofit application draft",
    description: "Fictional organization, opportunity and three distinct people. US addresses use ZIP+4; source-populated opportunity/UEI values are illustrative context. Received date, signature and signed date are intentionally absent because this is a draft, not a submitted application.",
  }
);
