import { Meta } from "@storybook/react";
import { OpportunityOverview } from "src/types/opportunity/opportunityResponseTypes";

import { AttachmentsCard } from "src/components/application/AttachmentsCard";
import attachmentsMock from "./attachments.mock.json";
import { Attachment } from "src/types/attachmentTypes";

const meta: Meta<typeof AttachmentsCard> = {
  title: "Components/Application/AttachmentsCard",
  component: AttachmentsCard,
  args: {
    attachments: attachmentsMock as Attachment[],
  },
};
export default meta;

export const Default = {};
