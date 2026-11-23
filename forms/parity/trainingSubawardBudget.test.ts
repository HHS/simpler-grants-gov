import { XMLParser } from "fast-xml-parser";
import { generateXml, type XmlMapping } from "form-library-xml/runtime";
import { expect, it, vi } from "vitest";

import { loadXmlMapping } from "./harness/load.ts";

it("keeps a consortium in its numbered slot and submits only its embedded justification", () => {
  const mapping = loadXmlMapping(
    "phs-398-training-subaward-budget-attachment-s-form",
  ) as XmlMapping;
  const attachment = vi.fn(() => ({
    fileName: "justification.pdf",
    mimeType: "application/pdf",
    fileLocation: "justification.pdf",
    hashValue: "dGVzdA==",
  }));
  const xml = generateXml(
    mapping,
    {
      attachments: { slot30: "00000000-0000-4000-8000-000000000001" },
      labels: { slot30: "Consortium budget" },
      budgets: [
        {
          uei: "Z7KLM3ABCD29",
          budget_type: "Subaward/Consortium",
          justification: "00000000-0000-4000-8000-000000000002",
        },
      ],
    },
    { attachment },
  );
  const form = new XMLParser({ removeNSPrefix: true }).parse(
    xml,
  ).PHS398_TrainingSubawardBudget_3_0;

  expect(form.ATT1).toBeUndefined();
  expect(form.ATT30).toBe("Consortium budget");
  expect(form.BudgetAttachments.PHS398_TrainingBudget_2_0).toMatchObject({
    SAMUEI: "Z7KLM3ABCD29",
    BudgetJustification: { FileName: "justification.pdf" },
  });
  expect(attachment.mock.calls).toEqual([
    ["00000000-0000-4000-8000-000000000002"],
  ]);
});
