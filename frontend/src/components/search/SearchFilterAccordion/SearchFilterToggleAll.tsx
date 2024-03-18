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
        onClick={onSelectAll}
      >
        Select All
      </button>
    </div>
    <div className="grid-col-fill text-right">
      <button
        className="usa-button usa-button--unstyled font-sans-xs"
        onClick={onClearAll}
      >
        Clear All
      </button>
    </div>
  </div>
);

export default SearchFilterToggleAll;
