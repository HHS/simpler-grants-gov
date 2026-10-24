import "@typespec/xml";
import "form-library-xml";
import "simpler-forms";
import "#mapping/targets.tsp";
import "./form.tsp";
using TypeSpec.Xml;
using SimplerForms;
namespace XSD.ProjectAbstractSummary;
alias grantsGovXml = Mappings.Target.grantsGovXml;
alias Form = Forms.ProjectAbstractSummary.ProjectAbstractSummary;
@nsDeclarations
enum Namespaces {
  Project_AbstractSummary_2_0: "http://apply.grants.gov/forms/Project_AbstractSummary_2_0-V2.0",
}

@name("Project_AbstractSummary_2_0")
@ns(Namespaces.Project_AbstractSummary_2_0)
@GrantsGov.xsd("https://apply07.grants.gov/apply/forms/schemas/Project_AbstractSummary_2_0-V2.0.xsd")
@Mapping.from(grantsGovXml, Form)
model Root {
  @Mapping.from(grantsGovXml, Form.fundingOpportunityNumber)
  @name("FundingOpportunityNumber")
  fundingOpportunityNumber: string;

  @Mapping.from(grantsGovXml, Form.assistanceListingNumber)
  @name("CFDANumber")
  assistanceListingNumber?: string;

  @Mapping.from(grantsGovXml, Form.applicantName)
  @name("OrganizationName")
  applicantName: string;

  @Mapping.from(grantsGovXml, Form.projectTitle)
  @name("ProjectTitle")
  projectTitle: string;

  @Mapping.from(grantsGovXml, Form.projectAbstract)
  @name("ProjectAbstract")
  projectAbstract: string;

  @attribute @name("FormVersion") formVersion: "2.0";
}
