import "simpler-forms";
import "simpler-forms-sgg";

import "#forms/index.tsp";
import "#forms/sf424-r-r/fragments.tsp";
import "#questions/application/index.tsp";
import "#questions/certification/index.tsp";
import "#questions/organization/applicant-type.tsp";
import "#questions/person/index.tsp";
import "#questions/project/index.tsp";
import "#questions/types/address.tsp";

using SimplerForms;

// The R&R SF-424's questions with every element optional. Reuse R&R's models, made optional,
// and redeclare only the fields whose R&R rules this form drops.
namespace Forms.SF424ResearchMultiProject;

alias Application = Forms.SF424Research.ResearchApplication;
alias Revision = Forms.SF424Research.ResearchRevision;
alias OtherAgencies = Forms.SF424Research.ResearchOtherAgencies;
alias ApplicantType = Forms.SF424Research.ResearchApplicantType;
alias ContactPerson = Forms.SF424Research.ResearchContactPerson;

// =============================================================================
// OPPORTUNITY
// =============================================================================

model MultiProjectOpportunity {
  ...OptionalProperties<Forms.SF424Research.ResearchOpportunity>;
}

// =============================================================================
// APPLICATION
// =============================================================================

// Drop R&R's rules that require the federal identifier and the previous tracking ID.
model MultiProjectApplication {
  // DAT 01-1 to 01-3 send a corrected New application's tracking ID to the federal identifier.
  /** To change or correct a New application, enter its Grants.gov tracking ID as the federal identifier. To change or correct any other type, keep its existing federal identifier. */
  @UI.label("Type of Submission")
  @UI.widget(Rendering.Widget.Radio)
  submissionType?: Forms.SF424Research.ResearchSubmissionType;

  ...OptionalProperties<OmitProperties<
    Application,
    | "submissionType"
    | "federalIdentifier"
    | "previousTrackingId"
    | "revision"
    | "otherAgencies"
    | "stateReview"
  >>;

  /** Leave this blank for a new application, unless you are changing or correcting it: then enter its Grants.gov tracking ID. For a renewal, continuation, or revision, enter the assigned federal identifier, even if this submission is a correction. */
  federalIdentifier?: Questions.Applications.FederalId;

  /** Enter the previous Grants.gov tracking ID, if applicable. */
  @UI.label("Previous Grants.gov Tracking ID")
  @minLength(13)
  @maxLength(15)
  previousTrackingId?: string;

  revision?: MultiProjectRevision;
  otherAgencies?: MultiProjectOtherAgencies;
  stateReview?: MultiProjectStateReview;
}

model MultiProjectRevision {
  ...PickProperties<Revision, "type">;

  /** Explain the revision if you selected E, Other. */
  @UI.label("Other Revision Explanation")
  @UI.enabledWhen(
    MultiProjectRevision.type,
    Forms.SF424Research.ResearchRevisionCode.E
  )
  @minLength(1)
  @maxLength(45)
  otherSpecify?: string;
}

model MultiProjectOtherAgencies {
  ...OptionalProperties<PickProperties<OtherAgencies, "submitted">>;

  /** Enter the name of the other agency. */
  @UI.label("Which other agencies?")
  @UI.enabledWhen(MultiProjectOtherAgencies.submitted, true)
  @minLength(1)
  @maxLength(20)
  explanation?: string;
}

model MultiProjectStateReview {
  ...OptionalProperties<Forms.SF424Research.ResearchStateReview>;
}

// =============================================================================
// APPLICANT
// =============================================================================

model MultiProjectApplicant {
  organization?: MultiProjectOrganization;
  type?: MultiProjectApplicantType;
  ...OptionalProperties<PickProperties<
    Forms.SF424Research.ResearchApplicant,
    "congressionalDistrict"
  >>;
}

// `OptionalOrganizationType`: R&R's organization with every element optional.
model MultiProjectOrganization {
  ...OptionalProperties<OmitProperties<
    Forms.SF424Research.ResearchOrganization,
    "address"
  >>;
  address?: MultiProjectAddress;
}

model MultiProjectApplicantType {
  ...OptionalProperties<PickProperties<ApplicantType, "code">>;

  @UI.label("Other Applicant Type")
  @UI.enabledWhen(
    MultiProjectApplicantType.code,
    Questions.Organizations.ApplicantType.X
  )
  @minLength(1)
  @maxLength(50)
  otherSpecify?: string;

  ...PickProperties<ApplicantType, "smallBusiness">;
}

// =============================================================================
// PROJECT
// =============================================================================

model MultiProjectProject {
  ...OptionalProperties<PickProperties<
    Forms.SF424Research.ResearchProject,
    "title"
  >>;
  timeline?: MultiProjectTimeline;
}

model MultiProjectTimeline {
  ...OptionalProperties<Forms.SF424Research.ResearchTimeline>;
}

// =============================================================================
// CONTACTS
// =============================================================================

model MultiProjectContacts {
  authorizedRepresentative?: MultiProjectContact;
  projectDirector?: MultiProjectContact;
  pointOfContact?: MultiProjectContactPerson;
}

// The contact person, with the XSD's optional name and address types.
model MultiProjectContactPerson {
  /** Enter the person's name. */
  @UI.label("Name")
  name?: MultiProjectName;

  ...OptionalProperties<PickProperties<ContactPerson, "title">>;

  /** Enter the person's complete address. */
  @UI.label("Address")
  address?: MultiProjectAddress;

  ...OptionalProperties<PickProperties<
    ContactPerson,
    "phone" | "fax" | "email"
  >>;
}

// The PD/PI and the AOR, as R&R's `ResearchContact` composes them.
model MultiProjectContact {
  ...PickProperties<MultiProjectContactPerson, "name" | "title">;
  organization?: MultiProjectPersonOrganization;
  ...OmitProperties<MultiProjectContactPerson, "name" | "title">;
}

model MultiProjectPersonOrganization {
  ...OptionalProperties<Forms.SF424Research.ResearchPersonOrganization>;
}

// `OptionalHumanNameType`: the bank name with every part optional.
/** Enter the person's name. */
model MultiProjectName {
  ...OptionalProperties<Questions.People.PersonName>;
}

// `OptionalAddressType`: the bank ZIP+4 address with every part optional. Redeclare State and
// Zip to drop the bank's "required" help, since `@@doc` does not reach a copied property. Keep
// the nine-digit US ZIP rule, which DAT 05-5g states without requiring the ZIP.
/** Enter an address. A US ZIP code needs all nine digits. */
model MultiProjectAddress {
  ...OptionalProperties<PickProperties<
    Questions.Types.AddressZipPlusFour,
    "street1" | "street2" | "city" | "county"
  >>;

  /** Select the state. */
  @UI.label("State")
  state?: Questions.Types.StateCode;

  ...OptionalProperties<PickProperties<
    Questions.Types.AddressZipPlusFour,
    "province" | "country"
  >>;

  /** Enter the zip / postal code. A US ZIP code needs all nine digits (ZIP+4). */
  @UI.label("Zip / Postal Code")
  @Validation.constraintsWhen(
    MultiProjectAddress.country,
    Questions.Types.CountryCode.USA,
    #{ minLength: 9 }
  )
  zipCode?: Questions.Types.AddressParts.ZipCode;
}

// =============================================================================
// BUDGET
// =============================================================================

model MultiProjectBudget {
  fundingSources?: MultiProjectFundingSources;
}

model MultiProjectFundingSources {
  ...OptionalProperties<Forms.SF424Research.ResearchFundingSources>;
}

// =============================================================================
// CERTIFICATION
// =============================================================================

// The bank certification with `agree` optional: the applicant may leave it unchecked.
model MultiProjectCertification {
  /** Check to provide the required certifications and assurances. */
  @UI.label("I Agree")
  @UI.widget(Rendering.Widget.Checkbox)
  agree?: true;

  ...PickProperties<
    Questions.Certifications.Certification,
    "signature" | "dateSigned"
  >;
}
