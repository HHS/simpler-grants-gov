/**
 * Reusable opportunity test data used by multiple end-to-end specs.
 */

// A real agency ID that an org-member user should not have access to.
// Used to verify the opportunities page shows an agency not authorized state.
export const VALID_NON_MEMBER_AGENCY_ID =
  "38c85104-1136-4b86-a440-ad99ab612d3b";

// A syntactically valid, non-existent agency ID used to verify the
// opportunities page handles invalid agency lookup fallback behavior.
export const INVALID_AGENCY_ID =
  "00000000-0000-0000-0000-000000000000";
