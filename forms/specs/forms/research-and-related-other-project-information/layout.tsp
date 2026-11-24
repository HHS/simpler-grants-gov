import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.ResearchAndRelatedOtherProjectInformation;

@UI.layout(ResearchAndRelatedOtherProjectInformation)
model ResearchAndRelatedOtherProjectInformationLayout {
  /** 1.a. If YES to Human Subjects. 2.a. If YES to Vertebrate Animals. If human subjects are not involved, skip the rest of block 1. If vertebrate animals are not used, skip the rest of block 2. Review the date and assurance instructions before answering. */
  @UI.label("Human and animal oversight")
  oversight: {
    @UI.label("Human subjects")
    humanSubjects: {
      humanSubjectsInvolved: Form.humanSubjectsInvolved;

      @UI.label("")
      @UI.visibleWhen(Form.humanSubjectsInvolved, true)
      humanSubjectsDetails: {
        exemptFromFederalRegulations: Form.exemptFromFederalRegulations;
        exemptionNumbers: Form.exemptionNumbers;

        @UI.label("")
        @UI.visibleWhen(Form.exemptFromFederalRegulations, false)
        irbReview: {
          irbReviewPending: Form.irbReviewPending;
          irbApprovalDate: Form.irbApprovalDate;
        };

        humanSubjectAssuranceNumber: Form.humanSubjectAssuranceNumber;
      };
    };

    @UI.label("Vertebrate animals")
    vertebrateAnimals: {
      vertebrateAnimalsUsed: Form.vertebrateAnimalsUsed;

      @UI.label("")
      @UI.visibleWhen(Form.vertebrateAnimalsUsed, true)
      animalUseDetails: {
        iacucReviewPending: Form.iacucReviewPending;
        iacucApprovalDate: Form.iacucApprovalDate;
        animalWelfareAssuranceNumber: Form.animalWelfareAssuranceNumber;
      };
    };
  };

  @UI.label("Other project circumstances")
  circumstances: {
    proprietaryInformationIncluded: ResearchAndRelatedOtherProjectInformation.proprietaryInformationIncluded;

    @UI.label("Environmental impact")
    environmentalImpact: {
      environmentalImpact: Form.environmentalImpact;

      @UI.label("")
      @UI.visibleWhen(Form.environmentalImpact, true)
      environmentalImpactDetails: {
        environmentalImpactExplanation: Form.environmentalImpactExplanation;
        assessmentOrExemptionPerformed: Form.assessmentOrExemptionPerformed;
        assessmentOrExemptionExplanation: Form.assessmentOrExemptionExplanation;
      };
    };

    @UI.label("Historic performance site")
    historicPlace: {
      historicSiteDesignatedOrEligible: Form.historicSiteDesignatedOrEligible;
      historicSiteExplanation: Form.historicSiteExplanation;
    };

    @UI.label("International activities")
    internationalActivities: {
      internationalActivitiesInvolved: Form.internationalActivitiesInvolved;
      internationalCountries: Form.internationalCountries;
      internationalActivitiesExplanation: Form.internationalActivitiesExplanation;
    };
  };

  /** Project Summary/Abstract and Project Narrative are required unless the cover submission type is Pre-application. Prepare each document for its named purpose and follow the announcement and agency instructions. Up to 100 other project files may be provided. OMB Number: 4040-0001. Expiration Date: 01/31/2029. */
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
