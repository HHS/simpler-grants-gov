import React from 'react';
import UserProvider from "src/services/auth/UserProvider";

export default async function Layout({
    children, locale,
  }: {
    children: React.ReactNode;
    locale: string;
  })  {
    console.log(UserProvider)
  return (
    <UserProvider>{children}</UserProvider>
  );
}
