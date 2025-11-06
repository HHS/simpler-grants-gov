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
        <span className="margin-bottom-3 margin-top-0 font-sans-lg display-block">
          {organizationName}
        </span>
      )}
      {pageHeader}
    </h1>
  );
};
