import { Meta, StoryObj } from "@storybook/react";

import PdfContainer from "src/components/PdfContainer";

const meta: Meta<typeof PdfContainer> = {
  title: "Components/Pdf Container",
  component: PdfContainer,
};
export default meta;
type Story = StoryObj<typeof PdfContainer>;

export const Primary: Story = {
  parameters: {
    design: {
      type: "figma",
      url: "https://www.figma.com/file/lpKPdyTyLJB5JArxhGjJnE/beta.grants.gov?type=design&node-id=86-600&mode=design&t=gEXdEnzZUfuODXut-4",
    },
  },
  args: {
    file: "/docs/acl_prototype.pdf",
    image: "/img/acl_prototype.png",
    alt: "This should be a key in i18n",
  },
};
