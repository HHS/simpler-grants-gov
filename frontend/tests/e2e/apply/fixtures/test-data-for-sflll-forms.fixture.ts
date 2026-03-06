import { FillFieldDefinition } from "tests/e2e/utils/forms/general-forms-filling";

export const FORMS_TEST_DATA = {
  sflll: {
    form: {
      name: "Disclosure of Lobbying Activities (SF-LLL)",
    },
    federalAction: {
      type: "Grant",
      status: "BidOffer",
      reportType: "MaterialChange",
    },
    materialChange: {
      year: "2025",
      quarter: "1",
      lastReportDate: "2025-03-31",
    },
    reportingEntity: {
      type: "Prime",
      tier: "1",
      orgName: "Organization Name for test Q4",
      street1: "Street 1 for test Q4",
      street2: "Street 2 for test Q4",
      city: "City for test Q4",
      state: "AL: Alabama",
      zip: "11111",
      district: "AL-001",
    },
    primeEntity: {
      orgName: "Organization for test",
      street1: "Street 1 for test",
      street2: "Street 2 for test",
      city: "City for test",
      state: "VA: Virginia",
      zip: "55555",
      district: "VA-001",
    },
    federalInfo: {
      agencyDepartment: "Federal Department or Agency for test",
      programName: "Battlefield Land Acquisition Grants for test",
      assistanceListingNumber: "15.92800000",
      actionNumber: "TES-QC-00-001",
      awardAmount: "9999999",
    },
    lobbyingRegistrant: {
      firstName: "First Name for test 10a",
      middleName: "Middle Name for test 10a",
      lastName: "Last Name for test 10a",
      prefix: "PrefixTest",
      suffix: "SuffixTest",
      street1: "Street 1 for test Q10a",
      street2: "Street 2 for test Q10a",
      city: "City for test Q10a",
      state: "AK: Alaska",
      zip: "55555",
    },
    performingService: {
      firstName: "First Name for test 10b",
      middleName: "Middle Name for test 10b",
      lastName: "Last Name for test 10b",
      prefix: "PrefixTest",
      suffix: "SuffixTest",
      street1: "Street 1 for test 10b",
      street2: "Street 2 for test 10b",
      city: "City for test 10b",
      state: "AK: Alaska",
      zip: "66666",
    },
    signature: {
      prefix: "PrefixTest",
      firstName: "First Name for test Signature",
      middleName: "Middle Name for test Signature",
      lastName: "Last Name for test Signature",
      suffix: "SuffixTest",
      title: "TitleTest",
      phone: "9999999999",
    },
  },
} as const;

export type SflllEntityData = (typeof FORMS_TEST_DATA)["sflll"];

export interface FormsFixtureData {
  formName: string;
  fields: FillFieldDefinition[];
}
