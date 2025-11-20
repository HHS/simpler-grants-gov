import "../styles/globals.css";
import StoryblokProvider from "../components/StoryblokProvider";

function MyApp({ children }) {
  console.log('layout')
  return (
    <html>
      <body>
        <StoryblokProvider>{children}</StoryblokProvider>
      </body>
    </html>
  );
}

export default MyApp;
