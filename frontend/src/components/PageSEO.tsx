import Head from "next/head";

type Props = {
  title: string;
  description: string;
};

const PageSEO = ({ title, description }: Props) => {
  return (
    <Head>
      <title>{title}</title>
      <meta property="og:title" content={title} key="title" />
      <meta
        data-testid="meta-description"
        name="description"
        content={description}
        key="description"
      />
    </Head>
  );
};

export default PageSEO;
