import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";
import "#mapping/targets.tsp";
import "#xsd/global-library.tsp";
import "./form.tsp";
using TypeSpec.Xml;
using SimplerForms;
namespace XSD.RRPersonalData12;
alias target = Mappings.Target.grantsGovXml;
alias Form = Forms.RRPersonalData.PersonalData;
alias Director = Forms.RRPersonalData.Director;
@nsDeclarations
enum Namespaces {
  personal: "http://apply.grants.gov/forms/RR_PersonalData_1_2-V1.2",
  globLib: "http://apply.grants.gov/system/GlobalLibrary-V2.0",
}
@ns(Namespaces.personal)
@name("RR_PersonalData_1_2")
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/RR_PersonalData_1_2-V1.2.xsd")
@Mapping.from(target, Form)
model Root {
  @Mapping.from(target, Form.projectDirector)
  @name("ProjectDirector")
  projectDirector: DirectorType;

  @Mapping.from(target, Form.coProjectDirector)
  @name("Co-ProjectDirector")
  @maxItems(4)
  coProjectDirector?: DirectorType[];

  @attribute @name("FormVersion") formVersion: "1.2";
}
@ns(Namespaces.personal)
model DirectorType {
  @Mapping.from(target, Director.name)
  @name("Name")
  name: XSD.GlobLib.HumanNameDataType;

  @Mapping.from(target, Director.gender) @name("Gender") gender?: string;
  @Mapping.from(target, Director.race) @name("Race") race?: string[];

  @Mapping.from(target, Director.ethnicity)
  @name("Ethnicity")
  ethnicity?: string;

  @Mapping.from(target, Director.disabilityStatus)
  @name("DisabilityStatus")
  @maxItems(4)
  disabilityStatus?: string[];

  @Mapping.from(target, Director.citizenship)
  @name("Citizenship")
  citizenship?: string;
}
