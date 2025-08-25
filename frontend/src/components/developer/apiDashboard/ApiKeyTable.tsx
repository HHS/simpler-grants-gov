"use client";

import { toShortMonthDate } from "src/utils/dateUtil";

import { Button } from "@trussworks/react-uswds";

import {
  TableCellData,
  TableWithResponsiveHeader,
} from "src/components/TableWithResponsiveHeader";
import { USWDSIcon } from "src/components/USWDSIcon";
import { ApiKey } from "src/types/apiTypes";
import ApiKeyModal from "./ApiKeyModal";

interface ApiKeyTableProps {
  apiKeys: ApiKey[];
  onApiKeyRenamed: () => void;
}

const ApiKeyNameDisplay = ({ 
  apiKey, 
  onApiKeyRenamed 
}: { 
  apiKey: ApiKey; 
  onApiKeyRenamed: () => void;
}) => {
  return (
    <div>
      <div className="font-sans-md text-bold margin-bottom-05">
        {apiKey.key_name}
      </div>
      <div className="font-sans-xs text-base-dark">
        {apiKey.key_id}
      </div>
    </div>
  );
};

const DateDisplay = ({ apiKey }: { apiKey: ApiKey }) => {
  return (
    <div>
      <div className="margin-bottom-05">
        <span className="text-bold">Created:</span>{" "}
        {toShortMonthDate(apiKey.created_at)}
      </div>
      <div className="font-sans-xs">
        <span className="text-bold">Last used:</span>{" "}
        {apiKey.last_used ? toShortMonthDate(apiKey.last_used) : "Never"}
      </div>
    </div>
  );
};

const EditActionDisplay = ({ 
  apiKey, 
  onApiKeyRenamed 
}: { 
  apiKey: ApiKey; 
  onApiKeyRenamed: () => void;
}) => {
  return (
    <div className="display-flex flex-align-center">
      <ApiKeyModal 
        mode="edit"
        apiKey={apiKey}
        onApiKeyUpdated={onApiKeyRenamed}
      />
    </div>
  );
};

const DeleteActionDisplay = ({ apiKey }: { apiKey: ApiKey }) => {
  return (
    <div className="display-flex flex-align-center">
      <Button
        type="button"
        className="padding-1 hover:bg-base-lightest"
        unstyled
        disabled
        title="Delete functionality coming soon"
      >
        <USWDSIcon
          className="usa-icon margin-right-05"
          name="delete"
        />
        Delete Key
      </Button>
    </div>
  );
};

const toApiKeyTableRow = (
  apiKey: ApiKey,
  onApiKeyRenamed: () => void
): TableCellData[] => {
  return [
    {
      cellData: (
        <ApiKeyNameDisplay 
          apiKey={apiKey} 
          onApiKeyRenamed={onApiKeyRenamed}
        />
      ),
      stackOrder: 0,
    },
    {
      cellData: <DateDisplay apiKey={apiKey} />,
      stackOrder: 1,
    },
    {
      cellData: (
        <EditActionDisplay 
          apiKey={apiKey} 
          onApiKeyRenamed={onApiKeyRenamed}
        />
      ),
      stackOrder: 2,
    },
    {
      cellData: <DeleteActionDisplay apiKey={apiKey} />,
      stackOrder: 3,
    },
  ];
};

export default function ApiKeyTable({ apiKeys, onApiKeyRenamed }: ApiKeyTableProps) {
  if (!apiKeys.length) {
    return (
      <div className="usa-alert usa-alert--info">
        <div className="usa-alert__body">
          <p className="usa-alert__text">
            You don't have any API keys yet. Create your first API key to get started.
          </p>
        </div>
      </div>
    );
  }

  const headerContent: TableCellData[] = [
    { cellData: "API Key" },
    { cellData: "Dates" },
    { cellData: "Edit Name" },
    { cellData: "Delete Key" },
  ];

  const tableRowData = apiKeys.map((apiKey) =>
    toApiKeyTableRow(apiKey, onApiKeyRenamed)
  );

  return (
    <TableWithResponsiveHeader
      headerContent={headerContent}
      tableRowData={tableRowData}
    />
  );
}
