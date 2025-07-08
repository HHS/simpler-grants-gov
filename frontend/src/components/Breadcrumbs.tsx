import {
  Breadcrumb,
  BreadcrumbBar,
  BreadcrumbLink,
  GridContainer,
} from "@trussworks/react-uswds";

import { ReturnToGrantsNotification } from "./ReturnToGrantsNotification";

export type Breadcrumb = {
  title: string;
  path: string;
};

const microdata = {
  ol: {
    itemScope: true,
    itemType: "https://schema.org/BreadcrumbList",
  },
  li: {
    itemScope: true,
    itemProp: "itemListElement",
    itemType: "https://schema.org/ListItem",
  },
  a: {
    itemScope: true,
    itemProp: "item",
    itemType: "https://schema.org/WebPage",
  },
};

const Breadcrumbs = ({ breadcrumbList }: { breadcrumbList: Breadcrumb[] }) => {
  const breadcrumArray = breadcrumbList.map((breadcrumbInfo, i) => {
    return (
      <Breadcrumb
        key={breadcrumbInfo.title + "-crumb"}
        current={i + 1 === breadcrumbList.length}
        {...microdata.li}
      >
        {i + 1 !== breadcrumbList.length ? (
          <BreadcrumbLink
            href={breadcrumbInfo.path}
            itemID={breadcrumbInfo.path}
            {...microdata.a}
          >
            {}
            <span itemProp="name">{breadcrumbInfo.title}</span>
          </BreadcrumbLink>
        ) : (
          <span itemProp="name">{breadcrumbInfo.title}</span>
        )}
        <meta itemProp="position" content={(i + 1).toString()} />
      </Breadcrumb>
    );
  });

  return (
    <GridContainer
      className="display-flex flex-column tablet:flex-row"
      data-testid="breadcrumb"
    >
      <BreadcrumbBar className="flex-1" listProps={{ ...microdata.ol }}>
        {breadcrumArray}
      </BreadcrumbBar>
      <ReturnToGrantsNotification />
    </GridContainer>
  );
};

export default Breadcrumbs;
