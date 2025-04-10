import { useCallback, useState } from "react";

import Snackbar from "src/components/Snackbar";

const SNACKBAR_VISIBLE_TIME = 6000;

export const useSnackbar = () => {
  const [snackbarIsVisible, setSnackbarIsVisible] = useState<boolean>(false);

  const showSnackbar = useCallback((visibleTime = SNACKBAR_VISIBLE_TIME) => {
    setSnackbarIsVisible(true);
    setTimeout(() => {
      setSnackbarIsVisible(false);
    }, visibleTime);
  }, []);

  const hideSnackbar = () => {
    setSnackbarIsVisible(false);
  };

  return { hideSnackbar, snackbarIsVisible, showSnackbar, Snackbar };
};
