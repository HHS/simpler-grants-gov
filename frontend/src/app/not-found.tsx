import BetaAlert from "../components/BetaAlert";
import { GridContainer } from "@trussworks/react-uswds";
import Link from "next/link";

// TODO: next-intl upgrade

export default function NotFound() {
  return (
    <>
      <BetaAlert />
      <GridContainer className="padding-y-1 tablet:padding-y-3 desktop-lg:padding-y-15">
        <h1 className="nj-h1">{"page_not_found.title"}</h1>
        <p className="margin-bottom-2">{"page_not_found.message_content_1"}</p>
        <Link className="usa-button" href="/" key="returnToHome">
          {"page_not_found.visit_homepage_button"}
        </Link>
      </GridContainer>
    </>
  );
}
