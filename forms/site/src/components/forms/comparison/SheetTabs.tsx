import {
  $differenceCount,
  $sheetTab,
  setSheetTab,
  type SheetTab,
} from "@/stores/fieldComparison";
import { useStore } from "@nanostores/react";

const TABS: { tab: SheetTab; label: string }[] = [
  { tab: "comparison", label: "Comparison" },
  { tab: "differences", label: "Differences" },
];

export default function SheetTabs() {
  const current = useStore($sheetTab);
  const count = useStore($differenceCount);
  return (
    <div className="tab-bar sheet-tabs" role="tablist">
      {TABS.map(({ tab, label }) => (
        <button
          key={tab}
          type="button"
          role="tab"
          id={`sheet-tab-${tab}`}
          aria-selected={current === tab}
          aria-controls="sheet-panel"
          className={`tab-bar__tab${current === tab ? " tab-bar__tab--active" : ""}`}
          onClick={() => setSheetTab(tab)}
        >
          {tab === "differences" ? `${label} (${count})` : label}
        </button>
      ))}
    </div>
  );
}
