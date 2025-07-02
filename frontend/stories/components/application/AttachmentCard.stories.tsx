import { Meta } from "@storybook/react";
import { Attachment } from "src/types/attachmentTypes";

import { AttachmentsCard } from "src/components/application/attachments/AttachmentsCard";
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
