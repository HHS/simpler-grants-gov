import "../styles/styles.scss";

import type { AppProps } from "next/app";
import { GoogleTagManager } from "@next/third-parties/google";
import Head from "next/head";
import Layout from "../components/Layout";
import { PUBLIC_ENV } from "src/constants/environments";
import { appWithTranslation } from "next-i18next";
import { assetPath } from "src/utils/assetPath";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <link rel="icon" href={assetPath("/img/favicon.ico")} sizes="any" />
        {process.env.NEXT_PUBLIC_ENVIRONMENT !== "prod" && (
          <meta name="robots" content="noindex,nofollow" />
        )}
      </Head>
      <Layout>
        <Component {...pageProps} />
        {process.env.NEXT_PUBLIC_ENVIRONMENT === "prod" && (
          <GoogleTagManager gtmId={PUBLIC_ENV.GOOGLE_TAG_MANAGER_ID} />
        )}
      </Layout>
    </>
  );
}

export default appWithTranslation(MyApp);
