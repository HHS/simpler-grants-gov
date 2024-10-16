import { useTranslations } from "next-intl";

export type AwardDataKeys =
  | "program_funding"
  | "expected_awards"
  | "award_ceiling"
  | "award_floor";

type Props = {
  title: AwardDataKeys;
  content: string | number | null;
};

const defaultContentByType = (type: AwardDataKeys) =>
  type === "expected_awards" ? "--" : "$--";

const OpportunityAwardGridRow = ({ title, content }: Props) => {
  const t = useTranslations("OpportunityListing.award_info");

  return (
    <div className="border radius-md border-base-lighter padding-x-2  ">
      <p className="font-sans-sm text-bold margin-bottom-0">
        {content || defaultContentByType(title)}
      </p>
      <p className="desktop-lg:font-sans-sm margin-top-0">{t(`${title}`)}</p>
    </div>
  );
};

export default OpportunityAwardGridRow;
