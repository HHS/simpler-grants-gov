import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.Phs398ResearchPlan;

@UI.layout(Phs398ResearchPlan)
model Phs398ResearchPlanLayout {
  /** Include an Introduction to Application for Resubmission or Revision applications. */
  @UI.label("Introduction")
  section1: {
    @UI.label("1. Introduction to Application (for Resubmission and Revision applications)")
    introductionToApplication: Phs398ResearchPlan.introductionToApplication;
  };

  /** Research Strategy is required: Follow the instructions provided in the Application Guide and the FOA regarding the content of the Research Strategy attachment. Unless specified otherwise in the FOA, follow the page limits for the Research Strategy in the table of page limits found in the Application Guide.  Save the information in a single file and click the Add Attachment button to complete this entry. Include a Progress Report Publication List for Renewal applications. Numeric page limits depend on the applicable Application Guide, FOA and agency instructions. */
  @UI.label("Research Plan Section")
  section2: {
    @UI.label("2. Specific Aims")
    specificAims: Phs398ResearchPlan.specificAims;

    @UI.label("3. Research Strategy")
    researchStrategy: Phs398ResearchPlan.researchStrategy;

    @UI.label("4. Progress Report Publication List (for Renewal applications)")
    progressReportPublicationList: Phs398ResearchPlan.progressReportPublicationList;
  };

  /** Include Vertebrate Animals when you selected Yes to animals used on R&R Other Project Information. Prepare each supporting document for its named purpose and follow agency instructions. */
  @UI.label("Other Research Plan Section")
  section3: {
    @UI.label("5. Vertebrate Animals")
    vertebrateAnimals: Phs398ResearchPlan.vertebrateAnimals;

    @UI.label("6. Select Agent Research")
    selectAgentResearch: Phs398ResearchPlan.selectAgentResearch;

    @UI.label("7. Multiple PD/PI Leadership Plan")
    multiplePdPiLeadershipPlan: Phs398ResearchPlan.multiplePdPiLeadershipPlan;

    @UI.label("8. Consortium/Contractual Arrangements")
    consortiumContractualArrangements: Phs398ResearchPlan.consortiumContractualArrangements;

    @UI.label("9. Letters of Support")
    lettersOfSupport: Phs398ResearchPlan.lettersOfSupport;

    @UI.label("10. Resource Sharing Plan(s)")
    resourceSharingPlans: Phs398ResearchPlan.resourceSharingPlans;

    @UI.label("11. Other Plan(s)")
    otherPlans: Phs398ResearchPlan.otherPlans;

    @UI.label("12. Authentication of Key Biological and/or Chemical Resources")
    keyBiologicalAndOrChemicalResources: Phs398ResearchPlan.keyBiologicalAndOrChemicalResources;
  };

  /** Attach up to ten PDF files in the order required by the funding opportunity and agency instructions. */
  @UI.label("Appendix")
  section4: {
    @UI.label("13. Appendix")
    appendix: Phs398ResearchPlan.appendix;
  };
}
