import Head from "next/head";

type Props = {
  title: string;
  description: string;
  titleKey: string;
};

const PageSEO = ({ title, description, titleKey }: Props) => {
  return (
    <Head>
      <title>{title}</title>
      <meta property="og:title" content={title} key={titleKey} />
      <meta name="description" content={description} />
    </Head>
  );
};

export default PageSEO;
