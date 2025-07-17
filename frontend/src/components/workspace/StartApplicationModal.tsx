"use client";

import { useClientFetch } from "src/hooks/useClientFetch";
import { useUser } from "src/services/auth/useUser";
import { startApplication } from "src/services/fetch/fetchers/clientApplicationFetcher";
import { clientFetchCompetition } from "src/services/fetch/fetchers/clientCompetitionsFetcher";
import { userOrganizationFetcher } from "src/services/fetch/fetchers/clientUserFetcher";
import { ApplicantTypes } from "src/types/competitionsResponseTypes";
import { Organization } from "src/types/UserTypes";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ModalRef, ModalToggleButton } from "@trussworks/react-uswds";

import { LoginModal } from "src/components/LoginModal";
import { SimplerModal } from "src/components/SimplerModal";
import { USWDSIcon } from "src/components/USWDSIcon";
import { CompetitionStartForm } from "src/components/workspace/CompetitionStartFormIndividiual";

type StartApplicationModalProps = {
  competitionId: string;
  opportunityTitle: string;
};

const getTitleTextKey = (
  token: string | null,
  organizations: Organization[],
  applicantTypes: ApplicantTypes[],
) => {
  if (!token) {
    return "login";
  }
  if (!organizations.length && !applicantTypes.includes("individual")) {
    return "ineligibleTitle";
  }
  return "title";
};

const StartApplicationModal = ({
  competitionId,
  opportunityTitle,
}: StartApplicationModalProps) => {
  const modalRef = useRef<ModalRef>(null);
  const { user } = useUser();
  const router = useRouter();
  const { clientFetch } = useClientFetch();

  const t = useTranslations("OpportunityListing.startApplicationModal");
  const headerTranslation = useTranslations("HeaderLoginModal");

  const [validationError, setValidationError] = useState<string>();
  const [savedApplicationName, setSavedApplicationName] = useState<string>();
  const [selectedOrganization, setSelectedOrganization] = useState<string>();
  const [error, setError] = useState<string>();
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

  const handleSubmit = useCallback(() => {
    if (!token) {
      return;
    }
    if (validationError) {
      setValidationError(undefined);
    }
    if (!savedApplicationName) {
      setValidationError(t("fields.name.validationError"));
      return;
    }
    setLoading(true);
    startApplication(savedApplicationName, competitionId, token)
      .then((data) => {
        const { applicationId } = data;
        router.push(`/workspace/applications/application/${applicationId}`);
      })
      .catch((error) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (error.cause === "401") {
          setError(t("loggedOut"));
        } else {
          setError(t("error"));
        }
        console.error(error);
      });
  }, [competitionId, router, savedApplicationName, t, token, validationError]);

  const onClose = useCallback(() => {
    setError("");
    setLoading(false);
    setValidationError(undefined);
    setSavedApplicationName("");
  }, []);

  const onNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSavedApplicationName(e.target.value);
  }, []);

  const onOrganizationChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedOrganization(e.target.value);
    },
    [],
  );
  return (
    <div className="display-flex flex-align-start">
      <ModalToggleButton
        modalRef={modalRef}
        data-testid={`open-start-application-modal-button`}
        opener
        className="usa-button"
      >
        <USWDSIcon name="add" />
        {t("startApplicationButtonText")}
      </ModalToggleButton>
      {token ? (
        <SimplerModal
          modalRef={modalRef}
          className="text-wrap maxw-tablet-lg font-sans-xs"
          modalId={"start-application"}
          titleText={t(
            getTitleTextKey(
              token,
              userOrganizations,
              competitionApplicantTypes,
            ),
          )}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          onClose={onClose}
        >
          <CompetitionStartForm
            opportunityTitle={opportunityTitle}
            loading={loading}
            error={error}
            onClose={onClose}
            onSubmit={handleSubmit}
            onNameChange={onNameChange}
            onOrganizationChange={onOrganizationChange}
            modalRef={modalRef}
            validationError={validationError}
            selectedOrganization={selectedOrganization}
            applicantTypes={competitionApplicantTypes}
            organizations={userOrganizations}
          />
        </SimplerModal>
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

export default StartApplicationModal;
