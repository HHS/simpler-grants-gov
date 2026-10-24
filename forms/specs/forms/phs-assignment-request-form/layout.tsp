import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.PHSAssignmentRequest;

// Source slots remain data fields; these headings only group their presentation.
@UI.layout(PHSAssignmentRequest)
model PHSAssignmentRequestLayout {
  @UI.label("Awarding component assignment suggestions")
  @doc("Awarding Component Assignment Suggestions (optional)\nVerify your suggested awarding component(s) (e.g., NIH Institute/Center) participate(s) in the Funding Opportunity. Use the link below to identify the appropriate short abbreviation (e.g., \"NCI\" for National Cancer Institute) and enter it below. All requests will be considered; however, assignment requests cannot always be honored.\n\nSuggestions must be listed in the \"Components of Participating Organizations\" of the NOFO, or R&R Cover Form Box 4B must list an appropriate Notice of Special Interest.\n\nInformation about Awarding Component can be found here:\nhttps://grants.nih.gov/grants/phs_assignment_information.htm#AwardingComponents")
  awardingComponents: {
    suggestedAwardingComponent1: PHSAssignmentRequest.suggestedAwardingComponent1;
    suggestedAwardingComponent2: PHSAssignmentRequest.suggestedAwardingComponent2;
    suggestedAwardingComponent3: PHSAssignmentRequest.suggestedAwardingComponent3;
  };

  @UI.label("Study section assignment suggestions")
  @doc("Study Section Assignment Suggestions (optional)\nEnter the short study section code in the box below. Remove all hyphens, parentheses, and spaces. For example, enter \"AIRT\" to suggest study section \"Anti-Infective Resistance and Targets\", or BP10 to suggest \"Small Business: Biobehavioral Processes – BP (10)\". All requests will be considered; however, assignment suggestions cannot always be honored.\n\nInformation about Study Sections can be found here: https://grants.nih.gov/grants/phs_assignment_information.htm#StudySection")
  studySections: {
    suggestedStudySection1: PHSAssignmentRequest.suggestedStudySection1;
    suggestedStudySection2: PHSAssignmentRequest.suggestedStudySection2;
    suggestedStudySection3: PHSAssignmentRequest.suggestedStudySection3;
  };

  @UI.label("Rationale for assignment suggestions")
  @doc("Explain why you think the suggestions are appropriate. If you contacted NIH staff, list their name(s). Entry is limited to 1000 characters.")
  rationale: {
    rationaleSuggestions: PHSAssignmentRequest.rationaleSuggestions;
  };

  @UI.label("Scientific areas of expertise")
  @doc("Do not provide names of individuals. Each entry is limited to 40 characters.")
  expertise: {
    expertise1: PHSAssignmentRequest.expertise1;
    expertise2: PHSAssignmentRequest.expertise2;
    expertise3: PHSAssignmentRequest.expertise3;
    expertise4: PHSAssignmentRequest.expertise4;
    expertise5: PHSAssignmentRequest.expertise5;
  };

  @UI.label("Individuals who should not review")
  @doc("List individuals who should not review your application and why (optional)")
  exclusions: {
    notReview: PHSAssignmentRequest.notReview;
  };

  @UI.label("Public reporting burden")
  @doc("Public reporting burden for this collection of information is estimated to average 30 minutes per response, including the time for reviewing instructions, searching existing data sources, gathering and maintaining the data needed, and completing and reviewing the collection of information.  An agency may not conduct or sponsor, and a person is not required to respond to, a collection of information unless it displays a currently valid OMB control number.  Send comments regarding this burden estimate or any other aspect of this collection of information, including suggestions for reducing this burden, to: NIH, Project Clearance Branch, 6705 Rockledge Drive, MSC 7974, Bethesda, MD 20892-7974, ATTN: PRA (0925-0001).  Do not return the completed form to this address.")
  burdenStatement: {};
}
