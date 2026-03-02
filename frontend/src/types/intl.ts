import type { useTranslations } from "next-intl";

export type TFn = ReturnType<typeof useTranslations<never>>;

export type LocalizedPageProps = { params: Promise<{ locale: string }> };
