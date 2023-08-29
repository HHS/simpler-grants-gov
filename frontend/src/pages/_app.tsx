import { PUBLIC_ENV } from "src/constants/environments";

import { appWithTranslation } from "next-i18next";
import type { AppProps } from "next/app";
import Head from "next/head";
import Script from "next/script";

import Layout from "../components/Layout";

import "../styles/styles.scss";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link
          rel="icon"
          href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/img/logo.svg`}
        />
      </Head>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${PUBLIC_ENV.GOOGLE_ANALYTICS_ID}`}
      />
      <Script id="google-analytics">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', ${PUBLIC_ENV.GOOGLE_ANALYTICS_ID});
        `}
      </Script>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </>
  );
}

export default appWithTranslation(MyApp);
