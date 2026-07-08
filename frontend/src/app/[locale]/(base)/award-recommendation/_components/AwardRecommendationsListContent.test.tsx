import { fireEvent, render, screen } from "@testing-library/react";
import AwardRecommendationsListContent from "src/app/[locale]/(base)/award-recommendation/_components/AwardRecommendationsListContent";
import { RelevantAgencyRecord } from "src/types/search/searchFilterTypes";

type HeaderProps = {
  awardRecommendationsCount: number;
  agencies: RelevantAgencyRecord[];
  currentAgencyId: string;
};

type TableProps = {
  currentAgencyId: string;
  onTotalRecordsChange: (totalRecords: number) => void;
};

const mockHeader = jest.fn<void, [HeaderProps]>();
const mockTable = jest.fn<void, [TableProps]>();

jest.mock(
  "src/app/[locale]/(base)/award-recommendation/_components/AwardRecommendationsListHeader",
  () => ({
    __esModule: true,
    default: (props: {
      awardRecommendationsCount: number;
      agencies: RelevantAgencyRecord[];
      currentAgencyId: string;
    }) => {
      mockHeader(props);
      return (
        <div data-testid="award-recommendations-list-header">
          {props.awardRecommendationsCount}
        </div>
      );
    },
  }),
);

jest.mock(
  "src/app/[locale]/(base)/award-recommendation/_components/AwardRecommendationsListTable",
  () => ({
    __esModule: true,
    default: (props: {
      currentAgencyId: string;
      onTotalRecordsChange: (totalRecords: number) => void;
    }) => {
      mockTable(props);
      return (
        <button
          data-testid="award-recommendations-list-table"
          onClick={() => props.onTotalRecordsChange(12)}
          type="button"
        >
          update count
        </button>
      );
    },
  }),
);

const agencies: RelevantAgencyRecord[] = [
  {
    agency_id: 1,
    agency_name: "Agency One",
    agency_code: "A1",
    top_level_agency: null,
  },
  {
    agency_id: 2,
    agency_name: "Agency Two",
    agency_code: "A2",
    top_level_agency: null,
  },
];

describe("AwardRecommendationsListContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders header and table with selected agency context", () => {
    render(
      <AwardRecommendationsListContent
        agencies={agencies}
        currentAgencyId="1"
      />,
    );

    expect(
      screen.getByTestId("award-recommendations-list-header"),
    ).toHaveTextContent("0");
    expect(
      screen.getByTestId("award-recommendations-list-table"),
    ).toBeInTheDocument();
    expect(mockHeader).toHaveBeenLastCalledWith({
      awardRecommendationsCount: 0,
      agencies,
      currentAgencyId: "1",
    });
    const lastTableCall = mockTable.mock.calls.at(-1)?.[0];
    expect(lastTableCall?.currentAgencyId).toBe("1");
    expect(typeof lastTableCall?.onTotalRecordsChange).toBe("function");
  });

  it("updates the header count when the table reports total records", () => {
    render(
      <AwardRecommendationsListContent
        agencies={agencies}
        currentAgencyId="1"
      />,
    );

    fireEvent.click(screen.getByTestId("award-recommendations-list-table"));

    expect(
      screen.getByTestId("award-recommendations-list-header"),
    ).toHaveTextContent("12");
    expect(mockHeader).toHaveBeenLastCalledWith({
      awardRecommendationsCount: 12,
      agencies,
      currentAgencyId: "1",
    });
  });
});
