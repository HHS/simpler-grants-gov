import "#forms/index.tsp";
import "#questions/types/yes-no.tsp";
import "#questions/types/attachment.tsp";
import "#ui/widgets.tsp";
import "simpler-forms-sgg";
import "@typespec/json-schema";
using SimplerForms;
namespace Forms.SbirSttrInformation;

@Meta.form(#{ id: "sbir-sttr-information", formName: "SBIR/STTR Information" })
@GrantsGov.form(#{
  legacyFormId: 787,
  shortFormName: "SBIR_STTR_Information_3_0",
  formVersion: "3.0",
  agencyCode: "SGG",
  ombNumber: "4040-0001",
  expirationDate: "2029-01-31",
})
@UI.label("SBIR/STTR Information")
@example(#{
  agency: "HHS",
  sbcControlId: "001234567",
  programType: "SBIR",
  applicationType: "Phase I",
  eligibilityCertification: true,
  anticipatedPersonnel: 2,
  majorityVentureCapitalOwned: false,
  facultyOrStudentOwned: false,
  federalSubcontractsIncluded: false,
  hubZoneLocated: false,
  researchEntirelyInUnitedStates: true,
  equivalentFederalWork: false,
  disclosurePermitted: false,
  tabaFundsRequested: false,
  phaseIIAwardsReceived: false,
  principalInvestigatorPrimaryEmployment: false,
})
@TypeSpec.JsonSchema.extension(
  "allOf",
  #[
    #{
      `if`: #{
        required: #["program_type", "phase_ii_awards_received"],
        properties: #{
          program_type: #{ `enum`: #["SBIR", "Both"] },
          phase_ii_awards_received: #{ `const`: true },
        },
      },
      then: #{ required: #["commercialization_history"] },
    },
    #{
      `if`: #{
        required: #["application_type"],
        properties: #{
          application_type: #{ `enum`: #["Phase II", "Fast-Track"] },
        },
      },
      then: #{ required: #["commercialization_plan"] },
    },
    #{
      `if`: #{
        required: #["agency", "application_type"],
        properties: #{
          agency: #{ `const`: "DOE" },
          application_type: #{ `const`: "Phase I" },
        },
      },
      then: #{ required: #["commercialization_plan"] },
    }
  ]
)
model Form {
  @UI.label("Agency to which you are applying (select only one)")
  @doc("This field is required.")
  @UI.widget(Rendering.Widget.Select)
  @TypeSpec.JsonSchema.extension("enum", #["DOE", "HHS", "USDA", "Other"])
  agency: string;

  @UI.label("Other Agency")
  @doc("If \"Other\" is selected, enter agency name.")
  @minLength(0)
  @maxLength(20)
  @Validation.requiredWhen(Form.agency, "Other")
  @UI.enabledWhen(Form.agency, "Other")
  @Validation.constraintsWhen(Form.agency, "Other", #{ minLength: 1 })
  otherAgency?: string;

  @UI.label("SBC Control ID:")
  @doc("Enter the SBC Control ID. This field is required.")
  @minLength(9)
  @maxLength(9)
  @pattern("^[0-9]{9}$")
  sbcControlId: string;

  @UI.label("Program Type (select only one)")
  @doc("This field is required.")
  @UI.widget(Rendering.Widget.Select)
  @TypeSpec.JsonSchema.extension("enum", #["SBIR", "STTR", "Both"])
  programType: string;

  @UI.label("Application Type (select only one)")
  @doc("See agency-specific instructions to determine application type participation. This field is required.")
  @UI.widget(Rendering.Widget.Select)
  @TypeSpec.JsonSchema.extension(
    "enum",
    #[
      "Phase I",
      "Phase II",
      "Fast-Track",
      "Direct Phase II",
      "Phase IIA",
      "Phase IIB",
      "Phase IIC",
      "Commercialization Readiness Program"
    ]
  )
  applicationType: string;

  @UI.label("Phase I Letter of Intent Number:")
  @doc("Enter Phase I Letter of Intent Number.")
  @minLength(0)
  @maxLength(20)
  phaseILetterOfIntentNumber?: string;

  @UI.label("Agency Topic/Subtopic:")
  @doc("Enter Agency Topic/Subtopic.")
  @minLength(0)
  @maxLength(10)
  @Validation.requiredWhen(Form.agency, "DOE")
  @Validation.constraintsWhen(Form.agency, "DOE", #{ minLength: 1 })
  agencyTopicSubtopic?: string;

  @UI.label("1a. Do you certify that at the time of award your organization will meet the eligibility criteria for a small business as defined in the funding opportunity announcement?")
  @doc("This field is required.")
  @UI.widget(Rendering.Widget.Radio)
  eligibilityCertification: Questions.Types.YesNo;

  @UI.label("1b. Anticipated Number of personnel to be employed at your organization at the time of award.")
  @doc("Enter the number of personnel anticipated to be employed by the small business at the time of award. This field is required.")
  @minValue(1)
  @maxValue(999)
  anticipatedPersonnel: integer;

  @UI.label("1c. Is your small business majority owned by venture capital operating companies, hedge funds, or private equity firms?")
  @doc("This field is required.")
  @UI.widget(Rendering.Widget.Radio)
  majorityVentureCapitalOwned: Questions.Types.YesNo;

  @UI.label("1d. Is your small business a Faculty or Student-Owned entity?")
  @doc("This field is required.")
  @UI.widget(Rendering.Widget.Radio)
  facultyOrStudentOwned: Questions.Types.YesNo;

  @UI.label("2. Does this application include subcontracts with Federal laboratories or any other Federal Government agencies?")
  @doc("This field is required.")
  @UI.widget(Rendering.Widget.Radio)
  federalSubcontractsIncluded: Questions.Types.YesNo;

  @UI.label("If yes, insert the names of the Federal laboratories/agencies:")
  @doc("If you have answered \"yes\" to the question above, then please indicate the names of the applicable Federal laboratories or agencies, in the space provided.")
  @minLength(0)
  @maxLength(250)
  @Validation.requiredWhen(Form.federalSubcontractsIncluded, true)
  @UI.enabledWhen(Form.federalSubcontractsIncluded, true)
  @Validation.constraintsWhen(
    Form.federalSubcontractsIncluded,
    true,
    #{ minLength: 1 }
  )
  laboratoryOrAgencyNames?: string;

  @UI.label("3. Are you located in a HUBZone?")
  @doc("This field is required.")
  @UI.widget(Rendering.Widget.Radio)
  hubZoneLocated: Questions.Types.YesNo;

  @UI.label("4. Will all research and development on the project be performed in its entirety in the United States?")
  @doc("This field is required.")
  @UI.widget(Rendering.Widget.Radio)
  researchEntirelyInUnitedStates: Questions.Types.YesNo;

  @UI.label("Explanation for work outside the United States")
  @doc("If you have answered \"no\" to question 4 above, please prepare an explanation of the research and development that is being performed outside the United States, in a separate file. Then use the Add Attachment button to attach the file and complete this entry. When you click Add Attachment, browse to where you saved the file, select the appropriate file and then click Open to complete the action.")
  @UI.widget(Rendering.Widget.Attachment)
  @Validation.requiredWhen(Form.researchEntirelyInUnitedStates, false)
  @UI.enabledWhen(Form.researchEntirelyInUnitedStates, false)
  outsideUnitedStatesExplanation?: Questions.Types.Attachment;

  @UI.label("5. Has the applicant and/or Program Director/Principal Investigator submitted proposals for essentially equivalent work under other Federal program solicitations or received other Federal awards for essentially equivalent work?")
  @doc("This field is required.")
  @UI.widget(Rendering.Widget.Radio)
  equivalentFederalWork: Questions.Types.YesNo;

  @UI.label("If yes, insert the names of the other Federal agencies:")
  @doc("If you have answered \"yes\" to question 5 above, then please indicate the names of the applicable Federal agencies, in the space provided.")
  @minLength(0)
  @maxLength(250)
  @Validation.requiredWhen(Form.equivalentFederalWork, true)
  @UI.enabledWhen(Form.equivalentFederalWork, true)
  @Validation.constraintsWhen(
    Form.equivalentFederalWork,
    true,
    #{ minLength: 1 }
  )
  equivalentWorkAgencies?: string;

  @UI.label("6. Disclosure Permission Statement: If this application does not result in an award, is the Government permitted to disclose the title of your proposed project, and the name, address, telephone number and email address of the official signing for the applicant organization to state-level economic development organizations that may be interested in contacting you for further information (e.g., possible collaborations, investment)?")
  @doc("This field is required.")
  @UI.widget(Rendering.Widget.Radio)
  disclosurePermitted: Questions.Types.YesNo;

  @UI.label("7. Does the application include a request of SBIR or STTR funds for Technical and Business Assistance (TABA)? If yes, please follow the agency specific instructions to provide the budget request and justification. (Please answer no if you plan to use the agency TABA vendor, which does not require you to include a request for TABA funds in your application.)")
  @doc("This field is required.")
  @UI.widget(Rendering.Widget.Radio)
  tabaFundsRequested: Questions.Types.YesNo;

  @UI.label("8. Commercialization Plan")
  @doc("The following applications require a Commercialization Plan: Phase I (DOE only), Phase II (all agencies), Phase I/II Fast-Track (all agencies). Include a Commercialization Plan in accordance with the agency announcement and/or agency-specific instructions. To attach a Commercialization Plan file, click the Add Attachment button, browse to where you saved the file, select the file, and then click Open.")
  @UI.widget(Rendering.Widget.Attachment)
  commercializationPlan?: Questions.Types.Attachment;

  @UI.label("9. Have you received SBIR Phase II awards from the Federal Government? If yes, provide a company commercialization history in accordance with agency-specific instructions using this attachment.")
  @doc("This field is required for Program Type SBIR or Both.")
  @UI.widget(Rendering.Widget.Radio)
  @UI.enabledWhenAny(Form.programType, "SBIR", "Both")
  @Validation.requiredWhen(Form.programType, "SBIR")
  @Validation.requiredWhen(Form.programType, "Both")
  phaseIIAwardsReceived?: Questions.Types.YesNo;

  @UI.label("SBIR commercialization history")
  @doc("If you have answered \"Yes\" to question 9 above, please prepare a commercialization history in accordance with agency specific instructions, in a separate file. Then use the Add Attachment button to attach the file and complete this entry. When you click Add Attachment, browse to where you saved the file, select the appropriate file and then click Open to complete the action.")
  @UI.widget(Rendering.Widget.Attachment)
  @UI.enabledWhen(Form.phaseIIAwardsReceived, true)
  commercializationHistory?: Questions.Types.Attachment;

  @UI.label("10. Will the Project Director/Principal Investigator have his/her primary employment with the small business at the time of award?")
  @doc("This field is required for Program Type SBIR or Both.")
  @UI.widget(Rendering.Widget.Radio)
  @UI.enabledWhenAny(Form.programType, "SBIR", "Both")
  @Validation.requiredWhen(Form.programType, "SBIR")
  @Validation.requiredWhen(Form.programType, "Both")
  principalInvestigatorPrimaryEmployment?: Questions.Types.YesNo;

  @UI.label("11. Please indicate whether the answer to BOTH of the following questions is TRUE: (1) Does the Project Director/Principal Investigator have a formal appointment or commitment either with the small business directly (as an employee or a contractor) OR as an employee of the Research Institution, which in turn has made a commitment to the small business through the STTR application process; AND (2) Will the Project Director/Principal Investigator devote at least 10% effort to the proposed project?")
  @doc("This field is required for Program Type STTR or Both.")
  @UI.widget(Rendering.Widget.Radio)
  @UI.enabledWhenAny(Form.programType, "STTR", "Both")
  @Validation.requiredWhen(Form.programType, "STTR")
  @Validation.requiredWhen(Form.programType, "Both")
  appointmentAndMinimumEffortCertified?: Questions.Types.YesNo;

  @UI.label("12. In the joint research and development proposed in this project, does the small business perform at least 40% of the work and the research institution named in the application perform at least 30% of the work?")
  @doc("This field is required for Program Type STTR or Both.")
  @UI.widget(Rendering.Widget.Radio)
  @UI.enabledWhenAny(Form.programType, "STTR", "Both")
  @Validation.requiredWhen(Form.programType, "STTR")
  @Validation.requiredWhen(Form.programType, "Both")
  smallBusinessAndInstitutionWorkSharesCertified?: Questions.Types.YesNo;

  @UI.label("13. Provide UEI of non-profit research partner for STTR.")
  @doc("Enter the UEI of the non-profit research partner for STTR. This field is required for Program Type STTR or Both.")
  @minLength(12)
  @maxLength(12)
  @UI.enabledWhenAny(Form.programType, "STTR", "Both")
  @Validation.requiredWhen(Form.programType, "STTR")
  @Validation.requiredWhen(Form.programType, "Both")
  researchPartnerUei?: string;
}
