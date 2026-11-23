import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.Phs398ResearchTrainingProgramPlan;

@UI.layout(Phs398ResearchTrainingProgramPlan)
model Phs398ResearchTrainingProgramPlanLayout {
  @doc("Include an Introduction to Application for Resubmission or Revision applications.")
  @UI.label("Introduction")
  section1: {
    introductionToApplication: Phs398ResearchTrainingProgramPlan.introductionToApplication;
  };

  @doc("Attach the required Program Plan. Include a Progress Report for a Renewal application. For a Resubmission it is optional. For other application types it does not apply.")
  @UI.label("Training Program Section")
  section2: {
    programPlan: Phs398ResearchTrainingProgramPlan.programPlan;
    responsibleConductOfResearch: Phs398ResearchTrainingProgramPlan.responsibleConductOfResearch;
    methodsForEnhancingReproducibility: Phs398ResearchTrainingProgramPlan.methodsForEnhancingReproducibility;
    multiplePdPiLeadershipPlan: Phs398ResearchTrainingProgramPlan.multiplePdPiLeadershipPlan;
    progressReport: Phs398ResearchTrainingProgramPlan.progressReport;
  };

  @doc("Prepare each applicable faculty, support and training-record document for its named purpose. Follow funding opportunity and agency instructions.")
  @UI.label("Faculty, Trainees and Training Record Section")
  section3: {
    participatingFacultyBiosketches: Phs398ResearchTrainingProgramPlan.participatingFacultyBiosketches;
    lettersOfSupport: Phs398ResearchTrainingProgramPlan.lettersOfSupport;
    dataTables: Phs398ResearchTrainingProgramPlan.dataTables;
  };

  @doc("Include Vertebrate Animals when you selected Yes to “Are Vertebrate Animals Used?” on R&R Other Project Information. Prepare each other applicable document for its named purpose and follow agency instructions.")
  @UI.label("Other Training Program Section")
  section4: {
    vertebrateAnimals: Phs398ResearchTrainingProgramPlan.vertebrateAnimals;
    selectAgentResearch: Phs398ResearchTrainingProgramPlan.selectAgentResearch;
    consortiumContractualArrangements: Phs398ResearchTrainingProgramPlan.consortiumContractualArrangements;
    otherPlans: Phs398ResearchTrainingProgramPlan.otherPlans;
  };

  @doc("Attach up to ten PDF files in the order required by the funding opportunity and agency instructions.")
  @UI.label("Appendix")
  section5: {
    appendix: Phs398ResearchTrainingProgramPlan.appendix;
  };
}
