import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.ResearchAndRelatedOtherProjectInformation;

// The review headings are presentation-only; every reference keeps its authoritative
// answer path. Meaningful human/animal/environment/international objects remain data.
@UI.layout(ResearchAndRelatedOtherProjectInformation)
model ResearchAndRelatedOtherProjectInformationLayout {
  @doc("1.a. If YES to Human Subjects. 2.a. If YES to Vertebrate Animals. If human subjects are not involved, skip the rest of block 1. If vertebrate animals are not used, skip the rest of block 2. Review the date and assurance instructions before answering.")
  @UI.label("Human and animal oversight")
  oversight: {
    humanSubjects: ResearchAndRelatedOtherProjectInformation.humanSubjects;
    vertebrateAnimals: ResearchAndRelatedOtherProjectInformation.vertebrateAnimals;
  };

  @UI.label("Other project circumstances")
  circumstances: {
    proprietaryInformationIncluded: ResearchAndRelatedOtherProjectInformation.proprietaryInformationIncluded;
    environmentalImpact: ResearchAndRelatedOtherProjectInformation.environmentalImpact;
    historicPlace: ResearchAndRelatedOtherProjectInformation.historicPlace;
    internationalActivities: ResearchAndRelatedOtherProjectInformation.internationalActivities;
  };

  @doc("Project Summary/Abstract and Project Narrative are required unless the cover submission type is Pre-application. Prepare each document for its named purpose and follow the announcement and agency instructions. Up to 100 other project files may be provided. OMB Number: 4040-0001. Expiration Date: 01/31/2029.")
  @UI.label("Project documents")
  documents: {
    projectSummaryAbstract: ResearchAndRelatedOtherProjectInformation.projectSummaryAbstract;
    projectNarrative: ResearchAndRelatedOtherProjectInformation.projectNarrative;
    bibliographyReferencesCited: ResearchAndRelatedOtherProjectInformation.bibliographyReferencesCited;
    facilitiesOtherResources: ResearchAndRelatedOtherProjectInformation.facilitiesOtherResources;
    equipment: ResearchAndRelatedOtherProjectInformation.equipment;
    otherAttachments: ResearchAndRelatedOtherProjectInformation.otherAttachments;
  };
}
