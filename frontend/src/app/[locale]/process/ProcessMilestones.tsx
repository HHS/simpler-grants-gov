import { ExternalRoutes } from "src/constants/routes";

import { useMessages, useTranslations } from "next-intl";
import Link from "next/link";
import React from "react";
import {
  Button,
  Grid,
  IconList,
  IconListContent,
  IconListIcon,
  IconListItem,
} from "@trussworks/react-uswds";

import ContentLayout from "src/components/ContentLayout";
import { USWDSIcon } from "src/components/USWDSIcon";

const ProcessMilestones = () => {
  const t = useTranslations("Process.milestones");

  const {
    Process: {
      milestones: { high_level_roadmap_items },
    },
  } = useMessages() as unknown as IntlMessages;

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
        title={t("tag")}
        data-test-id="process-high-level-content"
        titleSize="m"
        bottomBorder="dark"
        gridGap={6}
      >
        <IconList className="usa-icon-list--size-lg grid-row">
          {high_level_roadmap_items.map((_unusedItem, index) => {
            const title = t(`high_level_roadmap_items.${index}.title`);
            const content = t.rich(
              `high_level_roadmap_items.${index}.content`,
              {
                p: (chunks) => (
                  <p className="font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
                    {chunks}
                  </p>
                ),
                italics: (chunks) => <em>{chunks}</em>,
              },
            );

            return (
              <IconListItem
                key={title + "-key"}
                className="margin-top-4 tablet-lg:grid-col-4"
              >
                <IconListIcon>{getIcon(index)}</IconListIcon>
                <IconListContent className="tablet:padding-right-7">
                  <h3
                    aria-label={`Step ${index + 1}: ${title}`}
                    className="margin-bottom-2 usa-icon-list__title"
                  >
                    {title}
                  </h3>
                  <div className="font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
                    {content}
                  </div>
                  {
                    // Don't show the chevron in the last row item.
                    index < high_level_roadmap_items.length - 1 ? (
                      <USWDSIcon
                        className="usa-icon usa-icon--size-9 display-none tablet-lg:display-block text-base-lighter position-absolute right-0 top-0"
                        name="navigate_next"
                      />
                    ) : (
                      ""
                    )
                  }
                </IconListContent>
              </IconListItem>
            );
          })}
        </IconList>
      </ContentLayout>
      <ContentLayout
        title={
          <>
            <small className="display-block font-sans-lg margin-bottom-105">
              {t("roadmap_1")}
              <USWDSIcon
                className="usa-icon usa-icon--size-4 text-middle text-base-light"
                name="navigate_next"
              />
              {t("title_1")}
            </small>
            {t("name_1")}
          </>
        }
        data-testid="process-methodology-content"
        titleSize="m"
        bottomBorder="none"
      >
        <Grid tabletLg={{ col: 6 }}>
          <p className="usa-intro">{t("paragraph_1")}</p>
        </Grid>
        <Grid tabletLg={{ col: 6 }}>
          <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
            {t("sub_title_1")}
          </h3>
          <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
            {t("sub_paragraph_1")}
          </p>
          <h3 className="tablet-lg:font-sans-lg margin-top-4 margin-bottom-2">
            {t("sub_title_2")}
          </h3>
          <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
            {t("sub_paragraph_2")}
          </p>
          <Link href={ExternalRoutes.MILESTONE_GET_OPPORTUNITIES} passHref>
            <Button className="margin-bottom-4" type="button" size="big">
              <span className="margin-right-5">{t("cta_1")}</span>
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
              {t("roadmap_2")}
              <USWDSIcon
                className="usa-icon usa-icon--size-4 text-middle text-base-light"
                name="navigate_next"
              />
              {t("title_2")}
            </small>
            {t("name_2")}
          </>
        }
        data-testid="process-methodology-content"
        paddingTop={false}
        titleSize="m"
        bottomBorder="none"
      >
        <Grid tabletLg={{ col: 6 }}>
          <p className="usa-intro">{t("paragraph_2")}</p>
        </Grid>
        <Grid tabletLg={{ col: 6 }}>
          <h3 className="tablet-lg:font-sans-lg tablet-lg:margin-bottom-05">
            {t("sub_title_3")}
          </h3>
          <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6"></p>
          <p className="margin-top-0 font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6"></p>
          <Link href={ExternalRoutes.MILESTONE_SEARCH_MVP} passHref>
            <Button className="margin-bottom-4" type="button" size="big">
              <span className="margin-right-5">{t("cta_2")}</span>
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
