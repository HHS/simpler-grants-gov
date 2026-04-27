import { AuthorizedData } from "src/types/authTypes";

// import { Suspense } from "react";

import { AuthorizationGate } from "src/components/user/AuthorizationGate";
import { UnauthorizedMessage } from "src/components/user/UnauthorizedMessage";

const AuthOutput = ({
  authorizedData,
}: {
  authorizedData?: AuthorizedData;
}) => {
  return (
    <>
      {authorizedData &&
      Object.keys(authorizedData?.fetchedResources).length ? (
        <div>
          <ul>
            {Object.entries(authorizedData?.fetchedResources).map(
              ([key, value]) => (
                <li key={key}>
                  {key}:{value.statusCode}
                </li>
              ),
            )}
          </ul>
        </div>
      ) : null}
      {authorizedData?.confirmedPrivileges.length ? (
        <div>
          <ul>
            {authorizedData?.confirmedPrivileges.map((privilege) => (
              <li key={privilege.privilege}>
                {privilege.privilege}:{privilege.authorized.toString()}{" "}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
};

export const AuthGateTester = () => {
  return (
    <AuthorizationGate
      resourcePromises={{
        invitedUsersList: Promise.resolve(),
        activeUsersList: Promise.resolve(),
        organizationRolesList: Promise.resolve(),
      }}
      requiredPrivileges={[
        {
          resourceId: "1",
          resourceType: "organization",
          privilege: "manage_org_members",
        },
      ]}
      onUnauthorized={() => <UnauthorizedMessage />}
    >
      <AuthOutput />
    </AuthorizationGate>
  );
};
