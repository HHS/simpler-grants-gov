function generateOpportunityNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `Test-${year}${month}${day}-${hours}${minutes}${seconds}-opportunity`;
}

function generateTodayDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const year = now.getFullYear();

  return `${month}/${day}/${year}`;
}

function generateDateFromToday(daysToAdd: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();

  return `${month}/${day}/${year}`;
}

// Fill data for Opportunity page
export const createOpportunityFillData = {
  opportunityNumber: generateOpportunityNumber(),
  opportunityTitle: `This is test data - ${generateOpportunityNumber()}`,
  grantSelectionMethod: "discretionary",
  assistanceListingNumber: "00.000",
};

// Fill data for Opportunity page
export const editOpportunityFillData = {
  fundingType: "grant",
  category: "recovery_act",
  expectedAwards: "10",
  totalProgram: "1000000",
  awardMinimum: "50000",
  awardMaximum: "100000",
  publishDate: generateTodayDate(),
  closeDate: generateDateFromToday(30),
  description: "Additional - Test opportunity description",
  additionalInfoLink: "https://www.example.com/additional-info",
  additionalInfoText: "Test Additional Info",
  grantorContact: "Test grantor contact details",
  contactEmail: "test@example.com",
  emailDisplayText: "Test Contact Email",
  eligibleApplicantSmallBusinesses: true,
  eligibleApplicantOtherNativeAmericanTribal: true,
  eligibleApplicantIndependentSchoolDistricts: true,
  eligibleApplicantIndividuals: true,
  eligibleApplicantStateGovernments: true,
};
