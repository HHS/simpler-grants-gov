import { Suspense } from "react";

import DeveloperInfoButtons from "./DeveloperInfoButtons";
import DeveloperInfoServer from "./DeveloperInfoServer";

const DeveloperInfoContent = () => {
  return (
    <DeveloperInfoServer>
      <Suspense
        fallback={
          <div className="height-10 width-40 bg-base-lighter margin-y-2 animate-pulse" />
        }
      >
        <DeveloperInfoButtons />
      </Suspense>
    </DeveloperInfoServer>
  );
};

export default DeveloperInfoContent;
