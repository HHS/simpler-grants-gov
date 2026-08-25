import ContentDisplayToggle from "src/components/core/ContentDisplayToggle";

const meta = {
  title: "Components/ContentDisplayToggle",
  component: ContentDisplayToggle,
};
export default meta;

export const Default = {
  args: {
    showCallToAction: "Show more",
    hideCallToAction: "Show less",
    children: (
      <p>
        This is the content that gets toggled. It could be anything: text, images, or other components.
      </p>
    )
  },
};
