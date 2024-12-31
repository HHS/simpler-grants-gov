import { stringToBoolean } from "src/utils/generalUtils";

// import { unstable_noStore } from "next/cache";

// unstable_noStore();

const {
  // NEXT_PUBLIC_BASE_URL, // if we're keeping this we should move it here
  NEXT_PUBLIC_FEATURE_SEARCH_OFF,
  NEXT_PUBLIC_FEATURE_OPPORTUNITY_OFF,
  NEXT_PUBLIC_FEATURE_AUTH_OFF,
} = process.env;

console.log("$$$ client side env", NEXT_PUBLIC_FEATURE_AUTH_OFF);

export const clientSideFeatureFlags = {
  opportunityOff: stringToBoolean(NEXT_PUBLIC_FEATURE_OPPORTUNITY_OFF),
  searchOff: stringToBoolean(NEXT_PUBLIC_FEATURE_SEARCH_OFF),
  authOff: stringToBoolean(NEXT_PUBLIC_FEATURE_AUTH_OFF),
};
