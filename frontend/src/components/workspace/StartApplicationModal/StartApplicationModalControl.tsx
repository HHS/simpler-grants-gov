"use client";

import { useUser } from "src/services/auth/useUser";
import { clientFetchCompetition } from "src/services/fetch/fetchers/clientCompetitionsFetcher";
import { userOrganizationFetcher } from "src/services/fetch/fetchers/clientUserFetcher";
import { ApplicantTypes } from "src/types/competitionsResponseTypes";
import { Organization } from "src/types/UserTypes";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { ModalRef, ModalToggleButton } from "@trussworks/react-uswds";

import { LoginModal } from "src/components/LoginModal";
import { USWDSIcon } from "src/components/USWDSIcon";
import { StartApplicationModal } from "src/components/workspace/StartApplicationModal/StartApplicationModal";

type StartApplicationModalControlProps = {
  competitionId: string;
  opportunityTitle: string;
};

export const StartApplicationModalControl = ({
  competitionId,
  opportunityTitle,
}: StartApplicationModalControlProps) => {
  const modalRef = useRef<ModalRef>(null);
  const { user } = useUser();

  const t = useTranslations("OpportunityListing.startApplicationModal");
  const headerTranslation = useTranslations("HeaderLoginModal");
  const [loading, setLoading] = useState<boolean>();
  const [competitionApplicantTypes, setCompetitionApplicantTypes] = useState<
    ApplicantTypes[]
  >([]);
  const [userOrganizations, setUserOrganizations] = useState<Organization[]>(
    [],
  );

  const token = user?.token || null;

  // TODO: these fetches should likely only happen if the user opens the modal, or if user is logged in so as not to overfetch
  // We could either move them around or just gate off of the presence of the token

  // see what the accepted applicant types are for this particular competition
  useEffect(() => {
    setLoading(true);
    clientFetchCompetition(competitionId)
      .then((competition) => {
        if (competition.open_to_applicants) {
          return setCompetitionApplicantTypes(competition.open_to_applicants);
        }
        console.error("Unable to find competition applicant designation");
      })
      .catch((e) => {
        console.error("Error fetching competition", e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [competitionId]);

  // see what organizations the user belongs to, in order to handle organzation or
  // organization / individual competition types
  useEffect(() => {
    if (!token) {
      return;
    }
    setLoading(true);
    userOrganizationFetcher()
      .then((organizations) => {
        return setUserOrganizations(organizations);
      })
      .catch((e) => {
        console.error("Error fetching user organizations", e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  return (
    <div className="display-flex flex-align-start">
      <ModalToggleButton
        modalRef={modalRef}
        data-testid="open-start-application-modal-button"
        opener
        className="usa-button"
      >
        <USWDSIcon name="add" />
        {t("startApplicationButtonText")}
      </ModalToggleButton>
      {token ? (
        <StartApplicationModal
          token={token}
          opportunityTitle={opportunityTitle}
          modalRef={modalRef}
          applicantTypes={competitionApplicantTypes}
          organizations={userOrganizations}
          loading={loading || false}
          competitionId={competitionId}
        />
      ) : (
        <LoginModal
          helpText={headerTranslation("help")}
          buttonText={headerTranslation("button")}
          closeText={headerTranslation("close")}
          descriptionText={headerTranslation("description")}
          titleText={headerTranslation("title")}
          modalId="application-login-modal"
          modalRef={modalRef as React.RefObject<ModalRef>}
        />
      )}
    </div>
  );
};
