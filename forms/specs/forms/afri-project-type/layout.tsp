import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.AfriProjectType;

// The headings below group the one answer model; they do not add answer objects.
@UI.layout(AfriProjectType)
model AfriProjectTypeLayout {
  @doc("Who completes this form:  Each project director (PD) applying to the Agriculture and Food Research Initiative (AFRI) Request for Applications (RFA).\nHow this template is completed:\n   •  Select the appropriate Project Type box and Grant Type box(es) (For FASE Grants, select an appropriate sub-category).\n\nPublic Burden Statement: \n\nAccording to the Paperwork Reduction Act of 1995, an agency may not conduct or sponsor, and a person is not required to respond to a collection of information unless it displays a valid OMB control number. The valid OMB control number for this information collection is 0524-0039. The time required to complete this information collection is estimated to average 10 minutes per response, including the time for reviewing instructions, searching existing data sources, gathering and maintaining the data needed, and completing and reviewing the collection of information.\n\nResearch: Select this option for fundamental or mission-linked research that is conducted by individual investigators and/or co-investigators within the same discipline, or multidisciplinary teams.\n\nEducation: Select this option for applications that involve education activities.\n\nExtension: Select this option for applications that involve extension activities.\n\nIntegrated: Select this option for applications that may involve any combination of research, education, and extension activities, with the provision that every project must include at least two of the three stated components.")
  @UI.label("Choose the project type")
  project: {
    projectType: AfriProjectType.projectType;
  };

  @UI.label("Choose the grant type")
  grant: {
    @UI.flatten
    @UI.field(AfriProjectType.grant)
    grant: {
      @doc("Standard: Select this option for fundamental or mission-linked project that is conducted by individual investigators and/or co-investigators within the same discipline, or multidisciplinary teams.\n\nCoordinated Agricultural Project (CAP): Select this option for fundamental or mission-linked project that is conducted by multiple institutions.\n\nPlanning / Coordination: Select this option only if the program area priority specifically calls for this type of grant in preparation for submitting a Coordinated Agricultural Project grant application in a future year.\n\nConference: Select this option for scientific meetings that bring together scientists to identify research needs, update information, or advance an area of research.\n\nFood and Agriculture Science Enhancement (FASE): Select this option for awards that are designed to help institutions develop competitive research programs and to attract new scientists into careers in high-priority areas of national need in agriculture, food, and environmental sciences. See full funding opportunity for specific details.\n\nOther: Select this option for grant types that are not listed on the form.")
      @UI.label("Grant Type guidance")
      @UI.widget(Rendering.Widget.SectionHelp)
      typeGuidance: {
        type: Grant.type;
      };

      @doc("Predoctoral Fellowship: Select this option for research awards to individuals who will soon receive their doctoral degree. These applications may be submitted either directly by the individual or through the mentor's institution. See funding opportunity for details. \n\nPostdoctoral Fellowship: Select this option for research awards to individuals who will soon receive their doctoral degree. These applications may be submitted either directly by the individual or through the mentor's institution. See funding opportunity for details.\n\nNew Investigator Seed: Select this option for awards to provide funds to enable new investigators to collect preliminary data in preparation for applying for a Standard Research Grant. A new investigator is one who is beginning his/her research career, does not have an extensive research publication record, and has less than five years postgraduate, career-track research experience. The new investigator may not have received competitively awarded Federal research funds beyond pre- or postdoctoral research awards. \n\nNew Investigator Standard: A new investigator is one who is beginning his/her research career, does not have an extensive research publication record, and has less than five years postgraduate, career-track research experience. The new investigator may not have received competitively awarded Federal research funds beyond pre- or postdoctoral research awards or an AFRI seed grant. \n\nStrengthening: Select this option for Strengthening Awards consisting of Sabbatical, Equipment, Seed, Strengthening Standard and Strengthening CAP. ")
      @UI.label("FASE Type guidance")
      @UI.widget(Rendering.Widget.SectionHelp)
      faseTypeGuidance: {
        faseType: Grant.faseType;
      };

      @doc("Sabbatical: Select this option for funds that will be designated for sabbatical grants to strengthen the research capacity of institutions. \n\nEquipment: Select this option for funds that will be designated for equipment grants to strengthen the research capacity of institutions. Only degree-granting institutions that are not among the most successful universities and colleges for receiving Federal funds for science and engineering research may apply.\n\nNew Investigator Strengthening Seed: Select this option if you are elgible for both a new investigator seed grant and a strengthening seed grant. These awards  provide funds to enable new investigators to collect preliminary data in preparation for applying for a Standard Research Grant. These awards will be limited to new investigators who are faculty with appointments at small and mid-sized degree-granting institutions that have had limited institutional success and to faculty with appointments at degree-granting institutions eligible for USDA-EPSCoR funding. See the full funding opportunity for the definition of USDA EPSCoR and small and mid-sized institutions.\n\nNew Investigator Strengthening Standard: Select this option if you are elgible for both a new investigator standard grant and a strengthening standard grant. These awards will be limited to new investigators who are faculty with appointments at small and mid-sized degree-granting institutions that have had limited institutional success and to faculty with appointments at degree-granting institutions eligible for USDA-EPSCoR funding. See the full funding opportunity for the definition of USDA EPSCoR and small and mid-sized institutions.\n\nStrengthening Seed: Select this option for awards to provide funds to enable investigators to collect preliminary data in preparation for applying for a Standard Research Grant. These awards will be limited to faculty with appointments at small and mid-sized degree-granting institutions that have had limited institutional success and to faculty with appointments at degree-granting institutions eligible for USDA-EPSCoR funding. See the full funding opportunity for the definition of USDA EPSCoR and small and mid-sized institutions.\n\nStrengthening Standard: Select this option for a standard research project, limited to faculty with appointments at small and mid-sized degree-granting institutions that have had limited institutional success and to faculty with appointments at degree-granting institutions eligible for USDA-EPSCoR funding. See the full funding opportunity for the definition of USDA EPSCoR and small and mid-sized institutions.\n\nStrengthening CAP: Select this option for a standard multi-institutional project, limited to faculty with appointments at small and mid-sized degree-granting institutions that have had limited institutional success and to faculty with appointments at degree-granting institutions eligible for USDA-EPSCoR funding. See the full funding opportunity for the definition of USDA EPSCoR and small and mid-sized institutions.\n\nStrengthening Conference: Select this option for scientific meetings that bring together scientists to identify research needs, update information, or advance an area of research.")
      @UI.label("Strengthening Type guidance")
      @UI.widget(Rendering.Widget.SectionHelp)
      strengtheningTypeGuidance: {
        strengtheningType: Grant.strengtheningType;
      };

      otherDescription: Grant.otherDescription;
    };
  };
}
