// currency-like string;
export const amountSchema = {
  type: "string" as const,
  pattern: "^\\d*([.]\\d{2})?$",
  maxLength: 14,
};

// Text schemas used
// in A/F (tweak limits if needed)
export const shortText50 = {
  type: "string" as const,
  minLength: 0,
  maxLength: 50,
};
export const remarks250 = {
  type: "string" as const,
  minLength: 0,
  maxLength: 250,
};

export const activityTitleSchema = {
  type: "string" as const,
  minLength: 0,
  maxLength: 120,
};

export const assistanceListingNumberSchema = {
  type: "string" as const,
  minLength: 0,
  maxLength: 15,
};
