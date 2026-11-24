import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#questions/types/attachment.tsp";
import "#questions/types/yes-no.tsp";
using SimplerForms;
namespace Forms.ResearchAndRelatedOtherProjectInformation;

// Source enum lexical values. UI labels 1..8 refer to these categories; no uniqueness
// assertion is added because the raw XSD does not supply one.
enum ExemptionNumber {
  one: "E1",
  two: "E2",
  three: "E3",
  four: "E4",
  five: "E5",
  six: "E6",
  seven: "E7",
  eight: "E8",
}

@doc("Human-subject involvement and its regulatory oversight. Source HumanSubjectsIndicator and HumanSubjectsSupplement are one applicant concept; this is not an XML transport wrapper.")
model HumanSubjects {
  @doc("If activities involving human subjects are planned at any time during the proposed project at any performance site, check yes.  Check yes, even if the proposed project is exempt from Regulations for the Protection of Human Subjects.  If no, skip the rest of block 1.  This field is required.\n\nIf activities involving human subjects are not planned at any time during the proposed project at any performance site, click here for no.  Skip the rest of block 1.  This field is required. ")
  @UI.label("1. Are Human Subjects Involved?")
  @UI.widget(Rendering.Widget.Radio)
  involved: Questions.Types.YesNo;

  @doc("Is the Project Exempt from Federal regulations is required.\n\nYes, this project is exempt from Federal regulations.\n\nNo, this project is not exempt from Federal regulations.")
  @UI.label("Is the Project Exempt from Federal regulations?")
  @UI.widget(Rendering.Widget.Radio)
  @UI.enabledWhen(HumanSubjects.involved, true)
  @Validation.requiredWhen(HumanSubjects.involved, true)
  exemptFromFederalRegulations?: Questions.Types.YesNo;

  @doc("If human subject activities are exempt from Federal regulations, provide the exemption numbers corresponding to one or more of the exemption categories.  The eight categories of research that qualify for exemption from coverage by the regulations are defined in the Common Rule for the Protection of Human Subjects.")
  @UI.label("If yes, check appropriate exemption number.")
  @UI.widget(Rendering.Widget.MultiSelect)
  @maxItems(8)
  @UI.enabledWhen(HumanSubjects.exemptFromFederalRegulations, true)
  @Validation.requiredWhen(HumanSubjects.exemptFromFederalRegulations, true)
  @Validation.constraintsWhen(
    HumanSubjects.exemptFromFederalRegulations,
    true,
    #{ minItems: 1 }
  )
  exemptionNumbers?: ExemptionNumber[];

  @doc("If IRB review is pending, check Yes.\n\nIf IRB review is not pending, check No.")
  @UI.label("If no, is the IRB review Pending?")
  @UI.widget(Rendering.Widget.Radio)
  @UI.enabledWhen(HumanSubjects.exemptFromFederalRegulations, false)
  @Validation.requiredWhen(HumanSubjects.exemptFromFederalRegulations, false)
  irbReviewPending?: Questions.Types.YesNo;

  @doc("Enter the latest IRB approval date. Leave this blank if review is pending.")
  @UI.label("IRB Approval Date:")
  @UI.enabledWhen(HumanSubjects.irbReviewPending, false)
  @Validation.requiredWhen(HumanSubjects.irbReviewPending, false)
  irbApprovalDate?: plainDate;

  @doc("Enter the approved Federal Wide Assurance (FWA), Multiple Project Assurance (MPA), Single Project Assurance (SPA) Number or Cooperative Project Assurance Number that the applicant has on file with the Office for Human Research Protections, if available.  If the applicant has a FWA number, enter the 8-digit number.  Do not enter the FWA before the number.")
  @UI.label("Human Subject Assurance Number: ")
  @minLength(1)
  @maxLength(10)
  @UI.enabledWhen(HumanSubjects.involved, true)
  @UI.widget(Rendering.Widget.Text)
  assuranceNumber?: string;
}

model ProjectAnimalOversight {
  @doc("If activities involving vertebrate animals are planned at any time during the proposed project at any performance site, check yes.  If no, skip the rest of block 2.  This field is required. ")
  @UI.label("2. Are Vertebrate Animals Used?")
  @UI.widget(Rendering.Widget.Radio)
  used: Questions.Types.YesNo;

  @doc("Indicate if an Institutional Animal Care and Use Committee (IACUC) review is pending.\n\nIndicate if an Institutional Animal Care and Use Committee (IACUC) review is pending. Click here if No.")
  @UI.label("Is the IACUC review Pending?")
  @UI.widget(Rendering.Widget.Radio)
  @UI.enabledWhen(ProjectAnimalOversight.used, true)
  @Validation.requiredWhen(ProjectAnimalOversight.used, true)
  iacucReviewPending?: Questions.Types.YesNo;

  @doc("Enter the latest IACUC approval date. Leave this blank if review is pending.")
  @UI.label("IACUC Approval Date:")
  @UI.enabledWhen(ProjectAnimalOversight.iacucReviewPending, false)
  @Validation.requiredWhen(ProjectAnimalOversight.iacucReviewPending, false)
  iacucApprovalDate?: plainDate;

  @doc("Enter the federally approved animal welfare assurance number.")
  @UI.label("Animal Welfare Assurance Number:")
  @minLength(1)
  @maxLength(9)
  @UI.widget(Rendering.Widget.Text)
  @UI.enabledWhen(ProjectAnimalOversight.used, true)
  @Validation.requiredWhen(ProjectAnimalOversight.iacucReviewPending, false)
  assuranceNumber?: string;
}

model EnvironmentalImpact {
  @doc("Indicate if this project has an actual or potential impact - positive or negative - on the environment. This field is required.\n\nIndicate if this project has an actual or potential impact - positive or negative - on the environment. Click no here if this is not the case.  This field is required.")
  @UI.label("4.a. Does this Project Have an Actual or Potential Impact - positive or negative - on the environment?")
  @UI.widget(Rendering.Widget.Radio)
  hasImpact: Questions.Types.YesNo;

  @doc("Enter explanation of the actual or potential impact on the environment.")
  @UI.label("4.b. If yes, please explain:")
  @minLength(1)
  @maxLength(55)
  @UI.widget(Rendering.Widget.Text)
  @UI.enabledWhen(EnvironmentalImpact.hasImpact, true)
  @Validation.requiredWhen(EnvironmentalImpact.hasImpact, true)
  impactExplanation?: string;

  @doc("Check yes or no.")
  @UI.label("4.c. If this project has an actual or potential impact on the environment, has an exemption been authorized or an environmental assessment (EA) or environmental impact statement (EIS) been performed?")
  @UI.widget(Rendering.Widget.Radio)
  @UI.enabledWhen(EnvironmentalImpact.hasImpact, true)
  assessmentOrExemptionPerformed?: Questions.Types.YesNo;

  @doc("Enter additional details about the EA or EIS.")
  @UI.label("4.d. If yes, please explain:")
  @minLength(1)
  @maxLength(55)
  @UI.widget(Rendering.Widget.Text)
  @UI.enabledWhen(EnvironmentalImpact.assessmentOrExemptionPerformed, true)
  @Validation.requiredWhen(
    EnvironmentalImpact.assessmentOrExemptionPerformed,
    true
  )
  assessmentOrExemptionExplanation?: string;
}

model HistoricPlace {
  @doc("If any research performance site is designated or eligible to be designated as a historic place, if Yes, check the Yes box and then provide an explanation in the box provided in 5.a.  Otherwise, check the No box.  This field is required.")
  @UI.label("5.  Is the research performance site designated, or eligible to be designated, as a historic place?")
  @UI.widget(Rendering.Widget.Radio)
  designatedOrEligible: Questions.Types.YesNo;

  @doc("If you checked the Yes box indicating any performance site is designated, or eligible to be designated, as a historic place, provide the explanation here.")
  @UI.label("5.a. If yes, please explain:")
  @minLength(1)
  @maxLength(55)
  @UI.widget(Rendering.Widget.Text)
  @UI.enabledWhen(HistoricPlace.designatedOrEligible, true)
  @Validation.requiredWhen(HistoricPlace.designatedOrEligible, true)
  explanation?: string;
}

model InternationalActivities {
  @doc("Indicate whether this project involves activities outside of the United States or partnerships with international collaborators.  This field is required.\n\nIndicate whether this project involves activities outside of the United States or partnerships with international collaborators.  Click here for no.  This field is required.")
  @UI.label("6. Does this project involve activities outside of the United States or partnerships with international collaborators?")
  @UI.widget(Rendering.Widget.Radio)
  involved: Questions.Types.YesNo;

  @doc("Enter the countries with which international cooperative activities are involved.")
  @UI.label("6.a. If yes, identify countries:")
  @minLength(1)
  @maxLength(55)
  @UI.widget(Rendering.Widget.Text)
  @UI.enabledWhen(InternationalActivities.involved, true)
  @Validation.requiredWhen(InternationalActivities.involved, true)
  countries?: string;

  @doc("Enter an explanation for involvement with outside entities (optional).")
  @UI.label("6.b. Optional Explanation:")
  @minLength(1)
  @maxLength(55)
  @UI.widget(Rendering.Widget.Text)
  explanation?: string;
}

@doc("Describe human and animal involvement, other project circumstances and each distinct supporting document. OMB Number: 4040-0001. Expiration Date: 01/31/2029.")
@Meta.form(#{
  id: "research-and-related-other-project-information",
  formName: "Research And Related Other Project Information",
})
@GrantsGov.form(#{
  legacyFormId: 619,
  shortFormName: "RR_OtherProjectInfo_1_4",
  formVersion: "1.4",
  agencyCode: "SGG",
  ombNumber: "4040-0001",
  expirationDate: "2029-01-31",
})
@example(
  #{
    humanSubjects: #{ involved: false },
    vertebrateAnimals: #{ used: false },
    proprietaryInformationIncluded: false,
    environmentalImpact: #{ hasImpact: false },
    historicPlace: #{ designatedOrEligible: false },
    internationalActivities: #{ involved: false },
  },
  #{
    title: "Unconditional project circumstances",
    description: "Six unconditional predicates only. The cover identifies this example as a pre-application.",
  }
)
@example(
  #{
    humanSubjects: #{
      involved: true,
      exemptFromFederalRegulations: true,
      exemptionNumbers: #[ExemptionNumber.one, ExemptionNumber.four],
      assuranceNumber: "00012345",
    },
    vertebrateAnimals: #{ used: true, iacucReviewPending: true },
    proprietaryInformationIncluded: false,
    environmentalImpact: #{ hasImpact: false },
    historicPlace: #{ designatedOrEligible: false },
    internationalActivities: #{
      involved: true,
      countries: "Canada; United Kingdom",
      explanation: "Collaborator field observations.",
    },
    projectSummaryAbstract: "00000000-0000-4000-8000-000000006191",
    projectNarrative: "00000000-0000-4000-8000-000000006192",
    bibliographyReferencesCited: "00000000-0000-4000-8000-000000006193",
    facilitiesOtherResources: "00000000-0000-4000-8000-000000006194",
    equipment: "00000000-0000-4000-8000-000000006195",
    otherAttachments: #[
      "00000000-0000-4000-8000-000000006196",
      "00000000-0000-4000-8000-000000006197"
    ],
  },
  #{
    title: "Exempt human research and project documents",
    description: "Synthetic oversight and document IDs with exemption categories 1 and 4, IACUC review pending, and international collaboration. The file identifiers are synthetic.",
  }
)
@example(
  #{
    humanSubjects: #{
      involved: true,
      exemptFromFederalRegulations: false,
      irbReviewPending: false,
      irbApprovalDate: plainDate.fromISO("2026-09-16"),
      assuranceNumber: "00012345",
    },
    vertebrateAnimals: #{
      used: true,
      iacucReviewPending: false,
      iacucApprovalDate: plainDate.fromISO("2026-09-17"),
      assuranceNumber: "D12345678",
    },
    proprietaryInformationIncluded: false,
    environmentalImpact: #{
      hasImpact: true,
      impactExplanation: "Field sampling at existing research sites.",
      assessmentOrExemptionPerformed: true,
      assessmentOrExemptionExplanation: "EA completed; see applicable agency instructions.",
    },
    historicPlace: #{
      designatedOrEligible: true,
      explanation: "Sampling near an eligible historic research building.",
    },
    internationalActivities: #{
      involved: true,
      countries: "Canada; United Kingdom",
      explanation: "Collaborator field observations.",
    },
    projectSummaryAbstract: "00000000-0000-4000-8000-000000006191",
    projectNarrative: "00000000-0000-4000-8000-000000006192",
    bibliographyReferencesCited: "00000000-0000-4000-8000-000000006193",
    facilitiesOtherResources: "00000000-0000-4000-8000-000000006194",
    equipment: "00000000-0000-4000-8000-000000006195",
    otherAttachments: #[
      "00000000-0000-4000-8000-000000006196",
      "00000000-0000-4000-8000-000000006197"
    ],
  },
  #{
    title: "Nonpending oversight and explanatory branches",
    description: "Exercises IRB and IACUC approval dates plus environmental and historic explanations. Source if-available wording tensions remain visible; synthetic examples do not establish approvals.",
  }
)
model ResearchAndRelatedOtherProjectInformation {
  @UI.label("Human subjects")
  humanSubjects: HumanSubjects;

  @UI.label("Vertebrate animals")
  vertebrateAnimals: ProjectAnimalOversight;

  @doc("Patentable ideas, trade secrets, privileged or confidential commercial or financial information, disclosure of which may harm the applicant, should be included in applications only when such information is necessary to convey an understanding of the proposed project.  If the application includes such information, check yes and clearly mark each line or paragraph on the pages containing the proprietary/privileged information with a legend similar to: \"The following contains proprietary/privileged information that (name of applicant) requests not be released to persons outside the Government, except for purposes of review and evaluation.\"  This field is required.")
  @UI.label("3. Is proprietary/privileged information included in the application?")
  @UI.widget(Rendering.Widget.Radio)
  proprietaryInformationIncluded: Questions.Types.YesNo;

  @UI.label("Environmental impact")
  environmentalImpact: EnvironmentalImpact;

  @UI.label("Historic performance site")
  historicPlace: HistoricPlace;

  @UI.label("International activities")
  internationalActivities: InternationalActivities;

  @doc("The Project Summary must contain a summary of the proposed activity suitable for dissemination to the public.  It should be a self-contained description of the project and should contain a statement of objectives and methods to be employed.  It should be informative to other persons working in the same or related fields and insofar as possible understandable to a scientifically or technically literate lay reader.  This Summary must not include any proprietary/confidential information.")
  @UI.label("7. Project Summary/Abstract")
  @UI.widget(Rendering.Widget.Attachment)
  projectSummaryAbstract?: Questions.Types.Attachment;

  @doc("Provide Project Narrative in accordance with the announcement and/or agency-specific instructions.")
  @UI.label("8. Project Narrative")
  @UI.widget(Rendering.Widget.Attachment)
  projectNarrative?: Questions.Types.Attachment;

  @doc("Provide a bibliography of any references cited in the Project Narrative.  Each reference must include the names of all authors (in the same sequence in which they appear in the publication), the article and journal title, book title, volume number, page numbers, and year of publication.  Include only bibliographic citations.  Applicants should be especially careful to follow scholarly practices in providing citations for source materials relied upon when preparing any section of the application.")
  @UI.label("9. Bibliography & References Cited")
  @UI.widget(Rendering.Widget.Attachment)
  bibliographyReferencesCited?: Questions.Types.Attachment;

  @doc("This information is used to assess the capability of the organizational resources available to perform the effort proposed.  Identify the facilities to be used (Laboratory, Animal, Computer, Office, Clinical and Other).  If appropriate, indicate their capacities, pertinent capabilities, relative proximity and extent of availability to the project.  Describe only those resources that are directly applicable to the proposed work.  Provide any information describing the Other Resources available to the project (e.g., machine shop, electronic shop) and the extent to which they would be available to the project.")
  @UI.label("10.  Facilities & Other Resources")
  @UI.widget(Rendering.Widget.Attachment)
  facilitiesOtherResources?: Questions.Types.Attachment;

  @doc("List major items of equipment already available for this project and, if appropriate identify location and pertinent capabilities.")
  @UI.label("11. Equipment")
  @UI.widget(Rendering.Widget.Attachment)
  equipment?: Questions.Types.Attachment;

  @doc("Attach a file to provide any other project information not provided above or in accordance with the announcement and/or agency-specific instruction. \n\nOptional Other Attachment Check Box. Indicates whether an Optional Other Attachment is attached.")
  @UI.label("12. Other Attachments")
  @UI.widget(Rendering.Widget.AttachmentArray)
  @maxItems(100)
  otherAttachments?: Questions.Types.Attachment[];
}
