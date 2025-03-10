import { useState } from "react";

import Snackbar from "src/components/Snackbar";

export const useSnackbar = () => {
  const [snackbarIsVisible, setSnackbarIsVisible] = useState<boolean>(false);

  const showSnackbar = (visibleTime: number) => {
    setSnackbarIsVisible(true);
    console.log("~~~ setting timeout");
    setTimeout(() => {
      console.log("~~~ setting not visible");
      setSnackbarIsVisible(false);
    }, visibleTime);
  };

  const hideSnackbar = () => {
    setSnackbarIsVisible(false);
  };

  return { hideSnackbar, snackbarIsVisible, showSnackbar, Snackbar };
};
