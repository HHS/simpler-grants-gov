import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.Phs398ResearchPlan;

@UI.layout(Phs398ResearchPlan)
model Phs398ResearchPlanLayout {
  @doc("Include an Introduction to Application for Resubmission or Revision applications.")
  @UI.label("Introduction")
  section1: {
    introductionToApplication: Phs398ResearchPlan.introductionToApplication;
  };

  @doc("Research Strategy is required: Follow the instructions provided in the Application Guide and the FOA regarding the content of the Research Strategy attachment. Unless specified otherwise in the FOA, follow the page limits for the Research Strategy in the table of page limits found in the Application Guide.  Save the information in a single file and click the Add Attachment button to complete this entry. Include a Progress Report Publication List for Renewal applications. Numeric page limits depend on the applicable Application Guide, FOA and agency instructions.")
  @UI.label("Research Plan Section")
  section2: {
    specificAims: Phs398ResearchPlan.specificAims;
    researchStrategy: Phs398ResearchPlan.researchStrategy;
    progressReportPublicationList: Phs398ResearchPlan.progressReportPublicationList;
  };

  @doc("Include Vertebrate Animals when you selected Yes to animals used on R&R Other Project Information. Prepare each supporting document for its named purpose and follow agency instructions.")
  @UI.label("Other Research Plan Section")
  section3: {
    vertebrateAnimals: Phs398ResearchPlan.vertebrateAnimals;
    selectAgentResearch: Phs398ResearchPlan.selectAgentResearch;
    multiplePdPiLeadershipPlan: Phs398ResearchPlan.multiplePdPiLeadershipPlan;
    consortiumContractualArrangements: Phs398ResearchPlan.consortiumContractualArrangements;
    lettersOfSupport: Phs398ResearchPlan.lettersOfSupport;
    resourceSharingPlans: Phs398ResearchPlan.resourceSharingPlans;
    otherPlans: Phs398ResearchPlan.otherPlans;
    authenticationOfKeyBiologicalAndOrChemicalResources: Phs398ResearchPlan.authenticationOfKeyBiologicalAndOrChemicalResources;
  };

  @doc("Attach up to ten PDF files in the order required by the funding opportunity and agency instructions.")
  @UI.label("Appendix")
  section4: {
    appendix: Phs398ResearchPlan.appendix;
  };
}
