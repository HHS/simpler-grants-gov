import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";

import "#mapping/targets.tsp";
import "./form.tsp";

using TypeSpec.Xml;
using SimplerForms;
namespace XSD.SF424BRR;

alias grantsGovXml = Mappings.Target.grantsGovXml;
alias Assurances = Forms.SF424BRR.SF424BRR;
alias Representative = Forms.SF424BRR.SF424BRRRepresentative;

@nsDeclarations
enum Namespaces {
  RRSF424_SF424B: "http://apply.grants.gov/forms/RRSF424_SF424B-V1.1",
  glob: "http://apply.grants.gov/system/Global-V1.0",
}

@name("Assurances")
@ns(Namespaces.RRSF424_SF424B)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/RRSF424_SF424B-V1.1.xsd")
@Mapping.from(grantsGovXml, Assurances)
model Root {
  // Initialized from the form edition; the source type itself is not a fixed literal.
  @name("FormVersionIdentifier")
  @ns(Namespaces.glob)
  @minLength(1)
  @maxLength(30)
  formVersionIdentifier: string = "1.1";

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

@ns(Namespaces.RRSF424_SF424B)
model AuthorizedRepresentative {
  @Mapping.from(grantsGovXml, Representative.signature)
  @name("RepresentativeName")
  representativeName?: string;

  @Mapping.from(grantsGovXml, Representative.title)
  @name("RepresentativeTitle")
  representativeTitle?: string;
}
