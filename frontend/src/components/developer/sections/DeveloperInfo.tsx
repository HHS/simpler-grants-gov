"use client";

import { useUser } from "src/services/auth/useUser";
import { UswdsIconNames } from "src/types/generalTypes";

import { useMessages, useTranslations } from "next-intl";
import Link from "next/link";
import { useRef } from "react";
import {
  Button,
  Grid,
  ModalRef,
  ModalToggleButton,
} from "@trussworks/react-uswds";

import HomePageSection from "src/components/homepage/homePageSection";
import IconInfo from "src/components/homepage/IconInfoSection";
import { LoginModal } from "src/components/LoginModal";

const DeveloperInfoContent = () => {
  const t = useTranslations("Developer");
  const headerTranslations = useTranslations("HeaderLoginModal");
  const messages = useMessages() as unknown as IntlMessages;
  const { iconSections } = messages.Developer;
  const { user } = useUser();
  const modalRef = useRef<ModalRef>(null);

  return (
    <HomePageSection className="bg-base-white" title={t("infoTitle")}>
      <h3 data-testid="developer-info">{t("canDoHeader")}</h3>
      <h4>{t("canDoSubHeader")}</h4>
      <p>{t("canDoParagraph")}</p>
      {user?.token ? (
        <Link href="/api-dashboard">
          <Button
            className="margin-y-2 usa-button--secondary"
            type="button"
            size="big"
          >
            {t("apiDashboardLink")}
          </Button>
        </Link>
      ) : (
        <>
          <ModalToggleButton
            modalRef={modalRef}
            opener
            className="margin-y-2 usa-button usa-button--secondary usa-button--big"
            type="button"
          >
            {t("apiDashboardLink")}
          </ModalToggleButton>
          <LoginModal
            modalRef={modalRef as React.RefObject<ModalRef>}
            helpText={headerTranslations("help")}
            buttonText={headerTranslations("button")}
            closeText={headerTranslations("close")}
            descriptionText={headerTranslations("description")}
            titleText={headerTranslations("title")}
            modalId="developer-api-keys-login-modal"
          />
        </>
      )}
      <h4>{t("cantDoHeader")}</h4>
      {t.rich("cantDoParagraph", {
        ul: (chunks) => <ul className="usa-list">{chunks}</ul>,
        li: (chunks) => <li>{chunks}</li>,
        p: (chunks) => <p>{chunks}</p>,
      })}
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
