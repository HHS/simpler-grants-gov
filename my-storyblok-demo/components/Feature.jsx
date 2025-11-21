import { storyblokEditable } from "@storyblok/react";

const Feature = ({ blok }) => {
  return (
  <div {...storyblokEditable(blok)}>
    { blok.headerText && <div>{blok.headerText}</div> }
    { blok.headerDescription && <div>{blok.headerDescription}</div> }
  </div>
  );
}

export default Feature;
