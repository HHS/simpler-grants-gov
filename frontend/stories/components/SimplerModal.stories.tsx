import type { Meta, StoryObj } from "@storybook/react";
import { useRef } from "react";
import { Button, ModalRef, ModalToggleButton } from "@trussworks/react-uswds";

import { SimplerModal } from "src/components/SimplerModal";

const meta: Meta<typeof SimplerModal> = {
  title: "Components/SimplerModal",
  component: SimplerModal,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof SimplerModal>;

const Template = (args: any) => {
  const modalRef = useRef<ModalRef>(null);
  return (
    <>
      <Button type="button">
        <ModalToggleButton modalRef={modalRef} opener>
          Open Modal
        </ModalToggleButton>
      </Button>
      <SimplerModal {...args} modalRef={modalRef} />
    </>
  );
};

export const Default: Story = {
  render: Template,
  args: {
    modalId: "default-modal",
    title: "Default Modal",
    children: <p>This is a test modal content</p>,
  },
};

export const WithCustomCloseText: Story = {
  render: Template,
  args: {
    modalId: "custom-close-modal",
    title: "Custom Close Text",
    closeText: "Cancel",
    children: <p>This modal has custom close text</p>,
  },
};

export const WithOnClose: Story = {
  render: Template,
  args: {
    modalId: "onclose-modal",
    title: "With OnClose",
    onClose: () => console.log("Modal closed"),
    children: <p>This modal has an onClose handler</p>,
  },
};

export const WithForceAction: Story = {
  render: Template,
  args: {
    modalId: "force-action-modal",
    title: "Force Action",
    forceAction: true,
    children: <p>This modal requires an action to close</p>,
  },
};

export const WithCustomClassName: Story = {
  render: Template,
  args: {
    modalId: "custom-class-modal",
    title: "Custom Class",
    className: "custom-modal-class",
    children: <p>This modal has a custom class</p>,
  },
}; 