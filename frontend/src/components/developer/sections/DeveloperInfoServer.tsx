import { UswdsIconNames } from "src/types/generalTypes";

import { useMessages, useTranslations } from "next-intl";
import { Grid } from "@trussworks/react-uswds";

import DeveloperPageSection from "src/components/developer/DeveloperPageSection";
import IconInfo from "src/components/homepage/IconInfoSection";

interface DeveloperInfoServerProps {
  children?: React.ReactNode;
}

export default function DeveloperInfoServer({
  children,
}: DeveloperInfoServerProps) {
  const t = useTranslations("Developer");
  const messages = useMessages() as unknown as IntlMessages;
  const { iconSections } = messages.Developer;

  return (
    <DeveloperPageSection className="bg-base-white" title={t("infoTitle")}>
      <h3 data-testid="developer-info">{t("canDoHeader")}</h3>
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
    </DeveloperPageSection>
  );
}
