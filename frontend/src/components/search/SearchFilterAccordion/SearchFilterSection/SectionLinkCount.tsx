export default function SectionLinkCount({
  sectionCount,
}: {
  sectionCount: number;
}) {
  return (
    <span className="grid-col flex-auto">
      {!!sectionCount && (
        <span className="usa-tag usa-tag--big radius-pill margin-left-1">
          {sectionCount}
        </span>
      )}
    </span>
  );
}
