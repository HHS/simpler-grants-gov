export function CheckboxFilter({
  wrapForScroll = false,
}: {
  wrapForScroll?: boolean;
}) {
  return wrapForScroll ? (
    <div
      className="maxh-mobile-lg minh-mobile overflow-scroll"
      data-testid={`${title}-accordion-scroll`}
    >
      <AccordionContent
        filterOptions={filterOptions}
        title={title}
        queryParamKey={queryParamKey}
        query={query}
        facetCounts={facetCounts}
        defaultEmptySelection={defaultEmptySelection}
        includeAnyOption={includeAnyOption}
      />
    </div>
  ) : (
    <AccordionContent
      filterOptions={filterOptions}
      title={title}
      queryParamKey={queryParamKey}
      query={query}
      facetCounts={facetCounts}
      defaultEmptySelection={defaultEmptySelection}
      includeAnyOption={includeAnyOption}
    />
  );
}
