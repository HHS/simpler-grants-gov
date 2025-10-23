export const PageHeader = ({
  organizationName,
  pageHeader,
}: {
  organizationName?: string;
  pageHeader: string;
}) => {
  return (
    <h1 className="margin-bottom-05 font-sans-2xl">
      {organizationName && (
        <span className="margin-top-0 font-sans-md display-block">
          {organizationName}
        </span>
      )}
      {pageHeader}
    </h1>
  );
};