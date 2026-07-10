import Snackbar from "src/components/core/Snackbar";

const meta = {
  title: "Components/Snackbar",
  component: Snackbar,
  args: {
    isVisible: true,
    children: (
      <>
        {"This is a snackbar"}
        <br />
        {"This is a second line"}
      </>
    ),
  },
};
export default meta;

export const Default = {};
