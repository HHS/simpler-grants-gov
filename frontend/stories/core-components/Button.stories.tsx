import { Button } from "@trussworks/react-uswds";

const meta = {
  title: "Core Components/Button",
  component: Button,
  args: {
    children: "Save",
    secondary: false,
    base: false,
    outline: false,
    inverse: false,
    unstyled: false,
    disabled: false,
  },
  argTypes: {
    accentStyle: {
      control: { type: "select" },
      options: ["cool", "warm"],
    },
    type: {
      control: { type: "select" },
      options: ["button", "submit", "reset"],
    },
  },
};
export default meta;

export const Default = {};

export const Secondary = (): React.ReactElement => (
  <Button type="button" secondary>
    Click Me
  </Button>
);

export const AccentCool = (): React.ReactElement => (
  <Button type="button" accentStyle="cool">
    Click Me
  </Button>
);

export const AccentWarm = (): React.ReactElement => (
  <Button type="button" accentStyle="warm">
    Click Me
  </Button>
);

export const Base = (): React.ReactElement => (
  <Button type="button" base>
    Click Me
  </Button>
);

export const Outline = (): React.ReactElement => (
  <Button type="button" outline>
    Click Me
  </Button>
);

export const Inverse = (): React.ReactElement => (
  <Button type="button" inverse>
    Click Me
  </Button>
);

export const Big = (): React.ReactElement => (
  <Button type="button" size="big">
    Click Me
  </Button>
);

export const Unstyled = (): React.ReactElement => (
  <Button type="button" unstyled>
    Click Me
  </Button>
);

export const CustomClass = (): React.ReactElement => (
  <Button type="button" className="custom-class">
    Click Me
  </Button>
);

export const Disabled = (): React.ReactElement => (
  <Button type="button" disabled>
    Click Me
  </Button>
);
