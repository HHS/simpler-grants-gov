"use client";

import { useClientFetch } from "src/hooks/useClientFetch";
import { Organization } from "src/types/applicationResponseTypes";
import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";
import { UserOrganization } from "src/types/userTypes";

import { useEffect, useMemo, useRef, useState } from "react";
import { ModalRef } from "@trussworks/react-uswds";

import SearchResultsListItem from "src/components/search/SearchResultsListItem";
import { ShareOpportunityToOrganizationsModal } from "src/components/shareOpportunityToOrganizations/ShareOpportunityToOrganizationsModal";

interface SavedOpportunitiesControllerProps {
  opportunities: BaseOpportunity[];
}

export function SavedOpportunitiesController({
  opportunities,
}: SavedOpportunitiesControllerProps) {
  const modalRef = useRef<ModalRef>(null);
  // const lastShareButtonRef = useRef<HTMLButtonElement | null>(null);

  const [opportunitiesState, setOpportunitiesState] =
    useState<BaseOpportunity[]>(opportunities);

  const [selectedOpportunityId, setSelectedOpportunityId] = useState<
    string | null
  >(null);

  const [shouldOpenModal, setShouldOpenModal] = useState<boolean>(false);

  const { clientFetch: fetchUserOrganizations } = useClientFetch<
    UserOrganization[]
  >("Error fetching user organizations");

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoadingOrganizations, setIsLoadingOrganizations] =
    useState<boolean>(false);
  const [hasOrganizationsError, setHasOrganizationsError] =
    useState<boolean>(false);

  useEffect(() => {
    setOpportunitiesState(opportunities);
  }, [opportunities]);

  useEffect(() => {
    setIsLoadingOrganizations(true);
    setHasOrganizationsError(false);

    fetchUserOrganizations("/api/user/organizations", { cache: "no-store" })
      .then((fetchedOrganizations) => {
        setOrganizations(fetchedOrganizations);
      })
      .catch((error: unknown) => {
        console.error("Error fetching user organizations", error);
        setHasOrganizationsError(true);
      })
      .finally(() => {
        setIsLoadingOrganizations(false);
      });
  }, [fetchUserOrganizations]);

  const selectedOpportunity = useMemo(() => {
    if (!selectedOpportunityId) {
      return null;
    }

    return (
      opportunitiesState.find(
        (opportunity) => opportunity.opportunity_id === selectedOpportunityId,
      ) ?? null
    );
  }, [opportunitiesState, selectedOpportunityId]);

  useEffect(() => {
    if (shouldOpenModal && selectedOpportunityId) {
      modalRef.current?.toggleModal();
      setShouldOpenModal(false);
    }
  }, [selectedOpportunityId, shouldOpenModal]);

  const savedToOrganizationIds = useMemo<Set<string>>(() => {
    const savedToOrganizations =
      selectedOpportunity?.saved_to_organizations ?? [];

    return new Set(
      savedToOrganizations.map(
        (savedOrganization) => savedOrganization.organization_id,
      ),
    );
  }, [selectedOpportunity]);

  // const handleShareClick = (
  //   opportunity: BaseOpportunity,
  //   buttonElement: HTMLButtonElement,
  // ) => {
  //   lastShareButtonRef.current = buttonElement;
  //   setSelectedOpportunityId(opportunity.opportunity_id);
  //   setShouldOpenModal(true);
  // };

  const handleSavedOrganizationsChange = (organizationIds: Set<string>) => {
    if (!selectedOpportunityId) {
      return;
    }

    const nextSavedToOrganizations = Array.from(organizationIds).map(
      (organizationId) => ({
        organization_id: organizationId,
      }),
    );

    setOpportunitiesState((previousOpportunities) =>
      previousOpportunities.map((opportunity) =>
        opportunity.opportunity_id === selectedOpportunityId
          ? {
              ...opportunity,
              saved_to_organizations: nextSavedToOrganizations,
            }
          : opportunity,
      ),
    );
  };

  return (
    <>
      <ul className="usa-list--unstyled">
        {opportunitiesState.map((opportunity, index) => (
          <li key={opportunity.opportunity_id}>
            <SearchResultsListItem
              opportunity={opportunity}
              saved={true}
              index={index}
              // onShareClick={(buttonElement: HTMLButtonElement) =>
              //   handleShareClick(opportunity, buttonElement)
              // }
            />
          </li>
        ))}
      </ul>

      <ShareOpportunityToOrganizationsModal
        modalRef={modalRef}
        organizations={organizations}
        savedToOrganizationIds={savedToOrganizationIds}
        isLoadingOrganizations={isLoadingOrganizations}
        hasOrganizationsError={hasOrganizationsError}
        selectedOpportunity={selectedOpportunity}
        onSavedOrganizationsChange={handleSavedOrganizationsChange}
      />
    </>
  );
}
