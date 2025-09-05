import { Grid, GridContainer } from "@trussworks/react-uswds";

export default function DeveloperInfoLoading() {
  return (
    <div className="bg-base-white">
      <GridContainer className="padding-y-4 grid-container tablet-lg:padding-y-6">
        <Grid row gap>
          <Grid tabletLg={{ col: 4 }}>
            <div className="height-8 bg-base-lighter margin-bottom-2 animate-pulse" />
          </Grid>
          <Grid
            tabletLg={{ col: 8 }}
            className="margin-top-2 margin-bottom-0 tablet-lg:margin-0"
          >
            <div className="height-6 bg-base-lighter margin-bottom-2 animate-pulse" />

            <div className="height-4 bg-base-lighter margin-bottom-2 animate-pulse" />

            <div className="height-3 bg-base-lighter margin-bottom-1 animate-pulse" />
            <div className="height-3 bg-base-lighter margin-bottom-4 animate-pulse width-3/4" />

            <div className="height-10 width-40 bg-base-lighter margin-y-2 animate-pulse" />

            <div className="height-4 bg-base-lighter margin-bottom-2 margin-top-4 animate-pulse" />

            <div className="height-3 bg-base-lighter margin-bottom-1 animate-pulse" />
            <div className="height-3 bg-base-lighter margin-bottom-1 animate-pulse" />
            <div className="height-3 bg-base-lighter margin-bottom-4 animate-pulse width-2/3" />

            <Grid row className="padding-y-2" gap="md">
              <Grid col={6}>
                <div className="height-20 bg-base-lighter animate-pulse" />
              </Grid>
              <Grid col={6}>
                <div className="height-20 bg-base-lighter animate-pulse" />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </GridContainer>
    </div>
  );
}
