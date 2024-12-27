import { ExternalRoutes } from "src/constants/routes";

import { useMessages, useTranslations } from "next-intl";
import Link from "next/link";
import React from "react";
import {
  Grid,
  GridContainer,
  IconList,
  IconListContent,
  IconListIcon,
  IconListItem,
} from "@trussworks/react-uswds";

import { USWDSIcon } from "src/components/USWDSIcon";

const ProcessNext = () => {
  const t = useTranslations("Process.next");
  const messages = useMessages() as unknown as IntlMessages;

  const keys = Object.keys(messages.Process.next.list);

  return (
    <GridContainer className="grid-container padding-y-1 tablet:padding-y-3 desktop-lg:padding-y-6 padding-top-0 tablet:padding-top-0 desktop-lg:padding-top-0">
      <h2 className="margin-bottom-0 tablet-lg:font-sans-l desktop-lg:font-sans-xl margin-top-0">
        {t("title")}
      </h2>
      <Grid row gap>
        <Grid className="tablet:grid-col">
          <IconList className="usa-icon-list--size-md grid-row">
            {keys.map((key) => {
              const title = t(`list.${key}.title`);
              const content = t.rich(`list.${key}.content`, {
                p: (chunks) => (
                  <p className="font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
                    {chunks}
                  </p>
                ),
                linkGithub3045: (chunks) => (
                  <Link
                    target="_blank"
                    className="usa-link--external"
                    href={`${ExternalRoutes.GITHUB_REPO}/issues/3045`}
                  >
                    {chunks}
                  </Link>
                ),
                linkGithub2875: (chunks) => (
                  <Link
                    target="_blank"
                    className="usa-link--external"
                    href={`${ExternalRoutes.GITHUB_REPO}/issues/2875`}
                  >
                    {chunks}
                  </Link>
                ),
                linkGithub2640: (chunks) => (
                  <Link
                    target="_blank"
                    className="usa-link--external"
                    href={`${ExternalRoutes.GITHUB_REPO}/issues/2640`}
                  >
                    {chunks}
                  </Link>
                ),
                linkGithub3348: (chunks) => (
                  <Link
                    target="_blank"
                    className="usa-link--external"
                    href={`${ExternalRoutes.GITHUB_REPO}/issues/3348`}
                  >
                    {chunks}
                  </Link>
                ),
              });
              return (
                <IconListItem
                  key={title + "-key"}
                  className="margin-top-4 tablet-lg:grid-col-6"
                >
                  <IconListIcon>
                    <USWDSIcon
                      className="usa-icon text-base"
                      name="check_circle_outline"
                    />
                  </IconListIcon>
                  <IconListContent className="tablet:padding-right-7">
                    <h3 className="margin-bottom-2 usa-icon-list__title">
                      {title}
                    </h3>
                    <div className="font-sans-md line-height-sans-4 desktop-lg:line-height-sans-6">
                      {content}
                    </div>
                  </IconListContent>
                </IconListItem>
              );
            })}
          </IconList>
          <h3>
            <Link
              target="_blank"
              className="usa-link--external"
              href={`${ExternalRoutes.GITHUB_REPO}/issues?q=is%3Aissue%20type%3ADeliverable%20`}
            >
              {t("link")}
            </Link>
          </h3>
        </Grid>
      </Grid>
    </GridContainer>
  );
};

export default ProcessNext;
