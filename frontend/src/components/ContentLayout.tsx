import { Grid, GridContainer } from "@trussworks/react-uswds";

type Props = {
  titleSize?: "l" | "m";
  title?: string;
  children: React.ReactNode;
  bottomBorder?: "light" | "dark" | "none";
  paddingTop?: boolean;
};

const ContentLayout = ({
  children,
  title,
  paddingTop = true,
  titleSize = "l",
  bottomBorder = "none",
}: Props) => {
  const formattedTitle = () => {
    if (!title) return "";
    const size =
      titleSize === "l"
        ? "tablet-lg:font-sans-xl desktop-lg:font-sans-2xl"
        : "tablet-lg:font-sans-l desktop-lg:font-sans-xl";
    return (
      <h2
        className={`margin-bottom-0 ${size} ${
          !paddingTop ? "margin-top-0" : ""
        }`}
      >
        {title}
      </h2>
    );
  };

  const bborder =
    bottomBorder === "light"
      ? "border-bottom-2px border-base-lighter"
      : bottomBorder === "dark"
      ? "border-bottom-2px border-base-light"
      : "";

  return (
    <GridContainer
      className={`padding-y-1 tablet:padding-y-3 desktop-lg:padding-y-6 ${
        paddingTop
          ? "padding-top-0 tablet:padding-top-0 desktop-lg:padding-top-0"
          : ""
      } ${bborder}`}
    >
      {formattedTitle()}
      <Grid row gap>
        {children}
      </Grid>
    </GridContainer>
  );
};

export default ContentLayout;
