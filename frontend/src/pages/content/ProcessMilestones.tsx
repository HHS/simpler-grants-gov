import { ExternalRoutes } from "src/constants/routes";

import { Trans, useTranslation } from "next-i18next";
import Link from "next/link";
import {
  Button,
  Grid,
  Icon,
  IconList,
  IconListContent,
  IconListIcon,
  IconListItem,
  IconListTitle,
} from "@trussworks/react-uswds";

import ContentLayout from "src/components/ContentLayout";

type Boxes = {
  title: string;
  content: string;
};

const ProcessMilestones = () => {
  const { t } = useTranslation("common", { keyPrefix: "Process" });

  const iconList: Boxes[] = t("milestones.icon_list", { returnObjects: true });

  const getIcon = (iconIndex: number) => {
    switch (iconIndex) {
      case 0:
        return <Icon.Search aria-hidden={true} className="text-middle" />;
      case 1:
        return <Icon.Assessment aria-hidden={true} className="text-middle" />;
      case 2:
        return <Icon.ContentCopy aria-hidden={true} className="text-middle" />;
      default:
        return <></>;
    }
  };

  return (
    <>
      <ContentLayout
        title={t("milestones.tag")}
        data-test-id="process-high-level-content"
        titleSize="m"
        bottomBorder="none"
      >
        {!Array.isArray(iconList)
          ? ""
          : iconList.map((box, index) => {
              return (
                <Grid key={box.title + "-key"} tabletLg={{ col: 4 }}>
                  <IconList className="usa-icon-list--size-lg">
                    <IconListItem className="margin-top-4">
                      <IconListIcon>{getIcon(index)}</IconListIcon>
                      <IconListContent>
                        <IconListTitle className="margin-bottom-2" type="h3">
                          {box.title}
                        </IconListTitle>
                        <Trans
                          t={t}
                          i18nKey={box.content}
                          components={{
                            p: (
                              <p className="font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6"></p>
                            ),
                          }}
                        />
                      </IconListContent>
                    </IconListItem>
                  </IconList>
                </Grid>
              );
            })}
      </ContentLayout>
      <ContentLayout
        title={t("milestones.title_1")}
        data-testid="process-methodology-content"
        titleSize="m"
        bottomBorder="none"
        paddingTop={false}
      >
        <Grid tabletLg={{ col: 6 }}>
          <p className="usa-intro">{t("milestones.paragraph_1")}</p>
        </Grid>
        <Grid tabletLg={{ col: 6 }}>
          <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
            {t("milestones.sub_title_1")}
          </h3>
          <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
            {t("milestones.sub_paragraph_1")}
          </p>
          <h3 className="tablet-lg:font-sans-lg margin-top-4 margin-bottom-2">
            {t("milestones.sub_title_2")}
          </h3>
          <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
            {t("milestones.sub_paragraph_2")}
          </p>
          <Link href={ExternalRoutes.MILESTONES} passHref>
            <Button className="margin-bottom-4" type="button" size="big">
              {t("milestones.cta_1")}{" "}
              <Icon.Launch
                className="text-middle"
                size={4}
                aria-label="launch"
              />
            </Button>
          </Link>
        </Grid>
      </ContentLayout>
      <ContentLayout
        title={t("milestones.title_2")}
        data-testid="process-methodology-content"
        paddingTop={false}
        titleSize="m"
        bottomBorder="none"
      >
        <Grid tabletLg={{ col: 6 }}>
          <p className="usa-intro">{t("milestones.paragraph_2")}</p>
        </Grid>
        <Grid tabletLg={{ col: 6 }}>
          <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
            {t("milestones.sub_title_3")}
          </h3>
          <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
            <Trans
              t={t}
              i18nKey="milestones.sub_paragraph_3"
              components={{
                LinkToGrants: (
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href={ExternalRoutes.GRANTS_HOME}
                  />
                ),
              }}
            />
          </p>
          <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
            <Trans
              t={t}
              i18nKey="milestones.sub_paragraph_4"
              components={{
                LinkToNewsletter: <Link href="/newsletter" />,
              }}
            />
          </p>
          <Link href={ExternalRoutes.MILESTONES} passHref>
            <Button className="margin-bottom-4" type="button" size="big">
              {t("milestones.cta_2")}{" "}
              <Icon.Launch
                className="text-middle"
                size={4}
                aria-label="launch"
              />
            </Button>
          </Link>
        </Grid>
      </ContentLayout>
    </>
  );
};

export default ProcessMilestones;
