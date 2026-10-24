import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";
import "#mapping/targets.tsp";
import "./form.tsp";
using TypeSpec.Xml;
using SimplerForms;
namespace XSD.PHSAssignmentRequest40;

alias grantsGovXml = Mappings.Target.grantsGovXml;
alias Form = Forms.PHSAssignmentRequest.PHSAssignmentRequest;

@nsDeclarations
enum Namespaces {
  PHS_AssignmentRequestForm_4_0: "http://apply.grants.gov/forms/PHS_AssignmentRequestForm_4_0-V4.0",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
  codes: "http://apply.grants.gov/system/UniversalCodes-V2.0",
}

@name("PHS_AssignmentRequestForm_4_0")
@ns(Namespaces.PHS_AssignmentRequestForm_4_0)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/PHS_AssignmentRequestForm_4_0-V4.0.xsd")
@Mapping.from(grantsGovXml, Form)
// Structural target; the pinned original XSD remains the constraint oracle.
model Root {
  @Mapping.from(grantsGovXml, Form.suggestedAwardingComponent1)
  @name("SuggestedAwardingComponent1")
  suggestedAwardingComponent1?: string;

  @Mapping.from(grantsGovXml, Form.suggestedAwardingComponent2)
  @name("SuggestedAwardingComponent2")
  suggestedAwardingComponent2?: string;

  @Mapping.from(grantsGovXml, Form.suggestedAwardingComponent3)
  @name("SuggestedAwardingComponent3")
  suggestedAwardingComponent3?: string;

  @Mapping.from(grantsGovXml, Form.suggestedStudySection1)
  @name("SuggestedStudySection1")
  suggestedStudySection1?: string;

  @Mapping.from(grantsGovXml, Form.suggestedStudySection2)
  @name("SuggestedStudySection2")
  suggestedStudySection2?: string;

  @Mapping.from(grantsGovXml, Form.suggestedStudySection3)
  @name("SuggestedStudySection3")
  suggestedStudySection3?: string;

  @Mapping.from(grantsGovXml, Form.rationaleSuggestions)
  @name("RationaleSuggestions")
  rationaleSuggestions?: string;

  @Mapping.from(grantsGovXml, Form.expertise1)
  @name("Expertise1")
  expertise1?: string;

  @Mapping.from(grantsGovXml, Form.expertise2)
  @name("Expertise2")
  expertise2?: string;

  @Mapping.from(grantsGovXml, Form.expertise3)
  @name("Expertise3")
  expertise3?: string;

  @Mapping.from(grantsGovXml, Form.expertise4)
  @name("Expertise4")
  expertise4?: string;

  @Mapping.from(grantsGovXml, Form.expertise5)
  @name("Expertise5")
  expertise5?: string;

  @Mapping.from(grantsGovXml, Form.notReview)
  @name("NotReview")
  notReview?: string;

  @attribute @name("FormVersion") formVersion: "4.0";
}
