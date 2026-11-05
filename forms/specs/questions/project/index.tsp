import "simpler-forms";
import "#questions/index.tsp";

using SimplerForms;

namespace Questions.Projects;

/** Enter a brief, descriptive title of the project. */
@Meta.question(#{ id: "project/title" })
@UI.label("Project Title")
@minLength(1)
@maxLength(200)
scalar ProjectTitle extends string;

/** Enter a brief description of the project. */
@Meta.question(#{ id: "project/description" })
@UI.label("Project Description")
@UI.widget(Rendering.Widget.TextArea)
@minLength(1)
@maxLength(1000)
scalar ProjectDescription extends string;

/** Enter the start date for the proposed project. */
@Meta.question(#{ id: "project/start-date" })
@UI.label("Start Date")
scalar ProjectStartDate extends plainDate;

/** Enter the end date for the proposed project. */
@Meta.question(#{ id: "project/end-date" })
@UI.label("End Date")
scalar ProjectEndDate extends plainDate;
