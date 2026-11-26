import type { ValidateFunction } from "ajv";
import { beforeAll, describe, expect, it } from "vitest";

import { loadFormValidator } from "../../../parity/harness/validate.ts";

type Section = Record<string, unknown>;

let validate: ValidateFunction;
let samples: Section[];

beforeAll(async () => {
  const form = await loadFormValidator("sf424-r-r-multi-project-cover");
  validate = form.validate;
  samples = form.schema.examples as Section[];
});

/** The example that answers every question R&R's corrected revision answers. */
function revision() {
  return structuredClone(
    samples.find(({ certification }) => certification !== undefined)!,
  );
}

function parent(data: Section, path: string) {
  const keys = path.split(".");
  const last = keys.pop()!;
  const section = keys.reduce<Section>(
    (node, key) => (node[key] ??= {}) as Section,
    data,
  );
  return { section, last };
}

function set(data: Section, path: string, value: unknown) {
  const { section, last } = parent(data, path);
  section[last] = value;
  return data;
}

function unset(data: Section, path: string) {
  const { section, last } = parent(data, path);
  delete section[last];
  return data;
}

function expectValid(data: Section) {
  expect(validate(data), JSON.stringify(validate.errors)).toBe(true);
}

describe("SF-424 R&R Multi-Project Cover", () => {
  it("accepts empty, component, and corrected revision examples", () => {
    expect(samples).toHaveLength(3);
    for (const data of samples) expectValid(data);
  });

  describe("optional elements", () => {
    // Every answer R&R requires, from the section down to the leaf.
    it.each([
      "opportunity",
      "opportunity.agency_name",
      "application",
      "application.submission_type",
      "application.application_type",
      "application.other_agencies",
      "application.other_agencies.submitted",
      "application.state_review",
      "application.state_review.status",
      "applicant",
      "applicant.organization",
      "applicant.organization.name",
      "applicant.organization.uei",
      "applicant.organization.ein",
      "applicant.organization.address",
      "applicant.organization.address.street1",
      "applicant.organization.address.city",
      "applicant.organization.address.country",
      "applicant.type",
      "applicant.type.code",
      "applicant.congressional_district",
      "project",
      "project.title",
      "project.timeline",
      "project.timeline.start_date",
      "project.timeline.end_date",
      "contacts",
      "contacts.point_of_contact.name",
      "contacts.point_of_contact.name.first_name",
      "contacts.point_of_contact.name.last_name",
      "contacts.point_of_contact.address",
      "contacts.point_of_contact.phone",
      "contacts.project_director",
      "contacts.project_director.organization",
      "contacts.project_director.organization.name",
      "contacts.project_director.email",
      "contacts.authorized_representative",
      "contacts.authorized_representative.title",
      "contacts.authorized_representative.email",
      "budget",
      "budget.funding_sources",
      "budget.funding_sources.federal",
      "budget.funding_sources.non_federal",
      "budget.funding_sources.total",
      "budget.funding_sources.program_income",
      "certification",
      "certification.agree",
    ])("corrected revision leaves %s optional", (path) => {
      expectValid(unset(revision(), path));
    });
  });

  describe("conditional rules", () => {
    it.each([
      [
        "Other revision type",
        "application.revision.type",
        "E",
        "application.revision.other_specify",
      ],
      [
        "changed/corrected submission",
        "application.submission_type",
        "Change/Corrected Application",
        "application.previous_tracking_id",
      ],
      [
        "revision application",
        "application.application_type",
        "Revision",
        "application.federal_identifier",
      ],
      [
        "renewal application",
        "application.application_type",
        "Renewal",
        "application.federal_identifier",
      ],
      [
        "continuation application",
        "application.application_type",
        "Continuation",
        "application.federal_identifier",
      ],
      [
        "other agency submission",
        "application.other_agencies.submitted",
        true,
        "application.other_agencies.explanation",
      ],
      [
        "state review",
        "application.state_review.status",
        "Y: Yes",
        "application.state_review.date",
      ],
      [
        "Other applicant type",
        "applicant.type.code",
        "X: Other (specify)",
        "applicant.type.other_specify",
      ],
      [
        "US address",
        "applicant.organization.address.country",
        "USA: UNITED STATES",
        "applicant.organization.address.state",
      ],
      [
        "US address",
        "applicant.organization.address.country",
        "USA: UNITED STATES",
        "applicant.organization.address.zip_code",
      ],
    ])("%s leaves %s optional", (_condition, source, value, path) => {
      const data = set(revision(), source, value);
      expectValid(unset(data, path));
    });

    it("rejects five-digit US ZIP code", () => {
      const data = set(
        revision(),
        "contacts.point_of_contact.address.zip_code",
        "02108",
      );
      expect(validate(data)).toBe(false);
    });

    it("accepts five-digit postal code outside US", () => {
      const data = revision();
      set(data, "contacts.point_of_contact.address.country", "CAN: CANADA");
      unset(data, "contacts.point_of_contact.address.state");
      set(data, "contacts.point_of_contact.address.zip_code", "02108");
      expectValid(data);
    });

    it.each(["MA-7", "MA007", "MA-0007"])(
      "rejects congressional district %j",
      (district) => {
        const data = set(
          revision(),
          "applicant.congressional_district",
          district,
        );
        expect(validate(data)).toBe(false);
      },
    );

    it("rejects unchecked certification", () => {
      const data = set(revision(), "certification.agree", false);
      expect(validate(data)).toBe(false);
    });
  });

  describe("XSD lengths", () => {
    const lengths: [string, number, number][] = [
      ["application.agency_routing_number", 1, 75],
      ["application.previous_tracking_id", 13, 15],
      ["application.revision.other_specify", 1, 45],
      ["application.other_agencies.explanation", 1, 20],
      ["applicant.organization.uei", 12, 12],
      ["applicant.organization.ein", 9, 30],
      ["applicant.type.other_specify", 1, 50],
    ];

    it.each(lengths)("accepts %s at %i and %i characters", (path, min, max) => {
      for (const length of [min, max]) {
        expectValid(set(revision(), path, "a".repeat(length)));
      }
    });

    it.each(lengths)(
      "rejects %s outside %i to %i characters",
      (path, min, max) => {
        for (const length of [min - 1, max + 1]) {
          expect(validate(set(revision(), path, "a".repeat(length)))).toBe(
            false,
          );
        }
      },
    );
  });
});
