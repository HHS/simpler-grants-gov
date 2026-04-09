import { UswdsIconNames } from "src/types/generalTypes";

import { useMessages, useTranslations } from "next-intl";
import { Grid } from "@trussworks/react-uswds";

import DevelopersPageSection from "src/components/developers/DevelopersPageSection";
import IconInfo from "src/components/homepage/IconInfoSection";

interface DevelopersInfoServerProps {
  children?: React.ReactNode;
}

export default function DevelopersInfoServer({
  children,
}: DevelopersInfoServerProps) {
  const t = useTranslations("Developers");
  const messages = useMessages() as unknown as IntlMessages;
  const { iconSections } = messages.Developers;

  return (
    <DevelopersPageSection className="bg-base-white" title={t("infoTitle")}>
      <h3 data-testid="developers-info">{t("canDoHeader")}</h3>
      <h4>{t("canDoSubHeader")}</h4>
      <p>{t("canDoParagraph")}</p>

      {/* Client-side button component will be inserted here */}
      {children}

      <h4>{t("cantDoHeader")}</h4>
      {t.rich("cantDoParagraph", {
        ul: (chunks) => <ul className="usa-list">{chunks}</ul>,
        li: (chunks) => <li>{chunks}</li>,
        p: (chunks) => <p>{chunks}</p>,
      })}
      <Grid row className="padding-y-2" gap="md">
        {iconSections.map((iconSection, iconSectionIdx) => (
          <Grid col={6} key={`developers-iconsection-${iconSectionIdx}`}>
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
    </DevelopersPageSection>
  );
}
