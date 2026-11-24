import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.Phs398ResearchTrainingProgramPlan;

@UI.layout(Phs398ResearchTrainingProgramPlan)
model Phs398ResearchTrainingProgramPlanLayout {
  /** Include an Introduction to Application for Resubmission or Revision applications. */
  @UI.label("Introduction")
  section1: {
    @UI.label("1. Introduction to Application (for Resubmission and Revision applications)")
    introductionToApplication: Phs398ResearchTrainingProgramPlan.introductionToApplication;
  };

  /** Attach the required Program Plan. Include a Progress Report for a Renewal application. For a Resubmission it is optional. For other application types it does not apply. */
  @UI.label("Training Program Section")
  section2: {
    @UI.label("2. Program Plan")
    programPlan: Phs398ResearchTrainingProgramPlan.programPlan;

    @UI.label("3. Plan for Instruction in the Responsible Conduct of Research")
    responsibleConductOfResearch: Phs398ResearchTrainingProgramPlan.responsibleConductOfResearch;

    @UI.label("4. Plan for Instruction in Methods for Enhancing Reproducibility")
    methodsForEnhancingReproducibility: Phs398ResearchTrainingProgramPlan.methodsForEnhancingReproducibility;

    @UI.label("5. Multiple PD/PI Leadership Plan")
    multiplePdPiLeadershipPlan: Phs398ResearchTrainingProgramPlan.multiplePdPiLeadershipPlan;

    @UI.label("6. Progress Report (for Renewal applications)")
    progressReport: Phs398ResearchTrainingProgramPlan.progressReport;
  };

  /** Prepare each applicable faculty, support and training-record document for its named purpose. Follow funding opportunity and agency instructions. */
  @UI.label("Faculty, Trainees and Training Record Section")
  section3: {
    @UI.label("7. Participating Faculty Biosketches")
    participatingFacultyBiosketches: Phs398ResearchTrainingProgramPlan.participatingFacultyBiosketches;

    @UI.label("8. Letters of Support")
    lettersOfSupport: Phs398ResearchTrainingProgramPlan.lettersOfSupport;

    @UI.label("9. Data Tables")
    dataTables: Phs398ResearchTrainingProgramPlan.dataTables;
  };

  /** Include Vertebrate Animals when you selected Yes to “Are Vertebrate Animals Used?” on R&R Other Project Information. Prepare each other applicable document for its named purpose and follow agency instructions. */
  @UI.label("Other Training Program Section")
  section4: {
    @UI.label("10. Vertebrate Animals")
    vertebrateAnimals: Phs398ResearchTrainingProgramPlan.vertebrateAnimals;

    @UI.label("11. Select Agent Research")
    selectAgentResearch: Phs398ResearchTrainingProgramPlan.selectAgentResearch;

    @UI.label("12. Consortium/Contractual Arrangements")
    consortiumContractualArrangements: Phs398ResearchTrainingProgramPlan.consortiumContractualArrangements;

    @UI.label("13. Other Plan(s)")
    otherPlans: Phs398ResearchTrainingProgramPlan.otherPlans;
  };

  /** Attach up to ten PDF files in the order required by the funding opportunity and agency instructions. */
  @UI.label("Appendix")
  section5: {
    @UI.label("14. Appendix")
    appendix: Phs398ResearchTrainingProgramPlan.appendix;
  };
}
