import { Meta } from "@storybook/nextjs";

import SearchQueryCopyButton from "src/components/search/SearchQueryCopyButton";

const meta: Meta<typeof SearchQueryCopyButton> = {
  title: "Components/Search/SavedSearchQuery",
  component: SearchQueryCopyButton,
  args: {
    copyText: "Copy this link to your clipboard",
    copiedText: "Copied!",
    copyingText: "copying",
    url: "https://www.example.com?query=example",
    snackbarMessage: "This is the success message that will let you know",
  },
};
export default meta;

export const Default = {};
