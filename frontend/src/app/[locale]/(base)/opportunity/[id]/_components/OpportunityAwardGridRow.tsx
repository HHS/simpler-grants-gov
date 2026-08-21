import { useTranslations } from "next-intl";

export type AwardDataKeys =
  | "programFunding"
  | "expectedAwards"
  | "awardCeiling"
  | "awardFloor";

type Props = {
  title: AwardDataKeys;
  content: string | number | null;
};

const defaultContentByType = (type: AwardDataKeys) =>
  type === "expectedAwards" ? "--" : "$--";

const OpportunityAwardGridRow = ({ title, content }: Props) => {
  const t = useTranslations("OpportunityListing.awardInfo");

  return (
    <div className="border radius-md border-base-lighter padding-x-2">
      <p className="font-sans-sm text-bold margin-bottom-0">
        {content || defaultContentByType(title)}
      </p>
      <p className="desktop-lg:font-sans-sm">{t(`${title}`)}</p>
    </div>
  );
};

export default OpportunityAwardGridRow;
