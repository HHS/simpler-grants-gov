import BetaAlert from "../components/BetaAlert";
import { GridContainer } from "@trussworks/react-uswds";
import Link from "next/link";

// TODO: next-intl upgrade

const beta_strings = {
  alert_title:
    "Attention! Go to <LinkToGrants>www.grants.gov</LinkToGrants> to search and apply for grants.",
  alert:
    "Simpler.Grants.gov is a work in progress. Thank you for your patience as we build this new website.",
};

export default function NotFound() {
  return (
    <>
      <BetaAlert beta_strings={beta_strings} />
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
