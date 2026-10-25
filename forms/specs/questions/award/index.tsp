import "simpler-forms";
import "#questions/index.tsp";
using SimplerForms;
namespace Questions.Awards;

/** Enter the PR/Award Number or Project Name. This field is required. */
@Meta.question(#{ id: "award/project-reference" })
@UI.label("PR/AWARD NUMBER OR PROJECT NAME")
@UI.widget(Rendering.Widget.Text)
@minLength(1)
@maxLength(60)
scalar ProjectReference extends string;
