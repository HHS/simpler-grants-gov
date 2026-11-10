import "./form.tsp";
using Forms.SF424Short;

@@example(
  SF424Short,
  #{
    opportunity: #{
      agencyName: "Department of Community Programs",
      assistanceListingNumber: "99.999",
      assistanceListingProgramTitle: "Community Research Demonstration",
      fundingOpportunityNumber: "DEMO-2027-001",
      fundingOpportunityTitle: "Community Research Demonstration",
    },
    applicant: #{
      organizationName: "Maple Community Research Centre",
      address: #{
        street1: "240 Maple Street",
        street2: "Suite 210",
        city: "Ottawa",
        province: "Ontario",
        country: Questions.Types.CountryCode.CAN,
        zipCode: "K1P 1J1",
      },
      applicantWebAddress: "https://maple.example.org",
      applicantTypeCode: #[
        Questions.Organizations.ApplicantType.W,
        Questions.Organizations.ApplicantType.X
      ],
      applicantTypeOtherSpecify: "Community research partnership",
      employerTaxpayerIdentificationNumber: "44-4444444",
      samUei: "MCRC12345678",
      congressionalDistrictApplicant: "00-000",
    },
    project: #{
      title: "Neighborhood Heat Resilience Study",
      description: "Survey neighborhood residents and map shaded gathering spaces to guide community heat-resilience planning. The project will share findings through public workshops and a plain-language report.",
      startDate: Questions.Projects.ProjectStartDate.fromISO("2027-01-01"),
      endDate: Questions.Projects.ProjectEndDate.fromISO("2027-12-31"),
    },
    authorizedRepresentative: #{
      name: #{ firstName: "Morgan", lastName: "Chen" },
      title: "Executive Director",
      email: "morgan.chen@example.org",
      phone: "613-555-0103",
    },
    projectDirector: #{
      name: #{ firstName: "Avery", lastName: "Patel" },
      title: "Research Director",
      email: "avery.patel@example.org",
      phone: "613-555-0101",
      address: #{
        street1: "240 Maple Street",
        street2: "Suite 210",
        city: "Ottawa",
        province: "Ontario",
        country: Questions.Types.CountryCode.CAN,
        zipCode: "K1P 1J1",
      },
    },
    sameAsProjectDirector: false,
    contactPerson: #{
      name: #{ firstName: "Jordan", lastName: "Reyes" },
      title: "Grants Administrator",
      email: "jordan.reyes@example.org",
      phone: "613-555-0102",
      address: #{
        street1: "240 Maple Street",
        street2: "Suite 210",
        city: "Ottawa",
        province: "Ontario",
        country: Questions.Types.CountryCode.CAN,
        zipCode: "K1P 1J1",
      },
    },
    applicationCertification: true,
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
      assistanceListingNumber: "99.999",
      assistanceListingProgramTitle: "Community Research Demonstration",
      fundingOpportunityNumber: "DEMO-2027-001",
      fundingOpportunityTitle: "Community Research Demonstration",
    },
    applicant: #{
      organizationName: "Prairie Community Research Center",
      address: #{
        street1: "128 Oak Avenue",
        city: "Springfield",
        county: "Sangamon",
        state: Questions.Types.StateCode.IL,
        country: Questions.Types.CountryCode.USA,
        zipCode: "62701-1234",
        street2: "Suite 200",
      },
      applicantWebAddress: "https://prairie.example.org",
      applicantTypeCode: #[Questions.Organizations.ApplicantType.M],
      employerTaxpayerIdentificationNumber: "12-3456789",
      samUei: "PCRA12345678",
      congressionalDistrictApplicant: "IL-013",
    },
    project: #{
      title: "Neighborhood Heat Resilience Study",
      description: "Survey neighborhood residents and map shaded gathering spaces to guide community heat-resilience planning. The project will share findings through public workshops and a plain-language report.",
      startDate: Questions.Projects.ProjectStartDate.fromISO("2027-01-01"),
      endDate: Questions.Projects.ProjectEndDate.fromISO("2027-12-31"),
    },
    authorizedRepresentative: #{
      name: #{ firstName: "Morgan", lastName: "Chen" },
      title: "Executive Director",
      email: "morgan.chen@example.org",
      phone: "217-555-0103",
    },
    projectDirector: #{
      name: #{ firstName: "Avery", lastName: "Patel" },
      title: "Research Director",
      email: "avery.patel@example.org",
      phone: "217-555-0101",
      address: #{
        street1: "128 Oak Avenue",
        city: "Springfield",
        county: "Sangamon",
        state: Questions.Types.StateCode.IL,
        country: Questions.Types.CountryCode.USA,
        zipCode: "62701-1234",
      },
    },
    sameAsProjectDirector: false,
    contactPerson: #{
      name: #{ firstName: "Jordan", lastName: "Reyes" },
      title: "Grants Administrator",
      email: "jordan.reyes@example.org",
      phone: "217-555-0102",
      address: #{
        street1: "128 Oak Avenue",
        city: "Springfield",
        county: "Sangamon",
        state: Questions.Types.StateCode.IL,
        country: Questions.Types.CountryCode.USA,
        zipCode: "62701-1234",
      },
    },
    applicationCertification: true,
  },
  #{
    title: "US nonprofit application draft",
    description: "Fictional organization, opportunity and three distinct people. US addresses use ZIP+4; source-populated opportunity/UEI values are illustrative context. Received date, signature and signed date are intentionally absent because this is a draft, not a submitted application.",
  }
);
