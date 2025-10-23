import Breadcrumbs from "src/components/Breadcrumbs";

export const ManageUsersBreadcrumbs = ({
  organizationName,
  organizationId,
}: {
  organizationName?: string;
  organizationId: string;
}) => {
  return (
    <Breadcrumbs
      breadcrumbList={[
        { title: "home", path: "/" },
        {
          title: "Workspace",
          path: `/user/workspace`,
        },
        {
          title: organizationName ?? "Organization",
          path: `/organization/${organizationId}`,
        },
        {
          title: "Manage Users",
          path: `/organization/${organizationId}/manage-users`,
        },
      ]}
    />
  );
};
