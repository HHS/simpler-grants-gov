import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";
import "#mapping/targets.tsp";
import "./form.tsp";
using TypeSpec.Xml;
using SimplerForms;
namespace XSD.NSFSuggestedReviewers11;
alias grantsGovXml = Mappings.Target.grantsGovXml;
alias Form = Forms.NSFSuggestedReviewers.NSFSuggestedReviewers;

@nsDeclarations
enum Namespaces {
  NSF_SuggestedReviewers: "http://apply.grants.gov/forms/NSF_SuggestedReviewers-V1.1",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
}

@name("NSF_SuggestedReviewers")
@ns(Namespaces.NSF_SuggestedReviewers)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/NSF_SuggestedReviewers-V1.1.xsd")
@Mapping.from(grantsGovXml, Form)
model Root {
  @Mapping.from(grantsGovXml, Form.suggestedReviewers)
  @name("SuggestedReviewers")
  suggestedReviewers?: string;

  @Mapping.from(grantsGovXml, Form.reviewersNotToInclude)
  @name("ReviewersNotToInclude")
  reviewersNotToInclude?: string;

  @attribute @name("FormVersion") formVersion: "1.1";
}
