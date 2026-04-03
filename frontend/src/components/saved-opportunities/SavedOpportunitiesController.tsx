"use client";

import { useClientFetch } from "src/hooks/useClientFetch";
import { Organization } from "src/types/applicationResponseTypes";
import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";
import { UserOrganization } from "src/types/userTypes";

import { useEffect, useMemo, useRef, useState } from "react";
import { ModalRef } from "@trussworks/react-uswds";

import SearchResultsListItem from "src/components/search/SearchResultsListItem";
import { ShareOpportunityToOrganizationsModal } from "src/components/shareOpportunityToOrganizations/ShareOpportunityToOrganizationsModal";
import { buildSavedOpportunityTags } from "./buildSavedOpportunityTags";

interface SavedOpportunitiesControllerProps {
  opportunities: BaseOpportunity[];
  individuallySavedOpportunityIds?: Set<string>;
}

export function SavedOpportunitiesController({
  opportunities,
  individuallySavedOpportunityIds = new Set<string>(),
}: SavedOpportunitiesControllerProps) {
  const modalRef = useRef<ModalRef>(null);
  const lastShareButtonRef = useRef<HTMLButtonElement | null>(null);

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

  const hasOrganizations = organizations.length > 0;

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

  const userOrganizationIds = useMemo(
    () =>
      new Set(
        organizations.map((organization) => organization.organization_id),
      ),
    [organizations],
  );

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

  const handleShareClick = (
    opportunity: BaseOpportunity,
    buttonElement: HTMLButtonElement,
  ) => {
    lastShareButtonRef.current = buttonElement;
    setSelectedOpportunityId(opportunity.opportunity_id);
    setShouldOpenModal(true);
  };

  const handleSavedOrganizationsChange = (organizationIds: Set<string>) => {
    if (!selectedOpportunityId) {
      return;
    }

    const nextSavedToOrganizations = Array.from(organizationIds)
      .map((organizationId) =>
        organizations.find(
          (organization) => organization.organization_id === organizationId,
        ),
      )
      .filter(
        (organization): organization is Organization =>
          organization !== undefined,
      )
      .map((organization) => ({
        organization_id: organization.organization_id,
        organization_name:
          organization.sam_gov_entity?.legal_business_name ?? null,
      }));

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
        {opportunitiesState.map((opportunity, index) => {
          const isSavedByUser = individuallySavedOpportunityIds.has(
            opportunity.opportunity_id,
          );

          const savedOpportunityTags = buildSavedOpportunityTags(
            opportunity,
            userOrganizationIds,
            isSavedByUser,
          );

          const hasVisibleSavedOpportunityTags =
            savedOpportunityTags.length > 0;

          return (
            <li key={opportunity.opportunity_id}>
              <SearchResultsListItem
                opportunity={opportunity}
                saved={hasVisibleSavedOpportunityTags}
                showShareButton={hasOrganizations}
                index={index}
                savedOpportunityTags={savedOpportunityTags}
                onShareClick={(buttonElement: HTMLButtonElement) =>
                  handleShareClick(opportunity, buttonElement)
                }
              />
            </li>
          );
        })}
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
