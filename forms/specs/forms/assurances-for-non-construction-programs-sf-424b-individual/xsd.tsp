import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";

import "#mapping/targets.tsp";
import "./form.tsp";

using TypeSpec.Xml;
using SimplerForms;
namespace XSD.SF424BIndividual;

alias grantsGovXml = Mappings.Target.grantsGovXml;
alias Assurances = Forms.SF424BIndividual.SF424BIndividual;
alias Representative = Forms.SF424BIndividual.SF424BIndividualRepresentative;

@nsDeclarations
enum Namespaces {
  Individual_SF424B: "http://apply.grants.gov/forms/Individual_SF424B-V1.1",
}

@name("Assurances")
@ns(Namespaces.Individual_SF424B)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/Individual_SF424B-V1.1.xsd")
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

@ns(Namespaces.Individual_SF424B)
model AuthorizedRepresentative {
  @Mapping.from(grantsGovXml, Representative.signature)
  @name("RepresentativeName")
  representativeName?: string;

  @Mapping.from(grantsGovXml, Representative.title)
  @name("RepresentativeTitle")
  representativeTitle?: string;
}
