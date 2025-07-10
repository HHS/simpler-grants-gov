import QueryProvider from "src/services/search/QueryProvider";
import { LayoutProps } from "src/types/generalTypes";

export default function SearchLayout({ children }: LayoutProps) {
  return (
    <>
      <QueryProvider>{children}</QueryProvider>
    </>
  );
}
