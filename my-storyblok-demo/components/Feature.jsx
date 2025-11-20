import { storyblokEditable } from "@storyblok/react";

const Feature = ({ blok }) => (
  <div className="column feature" {...storyblokEditable(blok)}>
    {blok.name}
  </div>
);

export default Feature;
