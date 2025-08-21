import { UswdsIconNames } from "src/types/generalTypes";

import { useMessages, useTranslations } from "next-intl";
import Link from "next/link";
import { Button, Grid } from "@trussworks/react-uswds";

import HomePageSection from "src/components/homepage/homePageSection";
import IconInfo from "src/components/homepage/IconInfoSection";

const DeveloperInfoContent = () => {
  const t = useTranslations("Developer");
  const messages = useMessages() as unknown as IntlMessages;
  const { iconSections } = messages.Developer;

  return (
    <HomePageSection className="bg-base-lightest" title={t("infoTitle")}>
      <h3 data-testid="developer-info">{t("canDoHeader")}</h3>
      <h4>{t("canDoSubHeader")}</h4>
      <p>{t("canDoParagraph")}</p>
      <Link href="/dev/api-dashboard">
        <Button
          className="margin-y-2 usa-button--secondary"
          type="button"
          size="big"
        >
          {t("featureFlagsLink")}
        </Button>
      </Link>
      <h4>{t("cantDoHeader")}</h4>
      <p>{t("cantDoParagraph")}</p>
      <Grid row className="padding-y-2" gap="md">
        {iconSections.map((iconSection, iconSectionIdx) => (
          <Grid col={6} key={`developer-iconsection-${iconSectionIdx}`}>
            <IconInfo
              description={iconSection.description}
              iconName={iconSection.iconName as UswdsIconNames}
              link={iconSection.http}
              linkText={iconSection.link}
              title={iconSection.title}
            />
          </Grid>
        ))}
      </Grid>
    </HomePageSection>
  );
};

export default DeveloperInfoContent;
