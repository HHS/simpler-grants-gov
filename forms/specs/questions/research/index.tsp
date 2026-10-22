import "simpler-forms";

import "#questions/index.tsp";
import "#questions/types/attachment.tsp";

using SimplerForms;

// What the R&R senior/key person profile XSDs (R&R, R&R Expanded, NSF) each declare inline,
// with the same type and facets: a person's credential and role, and the files that support
// their profile. Each attachment is an `att:AttachedFileDataType`.
namespace Questions.Research;

/** If you have an established personal profile with the agency (e.g., NIH), enter its agency ID. */
@Meta.question(#{ id: "research/credential" })
@UI.label("Credential, e.g., agency login")
@minLength(1)
@maxLength(60)
scalar Credential extends string;

/** Complete if the project role is "Other Professional" or "Other (Specify)", e.g., Engineer, Chemist. */
@Meta.question(#{ id: "research/other-project-role-category" })
@UI.label("Other Project Role Category")
@minLength(1)
@maxLength(40)
scalar OtherProjectRoleCategory extends string;

/** Attach a biographical sketch: education and training, research and professional experience, collaborators and affiliations, publications and synergistic activities. */
@Meta.question(#{ id: "research/biographical-sketch" })
@UI.label("Biographical Sketch")
scalar BiographicalSketch extends Questions.Types.Attachment;

/** Attach a list of all current and pending support for ongoing projects and pending proposals. */
@Meta.question(#{ id: "research/current-pending-support" })
@UI.label("Current & Pending Support")
scalar CurrentPendingSupport extends Questions.Types.Attachment;

/** Attach a list of all collaborators and other affiliations. */
@Meta.question(#{ id: "research/collaborators" })
@UI.label("Collaborators & Other Affiliations")
scalar Collaborators extends Questions.Types.Attachment;

/** Attach a description of synergistic activities. */
@Meta.question(#{ id: "research/synergistic-activities" })
@UI.label("Synergistic Activities")
scalar SynergisticActivities extends Questions.Types.Attachment;

/** Attach the profiles of any senior/key persons the form has no room for, in a single file. */
@Meta.question(#{ id: "research/additional-profiles" })
@UI.label("Additional Senior/Key Person Profile(s)")
scalar AdditionalProfiles extends Questions.Types.Attachment;

/** Attach the biographical sketches of any senior/key persons the form has no room for, in a single file. */
@Meta.question(#{ id: "research/additional-biographical-sketches" })
@UI.label("Additional Biographical Sketch(es)")
scalar AdditionalBiographicalSketches extends Questions.Types.Attachment;

/** Attach the current and pending support of any senior/key persons the form has no room for, in a single file. */
@Meta.question(#{ id: "research/additional-current-pending-support" })
@UI.label("Additional Current & Pending Support")
scalar AdditionalCurrentPendingSupport extends Questions.Types.Attachment;

/** Attach the collaborators and other affiliations of any senior/key persons the form has no room for, in a single file. */
@Meta.question(#{ id: "research/additional-collaborators" })
@UI.label("Additional Collaborators & Other Affiliations")
scalar AdditionalCollaborators extends Questions.Types.Attachment;

/** Attach the synergistic activities of any senior/key persons the form has no room for, in a single file. */
@Meta.question(#{ id: "research/additional-synergistic-activities" })
@UI.label("Additional Synergistic Activities")
scalar AdditionalSynergisticActivities extends Questions.Types.Attachment;
