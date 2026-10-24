import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";

import "#mapping/targets.tsp";
import "./form.tsp";

using TypeSpec.Xml;
using SimplerForms;
namespace XSD.SF424BMandatory;

alias grantsGovXml = Mappings.Target.grantsGovXml;
alias Assurances = Forms.SF424BMandatory.SF424BMandatory;
alias Representative = Forms.SF424BMandatory.SF424BMandatoryRepresentative;

@nsDeclarations
enum Namespaces {
  Mandatory_SF424B: "http://apply.grants.gov/forms/Mandatory_SF424B-V1.1",
}

@name("Assurances")
@ns(Namespaces.Mandatory_SF424B)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/Mandatory_SF424B-V1.1.xsd")
@Mapping.from(grantsGovXml, Assurances)
model Root {
  @Mapping.from(grantsGovXml, Assurances.authorizedRepresentative)
  @name("AuthorizedRepresentative")
  authorizedRepresentative?: AuthorizedRepresentative;

  @Mapping.from(grantsGovXml, Assurances.applicantOrganizationName)
  @name("ApplicantOrganizationName")
  applicantOrganizationName?: string;

  @Mapping.from(grantsGovXml, Assurances.submittedDate)
  @name("SubmittedDate")
  submittedDate?: plainDate;

  @attribute @name("FormVersion") formVersion: "1.1";
  @attribute programType: "Non-Construction";
}

@ns(Namespaces.Mandatory_SF424B)
model AuthorizedRepresentative {
  @Mapping.from(grantsGovXml, Representative.signature)
  @name("RepresentativeName")
  representativeName?: string;

  @Mapping.from(grantsGovXml, Representative.title)
  @name("RepresentativeTitle")
  representativeTitle?: string;
}
