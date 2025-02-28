import { Meta } from "@storybook/react";

import SearchSavedQuery from "src/components/search/SearchSavedQuery";

const meta: Meta<typeof SearchSavedQuery> = {
  title: "Components/Search/SearchSavedQuery",
  component: SearchSavedQuery,
  args: {
    copyText: "Copy this link to your clipboard",
    helpText: "This is a tooltip with some help text",
    url: "https://www.example.com?query=example",
    snackbarMessage: "This is the success message that will let you know",
  },
};
export default meta;

export const Default = {};
