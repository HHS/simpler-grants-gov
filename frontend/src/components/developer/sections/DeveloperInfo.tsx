"use client";

import { UswdsIconNames } from "src/types/generalTypes";
import { useUser } from "src/services/auth/useUser";
import { LOGIN_URL } from "src/constants/auth";
import SessionStorage from "src/services/sessionStorage/sessionStorage";

import { useMessages, useTranslations } from "next-intl";
import Link from "next/link";
import { Button, Grid } from "@trussworks/react-uswds";

import HomePageSection from "src/components/homepage/homePageSection";
import IconInfo from "src/components/homepage/IconInfoSection";

const DeveloperInfoContent = () => {
  const t = useTranslations("Developer");
  const messages = useMessages() as unknown as IntlMessages;
  const { iconSections } = messages.Developer;
  const { user } = useUser();

  const handleManageApiKeysClick = (e: React.MouseEvent) => {
    if (!user?.token) {
      e.preventDefault();
      const startURL = `${location.pathname}${location.search}`;
      if (startURL !== "") {
        SessionStorage.setItem("login-redirect", startURL);
      }
      window.location.href = LOGIN_URL;
    }
  };

  return (
    <HomePageSection className="bg-base-white" title={t("infoTitle")}>
      <h3 data-testid="developer-info">{t("canDoHeader")}</h3>
      <h4>{t("canDoSubHeader")}</h4>
      <p>{t("canDoParagraph")}</p>
      {user?.token ? (
        <Link href="/dev/api-dashboard">
          <Button
            className="margin-y-2 usa-button--secondary"
            type="button"
            size="big"
          >
            {t("featureFlagsLink")}
          </Button>
        </Link>
      ) : (
        <Button
          className="margin-y-2 usa-button--secondary"
          type="button"
          size="big"
          onClick={handleManageApiKeysClick}
        >
          {t("featureFlagsLink")}
        </Button>
      )}
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
