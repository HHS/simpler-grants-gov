import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.Evidence;

@UI.layout(Evidence)
model EvidenceLayout {
  @UI.label("Level of evidence")
  @doc("1.  Level of Evidence.  Check the box next to the level of evidence for which you are applying.  See the Notice Inviting Applications for the evidence definitions.")
  level: {
    levelOfEvidence: Evidence.levelOfEvidence;
  };

  @UI.field(Evidence.citations)
  @UI.label("Citation and relevance")
  @doc("Fill in the chart below with the appropriate information about the studies that support your application.\n\n1.  Level of Evidence.  Check the box next to the level of evidence for which you are applying.  See the Notice Inviting Applications for the evidence definitions.\n\n2.  Citation and Relevance.  Fill in the chart for each of the studies you are submitting to meet the evidence standards.  If allowable under the program you are applying for, you may add additional rows to include more than four citations.  (See below for an example citation.)\n\na.  Research/Citation.  For Demonstrates a Rationale, provide the citation or link for the research or evaluation findings.  For Promising, Moderate, and Strong Evidence, provide the full citation for each study or WWC publication you are using as evidence.  If the study has been reviewed by the WWC, please include the rating it received, the WWC review standards version, and the URL link to the description of that finding in the WWC reviewed studies database.  Include a copy of the study or a URL link to the study, if available.  Note that, to provide promising, moderate, or strong evidence, you must cite either a specific recommendation from a WWC practice guide, a WWC intervention report, or a publicly available, original study of the effectiveness of a component of your proposed project on a student outcome or other relevant outcome.\n\nb.  Relevant Outcome(s)/Relevant Finding(s). For Demonstrates a Rationale, describe how the research or evaluation findings suggest that the project component included in the logic model is likely to improve relevant outcomes.  For Promising, Moderate and Strong Evidence, describe: 1) the project component included in the study (or WWC practice guide or intervention report) that is also a component of your proposed project, 2) the student outcome(s) or other relevant outcome(s) that are included in both the study (or WWC practice guide or intervention report) and in the logic model (theory of action) for your proposed project, and 3) the study (or WWC intervention report) finding(s) or WWC practice guide recommendations supporting a favorable relationship between a project component and a relevant outcome.  Cite page and table numbers from the study (or WWC practice guide or intervention report), where applicable.\n\nc.  Project Component(s)/Overlap of Population and/or Settings.  For Demonstrates a Rationale, explain how the project component(s) is informed by the research or evaluation findings.  For Promising, Moderate, and Strong Evidence, explain how the population and/or setting in your proposed project are similar to the populations and settings included in the relevant finding(s).  Cite page numbers from the study or WWC publication, where applicable.")
  citations: {
    citation: Citation.citation;
    relevantFindings: Citation.relevantFindings;
    overlapOfPopulations: Citation.overlapOfPopulations;
  };
}
