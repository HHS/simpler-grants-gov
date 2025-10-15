"use client";

import { useClientFetch } from "src/hooks/useClientFetch";
import { useUser } from "src/services/auth/useUser";
import {
  ApplicantTypes,
  Competition,
} from "src/types/competitionsResponseTypes";
import { UserOrganization } from "src/types/userTypes";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { ModalRef, ModalToggleButton } from "@trussworks/react-uswds";

import { LoginModal } from "src/components/LoginModal";
import Spinner from "src/components/Spinner";
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

  const { clientFetch: fetchUserOrganizations } = useClientFetch<
    UserOrganization[]
  >("Error fetching user organizations");
  const { clientFetch: fetchCompetition } = useClientFetch<Competition>(
    "Error fetching competition",
  );
  const t = useTranslations("OpportunityListing.startApplicationModal");
  const headerTranslation = useTranslations("HeaderLoginModal");
  const [organizationsLoading, setOrganizationsLoading] = useState<boolean>();
  const [competitionsLoading, setCompetitionLoading] = useState<boolean>();
  const [competitionApplicantTypes, setCompetitionApplicantTypes] = useState<
    ApplicantTypes[]
  >([]);
  const [userOrganizations, setUserOrganizations] = useState<
    UserOrganization[]
  >([]);

  const token = user?.token || null;

  // TODO: these fetches should likely only happen if the user opens the modal, or if user is logged in so as not to overfetch
  // We could either move them around or just gate off of the presence of the token

  // see what the accepted applicant types are for this particular competition
  useEffect(() => {
    setCompetitionLoading(true);
    fetchCompetition(`/api/competitions/${competitionId}`)
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
        setCompetitionLoading(false);
      });
  }, [competitionId, fetchCompetition]);

  // see what organizations the user belongs to, in order to handle organzation or
  // organization / individual competition types
  useEffect(() => {
    if (!token) {
      return;
    }
    setOrganizationsLoading(true);
    fetchUserOrganizations("/api/user/organizations", {
      cache: "no-store",
    })
      .then((organizations) => {
        return setUserOrganizations(organizations);
      })
      .catch((e) => {
        console.error("Error fetching user organizations", e);
      })
      .finally(() => {
        setOrganizationsLoading(false);
      });
  }, [fetchUserOrganizations, token]);

  return (
    <div className="display-flex flex-align-start">
      <ModalToggleButton
        modalRef={modalRef}
        data-testid="open-start-application-modal-button"
        opener
        disabled={organizationsLoading || competitionsLoading}
        className="usa-button"
      >
        {organizationsLoading || competitionsLoading ? (
          <>
            <Spinner className="height-105 width-105 button-icon-large" />{" "}
            {"Loading"}
          </>
        ) : (
          <>
            <USWDSIcon name="add" /> {t("startApplicationButtonText")}
          </>
        )}
      </ModalToggleButton>
      {token ? (
        <StartApplicationModal
          token={token}
          opportunityTitle={opportunityTitle}
          modalRef={modalRef}
          applicantTypes={competitionApplicantTypes}
          organizations={userOrganizations}
          loading={organizationsLoading || competitionsLoading || false}
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
