import { useTranslations } from "next-intl";

export type AwardDataKeys =
  "programFunding" | "expectedAwards" | "awardCeiling" | "awardFloor";

type Props = {
  title: AwardDataKeys;
  content: string | number | null;
};

const OpportunityAwardGridRow = ({ title, content }: Props) => {
  const t = useTranslations("OpportunityListing.awardInfo");

  return (
    <div className="border radius-md border-base-lighter padding-x-2">
      <p className="desktop-lg:font-sans-sm margin-bottom-0 text-bold">
        {t(`${title}`)}
      </p>
      <p className="font-sans-sm">{content || t("notSpecified")}</p>
    </div>
  );
};

export default OpportunityAwardGridRow;
