// import { environment } from "src/constants/environments";
// import { FeatureFlagsManager } from "src/services/FeatureFlagManager";
// import { ServerSideSearchParams } from "src/types/searchRequestURLTypes";

// import React, { ComponentType } from "react";

// export const withFeatureFlagStatic = <
//   P extends { params: ServerSideSearchParams },
//   R,
// >(
//   WrappedComponent: ComponentType<P>,
//   featureFlagName: string,
//   onEnabled: () => R,
// ) => {
//   // eslint-disable-next-line
//   console.log("### flag render", featureFlagName, environment.NEXT_BUILD);

//   // ok we can switch off of the flag name (if we set up a config for non-ssg flags)
//   // but still need a way to know that we're in SSG
//   if (environment.NEXT_BUILD) {
//     return WrappedComponent;
//   }
//   const ComponentWithFeatureFlag = (props: P) => {
//     const featureFlagsManager = new FeatureFlagsManager();

//     if (featureFlagsManager.isFeatureEnabled(featureFlagName)) {
//       return onEnabled();
//     }

//     return <WrappedComponent {...props} />;
//   };

//   return ComponentWithFeatureFlag;
// };

// export default withFeatureFlagStatic;
