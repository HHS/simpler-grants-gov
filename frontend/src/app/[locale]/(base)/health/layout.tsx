
import { LayoutProps } from "src/types/generalTypes";
import Layout from "src/components/Layout";
import { setRequestLocale } from "next-intl/server";

export default async function BaseLayout({ children, params }: LayoutProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (

          <Layout locale={locale}><h1>(health) layout</h1>{children}</Layout>

  );
}
