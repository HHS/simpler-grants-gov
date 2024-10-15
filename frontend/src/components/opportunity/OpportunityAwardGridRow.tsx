import { useTranslations } from "next-intl";

type Props = {
  title: string | number;
  content: string | number | null;
};

type TranslationKeys =
  | "program_funding"
  | "expected_awards"
  | "award_ceiling"
  | "award_floor";

const OpportunityAwardGridRow = ({ title, content }: Props) => {
  const t = useTranslations("OpportunityListing.award_info");

  return (
    <div className="border radius-md border-base-lighter padding-x-2  ">
      <p className="font-sans-sm text-bold margin-bottom-0">{content}</p>
      <p className="desktop-lg:font-sans-sm margin-top-0">
        {t(`${title as TranslationKeys}`)}
      </p>
    </div>
  );
};

export default OpportunityAwardGridRow;
