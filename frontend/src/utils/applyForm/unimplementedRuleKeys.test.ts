import { UiSchema } from "src/types/applyForm/types";

import { unimplementedRuleKeys } from "./unimplementedRuleKeys";

describe("unimplementedRuleKeys", () => {
  it("should name the rules present in a UI schema that the renderer ignores", () => {
    const uiSchema = [
      {
        type: "section",
        label: "Key Contacts",
        name: "key_contacts",
        children: [
          {
            type: "field",
            definition: "/properties/address/properties/state",
            conditional: { then: { interaction: "enabled" } },
          },
        ],
      },
    ] as unknown as UiSchema;

    expect(unimplementedRuleKeys(uiSchema)).toEqual(["conditional"]);
  });

  it("should name nothing for a UI schema the renderer fully implements", () => {
    const uiSchema = [
      {
        type: "field",
        definition: "/properties/applicant_organization_name",
        widget: "Text",
      },
    ] as unknown as UiSchema;

    expect(unimplementedRuleKeys(uiSchema)).toEqual([]);
  });
});
