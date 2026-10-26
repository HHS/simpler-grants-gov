// Form-local mapping reuses the maintained emitter and HumanName type; no new XML strategy.
import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";
import "#mapping/targets.tsp";
import "#xsd/global-library.tsp";
import "./form.tsp";
using TypeSpec.Xml;
using SimplerForms;
namespace XSD.GGLobbyingForm;
alias grantsGovXml = Mappings.Target.grantsGovXml;
alias Form = Forms.GGLobbyingForm.GGLobbyingForm;
alias GlobLib = XSD.GlobLib;

@nsDeclarations
enum Namespaces {
  GG_LobbyingForm: "http://apply.grants.gov/forms/GG_LobbyingForm-V1.1",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
}

@name("LobbyingForm")
@ns(Namespaces.GG_LobbyingForm)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/GG_LobbyingForm-V1.1.xsd")
@Mapping.from(grantsGovXml, Form)
model Root {
  @Mapping.from(grantsGovXml, Form.organizationName)
  @name("ApplicantName")
  organizationName: string;

  @Mapping.from(grantsGovXml, Form.authorizedRepresentativeName)
  @name("AuthorizedRepresentativeName")
  authorizedRepresentativeName: GlobLib.HumanNameDataType;

  @Mapping.from(grantsGovXml, Form.authorizedRepresentativeTitle)
  @name("AuthorizedRepresentativeTitle")
  authorizedRepresentativeTitle: string;

  @Mapping.from(grantsGovXml, Form.authorizedRepresentativeSignature)
  @name("AuthorizedRepresentativeSignature")
  authorizedRepresentativeSignature: string;

  @Mapping.from(grantsGovXml, Form.submittedDate)
  @name("SubmittedDate")
  submittedDate: plainDate;

  @attribute @name("FormVersion") formVersion: "1.1";
}
