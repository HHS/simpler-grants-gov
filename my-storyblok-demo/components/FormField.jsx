import { storyblokEditable } from "@storyblok/react";

const FormField = ({ blok }) => {
  console.log('field', blok)
  return (
  <div {...storyblokEditable(blok)}>
    { blok.field_label && <div>{blok.field_label}</div> }
    <input style={{
      border: "1px solid #76766a",
      "-webkit-appearance": "none",
      "-moz-appearance": "none",
      appearance: "none",
      "border-radius": "0",
      color: "#171716",
      display: "block",
      height: "2.5rem",
      "margin-top": ".5rem",
      "max-width": "30rem",
      padding: ".5rem",
      width: "100%",
      }}
      type='text' />
  </div>
  );
}

export default FormField;
