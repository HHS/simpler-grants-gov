import { useEffect, useState } from "react";

export const useIsSSR = () => {
  const [isSSR, setIsSSR] = useState(true);
  useEffect(() => {
    // TODO #9633
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSSR(false);
  }, []);
  return isSSR;
};
