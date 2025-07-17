import { useTranslations } from "next-intl";
import { GridContainer, Alert as USWDSAlert } from "@trussworks/react-uswds";

type BookmarkBannerProps = {
  containerClasses?: string;
  message?: string;
};

const BookmarkBanner = ({ containerClasses, message }: BookmarkBannerProps) => {
  const t = useTranslations("BookmarkBanner");

  const defaultMessage = (
    <>
      {t("message")}
      <br />
      {t.rich("technicalSupportMessage", {
        mailToGrants: (content) => (
          <a href="mailto:simpler@grants.gov">{content}</a>
        ),
      })}
    </>
  );

  return (
    <div data-testid="bookmark-banner" className={containerClasses}>
      <GridContainer>
        <USWDSAlert type="info" headingLevel="h2" heading={t("title")}>
          {message || defaultMessage}
        </USWDSAlert>
      </GridContainer>
    </div>
  );
};

export default BookmarkBanner;
