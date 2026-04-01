import { useTranslations } from "next-intl";

import { SavedOpportunityTag } from "./buildSavedOpportunityTags";
import { SavedOpportunityTagPill } from "./SavedOpportunityTagPill";

interface SavedOpportunityTagsProps {
  labelId: string;
  tags: SavedOpportunityTag[];
}

export function SavedOpportunityTags({
  labelId,
  tags,
}: SavedOpportunityTagsProps) {
  const t = useTranslations("Search");

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="saved-opportunity-tags margin-top-0 margin-bottom-05">
      <div id={labelId} className="font-sans-xs margin-bottom-05">
        <span className="text-bold">{t("shareWithYourList")}</span>
      </div>

      <ul
        className="saved-opportunity-tags__list usa-list--unstyled margin-0 padding-0"
        aria-labelledby={labelId}
      >
        {tags.map((tag) => (
          <li
            key={tag.key}
            className="saved-opportunity-tags__item margin-right-1"
          >
            <SavedOpportunityTagPill tag={tag} />
          </li>
        ))}
      </ul>
    </div>
  );
}
