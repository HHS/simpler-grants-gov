import { render, screen } from "@testing-library/react";

import React, { JSX } from "react";

import "@testing-library/jest-dom";

import Page, {
  generateMetadata,
} from "src/app/[locale]/(base)/organization/[id]/manage-users/page";

type Params = { locale: string; id: string };

type ManageUsersPageContentProps = {
  organizationId: string;
};

const ManageUsersPageContentMock = jest.fn<
  void,
  [ManageUsersPageContentProps]
>();

jest.mock("src/components/manageUsers/ManageUsersPageContent", () => ({
  ManageUsersPageContent: (props: ManageUsersPageContentProps) => {
    ManageUsersPageContentMock(props);
    return (
      <div data-testid="manage-users-page-content">
        org-id: {props.organizationId}
      </div>
    );
  },
}));

type PageFn = (args: { params: Promise<Params> }) => Promise<JSX.Element>;

jest.mock("src/services/featureFlags/withFeatureFlag", () => ({
  __esModule: true,
  default:
    (WrappedComponent: PageFn, _flagName: string, _onDisabled: () => void) =>
    (props: { params: Promise<Params> }) =>
      WrappedComponent(props),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn(),
}));

type TranslationFn = (key: string) => string;

const getTranslationsMock = jest.fn<
  Promise<TranslationFn>,
  [{ locale: string }]
>(({ locale }) =>
  Promise.resolve((key: string) => {
    if (key === "ManageUsers.pageTitle") return "Manage users page title";
    if (key === "Index.metaDescription") {
      return "Manage users meta description";
    }
    return `${key}:${locale}`;
  }),
);

jest.mock("next-intl/server", () => ({
  getTranslations: (opts: { locale: string }) => getTranslationsMock(opts),
}));

const PageTyped = Page as unknown as PageFn;

describe("manage-users page", () => {
  it("renders ManageUsersPageContent with the organizationId from params", async () => {
    const params: Promise<Params> = Promise.resolve({
      locale: "en",
      id: "org-123",
    });

    const element = await PageTyped({ params });

    render(element);

    expect(screen.getByTestId("manage-users-page-content")).toHaveTextContent(
      "org-id: org-123",
    );
    expect(ManageUsersPageContentMock).toHaveBeenCalledTimes(1);
    const contentProps = ManageUsersPageContentMock.mock.calls[0][0];
    expect(contentProps.organizationId).toBe("org-123");
  });

  it("generateMetadata returns translated title and description", async () => {
    const params: Promise<Params> = Promise.resolve({
      locale: "en",
      id: "org-123",
    });

    const meta = await generateMetadata({ params });

    expect(meta).toEqual({
      title: "Manage users page title",
      description: "Manage users meta description",
    });
  });
});
