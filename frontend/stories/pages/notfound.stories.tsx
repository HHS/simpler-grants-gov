import { Meta } from "@storybook/nextjs";
import NotFound from "src/app/[locale]/(base)/not-found";

const meta: Meta<typeof NotFound> = {
  title: "Pages/Not Found",
  component: NotFound,
};

export default meta;

export const Default = {};
