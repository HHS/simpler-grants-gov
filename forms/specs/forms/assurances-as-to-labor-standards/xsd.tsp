import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";
import "#mapping/targets.tsp";
import "./form.tsp";
using TypeSpec.Xml;
using SimplerForms;
namespace XSD.NEHLaborStandards;
alias grantsGovXml = Mappings.Target.grantsGovXml;
alias Form = Forms.NEHLaborStandards.LaborAssurances;
@nsDeclarations
enum Namespaces {
  NEH_Labor_Standards: "http://apply.grants.gov/forms/NEH_Labor_Standards-V1.0",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
}
@name("NEH_Labor_Standards")
@ns(Namespaces.NEH_Labor_Standards)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/NEH_Labor_Standards-V1.0.xsd")
@Mapping.from(grantsGovXml, Form)
model Root {
  @Mapping.from(grantsGovXml, Form.applicantOrganizationName)
  @name("ApplicantOrganizationName")
  applicantOrganizationName: string;

  @Mapping.from(grantsGovXml, Form.representativeName)
  @name("RepresentativeName")
  representativeName: string;

  @Mapping.from(grantsGovXml, Form.submittedDate)
  @name("SubmittedDate")
  submittedDate: plainDate;

  @attribute @name("FormVersion") formVersion: "1.0";
}
