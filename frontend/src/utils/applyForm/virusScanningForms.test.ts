import {
  supportsMultipleAttachmentVirusScanning,
  supportsSingleAttachmentVirusScanning,
} from "src/utils/applyForm/virusScanningForms";

// registered form names, taken verbatim from the api form definitions in
// api/src/form_schema/forms/*/1/0/form_json.py
const SF424 = "Application for Federal Assistance (SF-424)";
const SF424_SHORT =
  "APPLICATION FOR FEDERAL DOMESTIC ASSISTANCE-SHORT ORGANIZATIONAL (SF-424)";
const SF424A = "Budget Information for Non-Construction Programs (SF-424A)";
const SF424B = "Assurances for Non-Construction Programs (SF-424B)";
const SF424C = "Budget Information for Construction Programs (SF-424C)";
const SF424D = "Assurances for Construction Programs (SF-424D)";
const ATTACHMENT_FORM = "Attachment Form";

describe("supportsMultipleAttachmentVirusScanning", () => {
  it("enables the virus scanning input for SF-424", () => {
    expect(supportsMultipleAttachmentVirusScanning(SF424)).toBe(true);
  });

  it.each([
    ["SF-424 Short Organizational", SF424_SHORT],
    ["SF-424A", SF424A],
    ["SF-424B", SF424B],
    ["SF-424C", SF424C],
    ["SF-424D", SF424D],
    ["Attachment Form", ATTACHMENT_FORM],
    ["Project Narrative Attachment Form", "Project Narrative Attachment Form"],
  ])("does not enable it for %s", (_label, formName) => {
    expect(supportsMultipleAttachmentVirusScanning(formName)).toBe(false);
  });

  it("does not match on a substring of the SF-424 name", () => {
    // SF-424 Short's registered name contains "(SF-424)", so a pattern match would
    // wrongly select it. This asserts the guard against reintroducing that.
    expect(SF424_SHORT).toContain("(SF-424)");
    expect(supportsMultipleAttachmentVirusScanning(SF424_SHORT)).toBe(false);
  });

  it.each([
    ["a partial name", "SF-424"],
    ["a differently cased name", SF424.toUpperCase()],
    ["a padded name", ` ${SF424} `],
    ["an empty name", ""],
    ["an undefined name", undefined],
  ])("does not enable it for %s", (_label, formName) => {
    expect(supportsMultipleAttachmentVirusScanning(formName)).toBe(false);
  });
});

describe("supportsSingleAttachmentVirusScanning", () => {
  it("enables the virus scanning input for the Attachment Form", () => {
    expect(supportsSingleAttachmentVirusScanning(ATTACHMENT_FORM)).toBe(true);
  });

  it.each([
    ["SF-424", SF424],
    ["SF-424 Short Organizational", SF424_SHORT],
    ["SF-424A", SF424A],
    ["an undefined name", undefined],
  ])("does not enable it for %s", (_label, formName) => {
    expect(supportsSingleAttachmentVirusScanning(formName)).toBe(false);
  });
});
