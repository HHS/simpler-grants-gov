import clsx from "clsx";

type SnackbarProps = {
  isVisible: boolean;
  children?: React.ReactNode;
};

const Snackbar = ({ isVisible = false, children }: SnackbarProps) => {
  return (
    <div
      data-testid="snackbar"
      className={clsx(
        "text-left position-fixed padding-2 text-white font-sans-2xs radius-md bg-base-darkest usa-modal-wrapper top-0 right-0",
        {
          "is-visible": isVisible,
          "is-hidden": !isVisible,
        },
      )}
    >
      {children}
    </div>
  );
};

export default Snackbar;
