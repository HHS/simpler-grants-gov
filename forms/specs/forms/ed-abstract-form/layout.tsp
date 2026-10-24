import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.EDAbstract;

@UI.layout(EDAbstract)
model EDAbstractLayout {
  @doc("An abstract is to be submitted in accordance with the following:\n\n1. Abstract Requirements\n\n• Abstracts must not exceed one page and should use language that will be understood by a range of audiences.\n\n• Abstracts must include the project title, goals, and expected outcomes and contributions related to research, policy, and practice.\n\n• Abstracts must include the population(s) to be served.\n\n• Abstracts must include primary activities to be performed by the recipient.\n\n• Abstracts must include subrecipient activities that are known or specified at the time of application submission.\n\nFor research applications, abstracts also include the following:\n\n• Theoretical and conceptual background of the study (i.e., prior research that the investigation builds upon and that provides a compelling rationale for this study).\n\n• Research issues, hypotheses and questions being addressed.\n\n• Study design including a brief description of the sample including sample size, methods, principals, and dependent, independent, and control variables, as well as the approach to data analysis.\n\n[Note: For a non-electronic submission, include the name and address of your organization and the name, phone number and e-mail address of the contact person for this project.]\n\nYou must attach one and only one file to this page.")
  @UI.label("Abstract requirements")
  section1: {
    attachment: EDAbstract.attachment;
  };
}
