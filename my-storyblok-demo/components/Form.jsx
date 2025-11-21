import { StoryblokComponent } from '@storyblok/react';

const Form = ({ blok }) => {
  return (
    <form>
      {blok.fields.map((nestedBlok) => (
        <StoryblokComponent blok={nestedBlok} key={nestedBlok._uid} />
      ))}
    </form>
  );
}

export default Form;
