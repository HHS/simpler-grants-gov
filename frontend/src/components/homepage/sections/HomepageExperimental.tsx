import { UswdsIconNames } from "src/types/generalTypes";

import { useMessages, useTranslations } from "next-intl";
import Link from "next/link";
import { Button, Grid } from "@trussworks/react-uswds";

import HomePageSection from "src/components/homepage/homePageSection";
import IconInfo from "src/components/homepage/IconInfoSection";

const ExperimentalContent = () => {
  const t = useTranslations("Homepage.sections.experimental");
  const messages = useMessages() as unknown as IntlMessages;
  const { iconSections } = messages.Homepage.sections.experimental;

  return (
    <HomePageSection className="bg-base-lightest" title={t("title")}>
      <h3 data-testid="homepage-experimental">{t("canDoHeader")}</h3>
      <h4>{t("canDoSubHeader")}</h4>
      <p>{t("canDoParagraph")}</p>
      <Link href="/search">
        <Button
          className="margin-y-2 usa-button--secondary"
          type="button"
          size="big"
        >
          {t("tryLink")}
        </Button>
      </Link>
      <h4>{t("cantDoHeader")}</h4>
      <p>{t("cantDoParagraph")}</p>
      <Grid row className="padding-y-2" gap="md">
        {iconSections.map((iconSection, iconSectionIdx) => (
          <Grid col={6} key={`experimental-iconsection-${iconSectionIdx}`}>
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

export default ExperimentalContent;
