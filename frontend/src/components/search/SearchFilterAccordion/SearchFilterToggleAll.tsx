"use client";

interface SearchFilterToggleAllProps {
  onSelectAll?: () => void;
  onClearAll?: () => void;
}

const SearchFilterToggleAll: React.FC<SearchFilterToggleAllProps> = ({
  onSelectAll,
  onClearAll,
}) => (
  <div className="grid-row">
    <div className="grid-col-fill">
      <button
        className="usa-button usa-button--unstyled font-sans-xs"
        onClick={(event) => {
          // form submission is done in useSearchFilter, so
          // prevent the onClick from submitting here.
          event.preventDefault();
          onSelectAll?.();
        }}
      >
        Select All
      </button>
    </div>
    <div className="grid-col-fill text-right">
      <button
        className="usa-button usa-button--unstyled font-sans-xs"
        onClick={(event) => {
          event.preventDefault();
          onClearAll?.();
        }}
      >
        Clear All
      </button>
    </div>
  </div>
);

export default SearchFilterToggleAll;
