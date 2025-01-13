import {
  Breadcrumb,
  BreadcrumbBar,
  BreadcrumbLink,
  GridContainer,
} from "@trussworks/react-uswds";

export type Breadcrumb = {
  title: string;
  path: string;
};

export type BreadcrumbList = Breadcrumb[];

type Props = {
  breadcrumbList: BreadcrumbList;
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

const Breadcrumbs = ({ breadcrumbList }: Props) => {
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
      className="padding-top-1 tablet:padding-top-3 desktop-lg:padding-top-4"
      data-testid="breadcrumb"
    >
      <BreadcrumbBar listProps={{ ...microdata.ol }}>
        {breadcrumArray}
      </BreadcrumbBar>
    </GridContainer>
  );
};

export default Breadcrumbs;
