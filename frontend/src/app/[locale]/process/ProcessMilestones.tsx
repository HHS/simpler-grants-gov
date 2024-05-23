import { ExternalRoutes } from "src/constants/routes";
import React from "react";

import { useTranslations, useMessages } from "next-intl";
import Link from "next/link";
import {
  Button,
  Grid,
  IconList,
  IconListContent,
  IconListIcon,
  IconListItem,
  IconListTitle,
} from "@trussworks/react-uswds";
import { USWDSIcon } from "src/components/USWDSIcon";

import ContentLayout from "src/components/ContentLayout";

const ProcessMilestones = () => {
  const t = useTranslations("Process");

  const messages = useMessages() as unknown as IntlMessages;
  const keys = Object.keys(messages.Process.milestones.icon_list);

  const getIcon = (iconIndex: number) => {
    switch (iconIndex) {
      case 0:
        return <USWDSIcon className="usa-icon" name="search" />;
      case 1:
        return <USWDSIcon className="usa-icon" name="assessment" />;
      case 2:
        return <USWDSIcon className="usa-icon" name="content_copy" />;
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
        bottomBorder="dark"
        gridGap={6}
      >
        {keys.map((key, index) => {
          const title = t(`milestones.icon_list.${key}.title`);
          const content = t.rich(`milestones.icon_list.${key}.content`, {
            p: (chunks) => (
              <p className="font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
                {chunks}
              </p>
            ),
            italics: (chunks) => <em>{chunks}</em>,
          });

          return (
            <Grid key={title + "-key"} tabletLg={{ col: 4 }}>
              <IconList className="usa-icon-list--size-lg">
                <IconListItem className="margin-top-4">
                  <IconListIcon>{getIcon(index)}</IconListIcon>
                  <IconListContent className="tablet-lg:padding-right-3 desktop-lg:padding-right-105">
                    <IconListTitle className="margin-bottom-2" type="h3">
                      {title}
                    </IconListTitle>
                    <div className="font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
                      {content}
                    </div>
                    {
                      // Don't show the chevron in the last row item.
                      index < keys.length - 1 ? (
                        <USWDSIcon
                          className="usa-icon usa-icon--size-9 display-none tablet-lg:display-block text-base-lighter position-absolute right-0 top-0 margin-right-neg-5"
                          name="navigate_next"
                        />
                      ) : (
                        ""
                      )
                    }
                  </IconListContent>
                </IconListItem>
              </IconList>
            </Grid>
          );
        })}
      </ContentLayout>
      <ContentLayout
        title={
          <>
            <small className="display-block font-sans-lg margin-bottom-105">
              {t("milestones.roadmap_1")}
              <USWDSIcon
                className="usa-icon usa-icon--size-4 text-middle text-base-light"
                name="navigate_next"
              />
              {t("milestones.title_1")}
            </small>
            {t("milestones.name_1")}
          </>
        }
        data-testid="process-methodology-content"
        titleSize="m"
        bottomBorder="none"
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
          <Link href={ExternalRoutes.MILESTONE_GET_OPPORTUNITIES} passHref>
            <Button className="margin-bottom-4" type="button" size="big">
              <span className="margin-right-5">{t("milestones.cta_1")}</span>
              <USWDSIcon
                name="launch"
                className="usa-icon usa-icon--size-4 text-middle margin-left-neg-4"
              />
            </Button>
          </Link>
        </Grid>
      </ContentLayout>
      <ContentLayout
        title={
          <>
            <small className="display-block font-sans-lg margin-bottom-105">
              {t("milestones.roadmap_2")}
              <USWDSIcon
                className="usa-icon usa-icon--size-4 text-middle text-base-light"
                name="navigate_next"
              />
              {t("milestones.title_2")}
            </small>
            {t("milestones.name_2")}
          </>
        }
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
          <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6"></p>
          <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6"></p>
          <Link href={ExternalRoutes.MILESTONE_SEARCH_MVP} passHref>
            <Button className="margin-bottom-4" type="button" size="big">
              <span className="margin-right-5">{t("milestones.cta_2")}</span>
              <USWDSIcon
                name="launch"
                className="usa-icon usa-icon--size-4 text-middle margin-left-neg-4"
              />
            </Button>
          </Link>
        </Grid>
      </ContentLayout>
    </>
  );
};

export default ProcessMilestones;
