import { Suspense } from "react";

import DevelopersInfoButtons from "./DevelopersInfoButtons";
import DevelopersInfoServer from "./DevelopersInfoServer";

const DevelopersInfoContent = () => {
  return (
    <DevelopersInfoServer>
      <Suspense
        fallback={
          <div className="height-10 width-40 bg-base-lighter margin-y-2 animate-pulse" />
        }
      >
        <DevelopersInfoButtons />
      </Suspense>
    </DevelopersInfoServer>
  );
};

export default DevelopersInfoContent;
