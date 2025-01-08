import { Dispatch, SetStateAction, useEffect, useState } from "react";

// reference to all active uswds breakpoints
// see https://designsystem.digital.gov/utilities/display/
// and _uswds-theme.scss
const BREAKPOINTS = {
  mobileLg: 480,
  tablet: 640,
  tabletLg: 880,
  desktop: 1024,
  desktopLg: 1200,
};

type ActiveBreakpoints = keyof typeof BREAKPOINTS;

const onMediaChange = (fn: (value: boolean) => void) => {
  return (e: MediaQueryListEvent) => {
    if (e.matches) {
      fn(true);
      return;
    }
    fn(false);
  };
};

export const useMediaQuery = () => {
  const [mobileLg, setMobileLg] = useState<boolean>(false);
  const [tablet, setTablet] = useState<boolean>(false);
  const [tabletLg, setTabletLg] = useState<boolean>(false);
  const [desktop, setDesktop] = useState<boolean>(false);
  const [desktopLg, setDesktopLg] = useState<boolean>(false);

  useEffect(() => {
    const onMediaChangeFunctions: {
      [key in ActiveBreakpoints]: (e: MediaQueryListEvent) => void;
    } = {
      mobileLg: onMediaChange(setMobileLg),
      tablet: onMediaChange(setTablet),
      tabletLg: onMediaChange(setTabletLg),
      desktop: onMediaChange(setDesktop),
      desktopLg: onMediaChange(setDesktopLg),
    };

    const setStateFunctions: {
      [key in ActiveBreakpoints]: Dispatch<SetStateAction<boolean>>;
    } = {
      mobileLg: setMobileLg,
      tablet: setTablet,
      tabletLg: setTabletLg,
      desktop: setDesktop,
      desktopLg: setDesktopLg,
    };

    Object.entries(BREAKPOINTS).forEach(([breakpointName, breakpointPx]) => {
      const onMediaChange =
        onMediaChangeFunctions[breakpointName as ActiveBreakpoints];
      const setState = setStateFunctions[breakpointName as ActiveBreakpoints];
      const mediaQuery = `(min-width:${breakpointPx}px)`;
      const mediaQueryList = matchMedia(mediaQuery);
      mediaQueryList.addEventListener("change", onMediaChange);
      if (mediaQueryList.matches) {
        setState(true);
      }
    }, {});
  }, []);

  return {
    mobileLg,
    tablet,
    tabletLg,
    desktop,
    desktopLg,
  };
};
