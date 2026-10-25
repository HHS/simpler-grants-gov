import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.IRSTCE14204;
@UI.layout(IRSTCEChecklist)
model IRSTCEChecklistLayout {
  @UI.label("Contact Information")
  @doc("Form 14204 \n(March 2019)\n\nDepartment of the Treasury - Internal Revenue Service\n\nTax Counseling for the Elderly (TCE) Program Application Checklist and Contact Sheet\n\nOMB Number: 1545-2222\nExpiration Date: 08/31/2028\n\nContact Information")
  section0: {
    contactInformation: IRSTCEChecklist.contactInformation;
  };

  @UI.label("Administrative Information") section1: {
    administrativeInformation: IRSTCEChecklist.administrativeInformation;
  };

  @UI.label("Application Checklist and Assembly")
  @doc("Application Checklist and Assembly\n\nAll documents requiring a signature must contain either an electronic signature or scanned copy of the original signature. Make sure you double check that you have all documents and information required. Technical ranking occurs simultaneously with the Grant Program Office (GPO) evaluation. Any missing information identified by the GPO during its evaluation may not be considered by technical evaluators depending on when the review is completed. It is the responsibility of the applicant to ensure all information is submitted. Incomplete applications meeting basic eligibility will be scored based on the information available at time of review. Therefore, it is extremely important that the submission is complete.\n\nChecklist:\n\nApplication Due Date: May 31st\n\nIRS Volunteer Income Tax Preparation and Outreach Programs Privacy and Paperwork Reduction Act Notice  Privacy and Paperwork Reduction Act Notice - The Privacy Act of 1974 requires that when we ask for information we tell you our legal right to ask for the information, why we are asking for it, and how it will be used. We must also tell you what could happen if we do not receive it, and whether your response is voluntary, required to obtain a benefit, or mandatory. Our legal right to ask for information is 5 U.S.C. 301. The Paperwork Reduction Act requires that the IRS display an OMB control number on all public information requests. The OMB Control Number for this study is 1545-2222. The time estimated for participation is 10 minutes. We are asking for this information to assist us in contacting you relative to your interest and/or participation in the IRS volunteer income tax preparation and outreach programs. The information you provide may be furnished to others who coordinate activities and staffing at volunteer return preparation sites or outreach activities. The information may also be used to establish effective controls, send correspondence and recognize volunteers. Your response is voluntary. However, if you do not provide the requested information, the IRS may not be able to use your assistance in these programs.")
  section2: {
    applicationChecklist: IRSTCEChecklist.applicationChecklist;
  };
}
