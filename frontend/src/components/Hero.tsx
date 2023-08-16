import { useTranslation } from "next-i18next";
import { GridContainer } from "@trussworks/react-uswds";

const Footer = () => {
  const { t } = useTranslation("common", {
    keyPrefix: "Hero",
  });

  return (
    <div className="bg-primary desktop:padding-y-15 tablet:padding-y-2 padding-y-1">
      <GridContainer>
          <h1 className="text-white desktop:font-sans-3xl tablet:font-sans-2xl font-sans-xl">{t("title")}</h1>
          <div className="desktop:font-sans-xl tablet:font-sans-lg font-sans-md">
            <span className="text-yellow text-bold">{t("beta")}</span>&nbsp;<span className="text-white">{t("content")}</span>
          </div>
      </GridContainer>
    </div>
  );
};

export default Footer;
