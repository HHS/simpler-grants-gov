import { useState } from "react";

import Snackbar from "src/components/Snackbar";

export const useSnackbar = () => {
  const [snackbarIsVisible, setSnackbarIsVisible] = useState<boolean>(false);

  const showSnackbar = (visibleTime: number) => {
    setSnackbarIsVisible(true);
    setTimeout(() => {
      setSnackbarIsVisible(false);
    }, visibleTime);
  };

  const hideSnackbar = () => {
    setSnackbarIsVisible(false);
  };

  return { hideSnackbar, snackbarIsVisible, showSnackbar, Snackbar };
};
