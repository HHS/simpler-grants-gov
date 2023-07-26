import { Meta } from "@storybook/react";

import Header from "src/components/Header";

const meta: Meta<typeof Header> = {
  title: 'Components/Layout/Header',
  component: Header,
};
export default meta;

/**
 * Below is an example of using Storybook's `args` feature to render
 * different versions of the same component.
 * @see https://storybook.js.org/docs/react/writing-stories/args
 */
export const Preview1 = {
  args: {
  },
};

export const Preview2 = {
  args: {
  },
};
