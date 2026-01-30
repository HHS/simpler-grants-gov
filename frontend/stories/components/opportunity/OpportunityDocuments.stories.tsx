import { Meta } from "@storybook/nextjs";

import OpportunityDocuments from "src/components/opportunity/OpportunityDocuments";

const meta: Meta<typeof OpportunityDocuments> = {
  title: "Components/OpportunityDocuments",
  component: OpportunityDocuments,
};
export default meta;

export const Default = {
  args: {
    documents: [
      {
        file_name: "FundingInformation.pdf",
        download_path: "https://example.com",
        updated_at: "2021-10-01T00:00:00Z",
      },
      {
        file_name: "File2_ExhibitB.pdf",
        download_path: "https://example.com",
        updated_at: "2021-10-01T00:00:00Z",
      },
    ],
  },
};
