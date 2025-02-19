import { Meta } from "@storybook/react";

import { Button } from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

type ButtonProps = {
  type: "button" | "submit" | "reset";
  children: React.ReactNode;
  secondary?: boolean;
  base?: boolean;
  accentStyle?: "cool" | "warm";
  outline?: boolean;
  inverse?: boolean;
  size?: "big";
  unstyled?: boolean;
  icon: string;
  disabled?: boolean;
};

const ButtonWithIcon = ({ children, icon, ...props }: ButtonProps) => {
  return (
    <Button {...props} type="button">
      <USWDSIcon className="button-icon-large" name={icon} />
      {children}
    </Button>
  );
};

const meta: Meta<typeof ButtonWithIcon> = {
  title: "Components/ButtonWithIcon",
  component: ButtonWithIcon,
  args: {
    children: "Save",
    secondary: false,
    base: false,
    outline: false,
    inverse: false,
    unstyled: false,
    disabled: false,
    icon: "star",
  },
  argTypes: {
    icon: {
      control: { type: "select" },
      options: [
        "add",
        "arrow_downward",
        "autorenew",
        "check",
        "content_copy",
        "delete",
        "file_download",
        "favorite",
        "favorite_border",
        "star",
        "star_outline",
      ],
    },
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
