import { useTranslations } from "next-intl";
import { GridContainer, Alert as USWDSAlert } from "@trussworks/react-uswds";

type BookmarkBannerProps = {
  containerClasses?: string;
};

const BookmarkBanner = ({ containerClasses }: BookmarkBannerProps) => {
  const t = useTranslations("BookmarkBanner");

  return (
    <div data-testid="bookmark-banner" className={containerClasses}>
      <GridContainer>
        <USWDSAlert type="info" headingLevel="h2" heading={t("title")} noIcon>
          {t("message")}
          <br />
          {t.rich("technicalSupportMessage", {
            mailToGrants: (content) => (
              <a href="mailto:simpler@grants.gov">{content}</a>
            ),
          })}
        </USWDSAlert>
      </GridContainer>
    </div>
  );
};

export default BookmarkBanner;
