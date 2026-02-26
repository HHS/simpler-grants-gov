"use client";

import { useClientFetch } from "src/hooks/useClientFetch";
import { Organization } from "src/types/applicationResponseTypes";
import { BaseOpportunity } from "src/types/opportunity/opportunityResponseTypes";
import { UserOrganization } from "src/types/userTypes";

import { useEffect, useMemo, useRef, useState } from "react";
import { ModalRef } from "@trussworks/react-uswds";

import { ShareOpportunityToOrganizationsModal } from "src/components/opportunities/ShareOpportunityToOrganizationsModal";
import SearchResultsListItem from "src/components/search/SearchResultsListItem";

interface SavedOpportunitiesControllerProps {
  opportunities: BaseOpportunity[];
}

export function SavedOpportunitiesController({
  opportunities,
}: SavedOpportunitiesControllerProps) {
  const modalRef = useRef<ModalRef>(null);

  const [selectedOpportunity, setSelectedOpportunity] =
    useState<BaseOpportunity | null>(null);

  const { clientFetch: fetchUserOrganizations } = useClientFetch<
    UserOrganization[]
  >("Error fetching user organizations");

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoadingOrganizations, setIsLoadingOrganizations] =
    useState<boolean>(false);
  const [hasOrganizationsError, setHasOrganizationsError] =
    useState<boolean>(false);

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

  const savedToOrganizationIds = useMemo<Set<string>>(() => {
    const savedToOrganizations =
      selectedOpportunity?.saved_to_organizations ?? [];
    return new Set(savedToOrganizations.map((entry) => entry.organization_id));
  }, [selectedOpportunity]);

  const handleShareClick = (opportunity: BaseOpportunity) => {
    setSelectedOpportunity(opportunity);
    modalRef.current?.toggleModal();
  };

  return (
    <>
      <ul className="usa-list--unstyled">
        {opportunities.map((opportunity, index) => (
          <li key={opportunity.opportunity_id}>
            <SearchResultsListItem
              opportunity={opportunity}
              saved={true}
              index={index}
              onShareClick={() => handleShareClick(opportunity)}
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
        opportunityTitle={selectedOpportunity?.opportunity_title ?? null}
      />
    </>
  );
}
