import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";
import "#mapping/targets.tsp";
import "./form.tsp";
using TypeSpec.Xml;
using SimplerForms;
namespace XSD.NSFDeviationAuthorization11;
alias grantsGovXml = Mappings.Target.grantsGovXml;
alias Form = Forms.NSFDeviationAuthorization.NSFDeviationAuthorization;

@nsDeclarations
enum Namespaces {
  NSF_DeviationAuthorization: "http://apply.grants.gov/forms/NSF_DeviationAuthorization-V1.1",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
  glob: "http://apply.grants.gov/system/Global-V1.0",
}

@name("NSF_DeviationAuthorization")
@ns(Namespaces.NSF_DeviationAuthorization)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/NSF_DeviationAuthorization-V1.1.xsd")
@Mapping.from(grantsGovXml, Form)
model Root {
  @Mapping.from(grantsGovXml, Form.deviationAuthorization)
  @name("DeviationAuthorization")
  deviationAuthorization?: string;

  @attribute @name("FormVersion") formVersion: "1.1";
}
