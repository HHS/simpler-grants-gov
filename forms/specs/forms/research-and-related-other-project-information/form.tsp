import "form-library-xml";
import "simpler-forms";
import "simpler-forms-sgg";
import "#forms/index.tsp";
import "#questions/types/attachment.tsp";
import "#questions/types/yes-no.tsp";
import "./fragments.tsp";
import "./examples.tsp";
using SimplerForms;
namespace Forms.ResearchAndRelatedOtherProjectInformation;

alias Form = ResearchAndRelatedOtherProjectInformation;

@Meta.form(#{
  id: "research-and-related-other-project-information",
  formName: "Research And Related Other Project Information",
})
@Sgg.sync(#{ xml: "mapping" })
@GrantsGov.form(#{
  legacyFormId: 619,
  shortFormName: "RR_OtherProjectInfo_1_4",
  formVersion: "1.4",
  agencyCode: "SGG",
  ombNumber: "4040-0001",
  expirationDate: "2029-01-31",
})
@example(
  Examples.completedOversightReviews,
  #{ title: "Completed oversight reviews" }
)
@example(Examples.exemptResearch, #{ title: "Exempt research" })
@example(Examples.preApplication, #{ title: "Pre-application" })
// A draft may still contain answers from an inactive section.
@TypeSpec.JsonSchema.extension(
  "allOf",
  #[
    #{
      `if`: #{
        required: #[
          "human_subjects_involved",
          "exempt_from_federal_regulations"
        ],
        properties: #{
          human_subjects_involved: #{ `const`: true },
          exempt_from_federal_regulations: #{ `const`: true },
        },
      },
      then: #{
        required: #["exemption_numbers"],
        properties: #{ exemption_numbers: #{ minItems: 1 } },
      },
    },
    #{
      `if`: #{
        required: #[
          "human_subjects_involved",
          "exempt_from_federal_regulations"
        ],
        properties: #{
          human_subjects_involved: #{ `const`: true },
          exempt_from_federal_regulations: #{ `const`: false },
        },
      },
      then: #{
        required: #["irb_review_pending"],
        `if`: #{
          required: #["irb_review_pending"],
          properties: #{ irb_review_pending: #{ `const`: false } },
        },
        then: #{ required: #["irb_approval_date"] },
      },
    },
    #{
      `if`: #{
        required: #["vertebrate_animals_used", "iacuc_review_pending"],
        properties: #{
          vertebrate_animals_used: #{ `const`: true },
          iacuc_review_pending: #{ `const`: false },
        },
      },
      then: #{
        required: #["iacuc_approval_date", "animal_welfare_assurance_number"],
      },
    },
    #{
      `if`: #{
        required: #[
          "environmental_impact",
          "assessment_or_exemption_performed"
        ],
        properties: #{
          environmental_impact: #{ `const`: true },
          assessment_or_exemption_performed: #{ `const`: true },
        },
      },
      then: #{ required: #["assessment_or_exemption_explanation"] },
    }
  ]
)
model ResearchAndRelatedOtherProjectInformation {
  /**
   * If activities involving human subjects are planned at any time during the proposed project at any performance site, check yes.  Check yes, even if the proposed project is exempt from Regulations for the Protection of Human Subjects.  If no, skip the rest of block 1.  This field is required.
   *
   * If activities involving human subjects are not planned at any time during the proposed project at any performance site, click here for no.  Skip the rest of block 1.  This field is required.
   */
  @UI.label("1. Are Human Subjects Involved?")
  @UI.widget(Rendering.Widget.Radio)
  humanSubjectsInvolved: Questions.Types.YesNo;

  /**
   * Is the Project Exempt from Federal regulations is required.
   *
   * Yes, this project is exempt from Federal regulations.
   *
   * No, this project is not exempt from Federal regulations.
   */
  @UI.label("Is the Project Exempt from Federal regulations?")
  @UI.widget(Rendering.Widget.Radio)
  @UI.enabledWhen(Form.humanSubjectsInvolved, true)
  @Validation.requiredWhen(Form.humanSubjectsInvolved, true)
  exemptFromFederalRegulations?: Questions.Types.YesNo;

  /** If human subject activities are exempt from Federal regulations, provide the exemption numbers corresponding to one or more of the exemption categories.  The eight categories of research that qualify for exemption from coverage by the regulations are defined in the Common Rule for the Protection of Human Subjects. */
  @UI.label("If yes, check appropriate exemption number.")
  @UI.widget(Rendering.Widget.MultiSelect)
  @maxItems(8)
  @UI.enabledWhen(Form.exemptFromFederalRegulations, true)
  exemptionNumbers?: ExemptionNumber[];

  /**
   * If IRB review is pending, check Yes.
   *
   * If IRB review is not pending, check No.
   */
  @UI.label("If no, is the IRB review Pending?")
  @UI.widget(Rendering.Widget.Radio)
  irbReviewPending?: Questions.Types.YesNo;

  /** Enter the latest IRB approval date. Leave this blank if review is pending. */
  @UI.label("IRB Approval Date:")
  @UI.enabledWhen(Form.irbReviewPending, false)
  irbApprovalDate?: plainDate;

  /** Enter the approved Federal Wide Assurance (FWA), Multiple Project Assurance (MPA), Single Project Assurance (SPA) Number or Cooperative Project Assurance Number that the applicant has on file with the Office for Human Research Protections, if available.  If the applicant has a FWA number, enter the 8-digit number.  Do not enter the FWA before the number. */
  @UI.label("Human Subject Assurance Number: ")
  @minLength(1)
  @maxLength(10)
  @UI.enabledWhen(Form.humanSubjectsInvolved, true)
  @UI.widget(Rendering.Widget.Text)
  humanSubjectAssuranceNumber?: string;

  /** If activities involving vertebrate animals are planned at any time during the proposed project at any performance site, check yes.  If no, skip the rest of block 2.  This field is required. */
  @UI.label("2. Are Vertebrate Animals Used?")
  @UI.widget(Rendering.Widget.Radio)
  vertebrateAnimalsUsed: Questions.Types.YesNo;

  /**
   * Indicate if an Institutional Animal Care and Use Committee (IACUC) review is pending.
   *
   * Indicate if an Institutional Animal Care and Use Committee (IACUC) review is pending. Click here if No.
   */
  @UI.label("Is the IACUC review Pending?")
  @UI.widget(Rendering.Widget.Radio)
  @UI.enabledWhen(Form.vertebrateAnimalsUsed, true)
  @Validation.requiredWhen(Form.vertebrateAnimalsUsed, true)
  iacucReviewPending?: Questions.Types.YesNo;

  /** Enter the latest IACUC approval date. Leave this blank if review is pending. */
  @UI.label("IACUC Approval Date:")
  @UI.enabledWhen(Form.iacucReviewPending, false)
  iacucApprovalDate?: plainDate;

  /** Enter the federally approved animal welfare assurance number. */
  @UI.label("Animal Welfare Assurance Number:")
  @minLength(1)
  @maxLength(9)
  @UI.widget(Rendering.Widget.Text)
  @UI.enabledWhen(Form.vertebrateAnimalsUsed, true)
  animalWelfareAssuranceNumber?: string;

  /** Patentable ideas, trade secrets, privileged or confidential commercial or financial information, disclosure of which may harm the applicant, should be included in applications only when such information is necessary to convey an understanding of the proposed project.  If the application includes such information, check yes and clearly mark each line or paragraph on the pages containing the proprietary/privileged information with a legend similar to: "The following contains proprietary/privileged information that (name of applicant) requests not be released to persons outside the Government, except for purposes of review and evaluation."  This field is required. */
  @UI.label("3. Is proprietary/privileged information included in the application?")
  @UI.widget(Rendering.Widget.Radio)
  proprietaryInformationIncluded: Questions.Types.YesNo;

  /**
   * Indicate if this project has an actual or potential impact - positive or negative - on the environment. This field is required.
   *
   * Indicate if this project has an actual or potential impact - positive or negative - on the environment. Click no here if this is not the case.  This field is required.
   */
  @UI.label("4.a. Does this Project Have an Actual or Potential Impact - positive or negative - on the environment?")
  @UI.widget(Rendering.Widget.Radio)
  environmentalImpact: Questions.Types.YesNo;

  /** Enter explanation of the actual or potential impact on the environment. */
  @UI.label("4.b. If yes, please explain:")
  @minLength(1)
  @maxLength(55)
  @UI.widget(Rendering.Widget.Text)
  @UI.enabledWhen(Form.environmentalImpact, true)
  @Validation.requiredWhen(Form.environmentalImpact, true)
  environmentalImpactExplanation?: string;

  /** Check yes or no. */
  @UI.label("4.c. If this project has an actual or potential impact on the environment, has an exemption been authorized or an environmental assessment (EA) or environmental impact statement (EIS) been performed?")
  @UI.widget(Rendering.Widget.Radio)
  @UI.enabledWhen(Form.environmentalImpact, true)
  assessmentOrExemptionPerformed?: Questions.Types.YesNo;

  /** Enter additional details about the EA or EIS. */
  @UI.label("4.d. If yes, please explain:")
  @minLength(1)
  @maxLength(55)
  @UI.widget(Rendering.Widget.Text)
  @UI.enabledWhen(Form.assessmentOrExemptionPerformed, true)
  assessmentOrExemptionExplanation?: string;

  /** If any research performance site is designated or eligible to be designated as a historic place, if Yes, check the Yes box and then provide an explanation in the box provided in 5.a.  Otherwise, check the No box.  This field is required. */
  @UI.label("5.  Is the research performance site designated, or eligible to be designated, as a historic place?")
  @UI.widget(Rendering.Widget.Radio)
  historicSiteDesignatedOrEligible: Questions.Types.YesNo;

  /** If you checked the Yes box indicating any performance site is designated, or eligible to be designated, as a historic place, provide the explanation here. */
  @UI.label("5.a. If yes, please explain:")
  @minLength(1)
  @maxLength(55)
  @UI.widget(Rendering.Widget.Text)
  @UI.enabledWhen(Form.historicSiteDesignatedOrEligible, true)
  @Validation.requiredWhen(Form.historicSiteDesignatedOrEligible, true)
  historicSiteExplanation?: string;

  /**
   * Indicate whether this project involves activities outside of the United States or partnerships with international collaborators.  This field is required.
   *
   * Indicate whether this project involves activities outside of the United States or partnerships with international collaborators.  Click here for no.  This field is required.
   */
  @UI.label("6. Does this project involve activities outside of the United States or partnerships with international collaborators?")
  @UI.widget(Rendering.Widget.Radio)
  internationalActivitiesInvolved: Questions.Types.YesNo;

  /** Enter the countries with which international cooperative activities are involved. */
  @UI.label("6.a. If yes, identify countries:")
  @minLength(1)
  @maxLength(55)
  @UI.widget(Rendering.Widget.Text)
  @UI.enabledWhen(Form.internationalActivitiesInvolved, true)
  @Validation.requiredWhen(Form.internationalActivitiesInvolved, true)
  internationalCountries?: string;

  /** Enter an explanation for involvement with outside entities (optional). */
  @UI.label("6.b. Optional Explanation:")
  @minLength(1)
  @maxLength(55)
  @UI.widget(Rendering.Widget.Text)
  internationalActivitiesExplanation?: string;

  /** The Project Summary must contain a summary of the proposed activity suitable for dissemination to the public.  It should be a self-contained description of the project and should contain a statement of objectives and methods to be employed.  It should be informative to other persons working in the same or related fields and insofar as possible understandable to a scientifically or technically literate lay reader.  This Summary must not include any proprietary/confidential information. */
  @UI.label("7. Project Summary/Abstract")
  @UI.widget(Rendering.Widget.Attachment)
  projectSummaryAbstract?: Questions.Types.Attachment;

  /** Provide Project Narrative in accordance with the announcement and/or agency-specific instructions. */
  @UI.label("8. Project Narrative")
  @UI.widget(Rendering.Widget.Attachment)
  projectNarrative?: Questions.Types.Attachment;

  /** Provide a bibliography of any references cited in the Project Narrative.  Each reference must include the names of all authors (in the same sequence in which they appear in the publication), the article and journal title, book title, volume number, page numbers, and year of publication.  Include only bibliographic citations.  Applicants should be especially careful to follow scholarly practices in providing citations for source materials relied upon when preparing any section of the application. */
  @UI.label("9. Bibliography & References Cited")
  @UI.widget(Rendering.Widget.Attachment)
  bibliographyReferencesCited?: Questions.Types.Attachment;

  /** This information is used to assess the capability of the organizational resources available to perform the effort proposed.  Identify the facilities to be used (Laboratory, Animal, Computer, Office, Clinical and Other).  If appropriate, indicate their capacities, pertinent capabilities, relative proximity and extent of availability to the project.  Describe only those resources that are directly applicable to the proposed work.  Provide any information describing the Other Resources available to the project (e.g., machine shop, electronic shop) and the extent to which they would be available to the project. */
  @UI.label("10.  Facilities & Other Resources")
  @UI.widget(Rendering.Widget.Attachment)
  facilitiesOtherResources?: Questions.Types.Attachment;

  /** List major items of equipment already available for this project and, if appropriate identify location and pertinent capabilities. */
  @UI.label("11. Equipment")
  @UI.widget(Rendering.Widget.Attachment)
  equipment?: Questions.Types.Attachment;

  /** Attach any other project information the opportunity or agency asks for. */
  @UI.label("12. Other Attachments")
  @UI.widget(Rendering.Widget.AttachmentArray)
  @maxItems(100)
  otherAttachments?: Questions.Types.Attachment[];
}
