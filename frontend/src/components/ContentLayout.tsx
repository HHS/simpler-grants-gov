import { Grid, GridContainer } from "@trussworks/react-uswds";

type Props = {
    titleSize?: "l" | "m";
    title?: string;
    children: React.ReactNode
    bottomBorder?: boolean
}

const ContentLayout = ({children, title, titleSize = 'l', bottomBorder = true}: Props ) => {

  const formattedTitle = () => {
    if (!title) return ""
    const size = titleSize === 'l' ? "tablet-lg:font-sans-xl desktop-lg:font-sans-2xl" : "tablet-lg:font-sans-l desktop-lg:font-sans-xl"
    return (
        <h2 className={`margin-bottom-0 ${size}`}>
            {title}
        </h2> 
    )
  } 

  return (
    <GridContainer className={`padding-y-1 tablet:padding-y-3 desktop-lg:padding-y-6 ${bottomBorder && "border-bottom-2px border-base-lightest"}`}>
      {formattedTitle()}
      <Grid row gap>
        {children}
      </Grid>
    </GridContainer>
  );
};

export default ContentLayout;