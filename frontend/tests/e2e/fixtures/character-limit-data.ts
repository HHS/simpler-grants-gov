// General character limit test data for forms
export const characterLimitData = [
  {
    fieldKey: "opportunityNumber",
    label: "Opportunity number*",
    valid: "A".repeat(40),
    invalid: "A".repeat(41),
    overLimitCount: 1,
    maxLength: 40
  },
  {
    fieldKey: "opportunityTitle",
    label: "Opportunity title*",
    valid: "A".repeat(255),
    invalid: "A".repeat(256),
    overLimitCount: 1,
    maxLength: 255
  },
  {
    fieldKey: "assistanceListingNumber",
    label: "Assistance listing number*",
    valid: "0".repeat(6),
    invalid: "0".repeat(7),
    overLimitCount: 1,
    maxLength: 6
  }
];
