import { Meta } from "@storybook/react";

import SavedSearchQuery from "src/components/search/SavedSearchQuery";

const meta: Meta<typeof SavedSearchQuery> = {
  title: "Components/Search/SavedSearchQuery",
  component: SavedSearchQuery,
  args: {
    copyText: "Copy this link to your clipboard",
    copiedText: "Copied!",
    copyingText: "copying",
    helpText: "This is a tooltip with some help text",
    url: "https://www.example.com?query=example",
    snackbarMessage: "This is the success message that will let you know",
  },
};
export default meta;

export const Default = {};
