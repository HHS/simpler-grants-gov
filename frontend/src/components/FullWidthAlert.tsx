import {
  Grid,
  GridContainer,
  Alert as USWDSAlert,
} from "@trussworks/react-uswds";

type Props = {
  type: "success" | "warning" | "error" | "info";
  children: React.ReactNode;
};

const getBGColor = (type: Props["type"]) => {
  switch (type) {
    case "success":
      return "bg-green-cool-5";
    case "warning":
      return "bg-yellow-5";
    case "error":
      return "bg-red-warm-10";
    case "info":
      return "bg-cyan-5";
  }
};

const FullWidthAlert = ({ type, children }: Props) => {
  return (
    <div className={`${getBGColor(type)}`}>
      <GridContainer>
        <Grid>
          <USWDSAlert
            className="border-left-0 bg-transparent padding-left-0 margin-x-neg-2"
            type={type}
            headingLevel="h4"
            slim
          >
            {children}
          </USWDSAlert>
        </Grid>
      </GridContainer>
    </div>
  );
};

export default FullWidthAlert;
