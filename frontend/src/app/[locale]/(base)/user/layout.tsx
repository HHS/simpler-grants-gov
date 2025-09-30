import { Metadata } from "next";
import { LayoutProps } from "src/types/generalTypes";
import { LocalizedPageProps } from "src/types/intl";

import { getTranslations } from "next-intl/server";

import { AuthenticationGate } from "src/components/user/AuthenticationGate";

export async function generateMetadata({
  params,
}: LocalizedPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  const meta: Metadata = {
    title: t("UserAccount.pageTitle"),
    description: t("Index.metaDescription"),
  };
  return meta;
}
export default function UserLayout({ children }: LayoutProps) {
  return <AuthenticationGate>{children}</AuthenticationGate>;
}

// export default async function UserLayout({ children }: LayoutProps) {
//   const session = await getSession();
//   if (!session) {
//     return <div>no session</div>;
//   }
//   const userDetailsPromise = getUserDetails(session.token, session.user_id);
//   return (
//     <AuthorizationGate
//       resourcePromises={{ userDetails: userDetailsPromise }}
//       onUnauthorized={() => <div>not authorized!</div>}
//     >
//       {children}
//     </AuthorizationGate>
//   );
// }
