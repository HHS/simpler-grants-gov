import { Meta } from "@storybook/react";
import { AttachmentsCard } from "src/features/attachments/components/AttachmentsCard";
import { Attachment } from "src/types/attachmentTypes";

import attachmentsMock from "./attachments.mock.json";

const meta: Meta<typeof AttachmentsCard> = {
  title: "Components/Application/AttachmentsCard",
  component: AttachmentsCard,
  args: {
    attachments: attachmentsMock as Attachment[],
  },
};
export default meta;

export const Default = {};
