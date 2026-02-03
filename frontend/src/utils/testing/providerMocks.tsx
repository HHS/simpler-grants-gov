import { FeatureFlags } from "src/constants/defaultFeatureFlags";
import { QueryContext } from "src/services/search/QueryProvider";

export const mockUpdateTotalPages = jest.fn();
export const mockUpdateTotalResults = jest.fn();
export const mockUpdateLocalAndOrParam = jest.fn();
export const mockUpdateQueryTerm = jest.fn();

export const FakeQueryProvider = ({
  children,
  localAndOrParam = "",
  totalResults = "",
  queryTerm = "",
  totalPages = "1",
}: {
  children: React.ReactNode;
  localAndOrParam?: string;
  totalResults?: string;
  queryTerm?: string;
  totalPages?: string;
}) => {
  const contextValue = {
    updateTotalPages: mockUpdateTotalPages,
    updateTotalResults: mockUpdateTotalResults,
    totalPages,
    queryTerm,
    // eslint-disable-next-line
    updateQueryTerm: mockUpdateQueryTerm,
    totalResults,
    updateLocalAndOrParam: mockUpdateLocalAndOrParam,
    localAndOrParam,
  };
  return (
    <QueryContext.Provider value={contextValue}>
      {children}
    </QueryContext.Provider>
  );
};

export const createFakeUserContext = (featureFlags?: FeatureFlags) => {
  return {
    user: undefined,
    error: undefined,
    isLoading: false,
    refreshUser: function (): Promise<void> {
      throw new Error("Function not implemented.");
    },
    hasBeenLoggedOut: false,
    logoutLocalUser: function (): void {
      throw new Error("Function not implemented.");
    },
    resetHasBeenLoggedOut: function (): void {
      throw new Error("Function not implemented.");
    },
    refreshIfExpired: function (): Promise<boolean | undefined> {
      throw new Error("Function not implemented.");
    },
    refreshIfExpiring: function (): Promise<boolean | undefined> {
      throw new Error("Function not implemented.");
    },
    featureFlags: {
      ...{
        applyFormPrototypeOff: false,
        manageUsersOff: false,
      },
      ...featureFlags,
    },
    userFeatureFlags: {},
    defaultFeatureFlags: {},
  };
};
