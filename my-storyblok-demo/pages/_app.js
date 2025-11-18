import "../styles/globals.css";
import StoryblokProvider from "../components/StoryblokProvider";

// const components = {
//   feature: Feature,
//   grid: Grid,
//   teaser: Teaser,
//   page: Page,
// };

// storyblokInit({
//   accessToken: "R3ZU8cz4h4Nzpv61QaQtawtt",
//   use: [apiPlugin],
//   components,
//   apiOptions: {
//     region: "",
//   },
// });

function MyApp({ Component, pageProps }) {
  return (
    <StoryblokProvider>
      <Component {...pageProps} />
    </StoryblokProvider>
  );
}

export default MyApp;
