export interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export interface OptionalStringDict {
  [key: string]: string | undefined;
}
