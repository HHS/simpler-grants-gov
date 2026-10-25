import "form-library-xml";
import "simpler-forms";
import "#forms/index.tsp";
import "#questions/person/index.tsp";
import "#questions/organization/index.tsp";
import "#questions/types/address.tsp";
import "#questions/types/yes-no.tsp";
import "./form.tsp";
using SimplerForms;
namespace Forms.IRS14335;
@UI.layout(IRS14335)
model IRS14335Layout {
  @UI.label("Recipient and operating schedule")
  @doc("Supplied organization/address context is readonly. Enter days and hours of operation.")
  recipient: {
    organizationName: IRS14335.organizationName;
    federalAwardIdentifier: IRS14335.federalAwardIdentifier;
    organizationAddress: IRS14335.organizationAddress;
    daysOperation: IRS14335.daysOperation;
    hoursOperation: IRS14335.hoursOperation;
  };

  @UI.label("Primary Contact Information") primaryContactSection: {
    @UI.flatten primaryContact: IRS14335.primaryContact;
  };
  @UI.label("Alternate Contact Information") alternateContactSection: {
    @UI.flatten alternateContact: IRS14335.alternateContact;
  };

  @UI.label("Authorized Organization Representative Information")
  authorizedRepresentativeSection: {
    @UI.flatten authorizedRepresentative: IRS14335.authorizedRepresentative;
  };

  @UI.label("Federal Tax Matters Contact Information")
  federalTaxMattersContactSection: {
    @UI.flatten federalTaxMattersContact: IRS14335.federalTaxMattersContact;
  };

  @UI.label("Financial/PMS Contact Information") financialPmsContactSection: {
    @UI.flatten financialPmsContact: IRS14335.financialPmsContact;
  };
  @UI.label("Other Contact 1") otherContact1Section: {
    @UI.flatten @UI.field(IRS14335.otherContact1) otherContact1: {
      role: IRS14335OtherContact.role;
      name: IRS14335OtherContact.name;
      title: IRS14335OtherContact.title;
      phone: IRS14335OtherContact.phone;
      cellPhone: IRS14335OtherContact.cellPhone;
      email: IRS14335OtherContact.email;

      // Absent/null source object hides this UI-only permission group. Any entered
      // descendant materializes the source object; the answer contract stays unchanged.
      @UI.hiddenWhen(IRS14335.otherContact1, null)
      @UI.label("Sharing permission")
      permission: {
        shareContact: IRS14335OtherContact.shareContact;
      };
    };
  };
  @UI.label("Other Contact 2") otherContact2Section: {
    @UI.flatten @UI.field(IRS14335.otherContact2) otherContact2: {
      role: IRS14335OtherContact.role;
      name: IRS14335OtherContact.name;
      title: IRS14335OtherContact.title;
      phone: IRS14335OtherContact.phone;
      cellPhone: IRS14335OtherContact.cellPhone;
      email: IRS14335OtherContact.email;

      // Absent/null source object hides this UI-only permission group. Any entered
      // descendant materializes the source object; the answer contract stays unchanged.
      @UI.hiddenWhen(IRS14335.otherContact2, null)
      @UI.label("Sharing permission")
      permission: {
        shareContact: IRS14335OtherContact.shareContact;
      };
    };
  };
  @UI.label("Other Contact 3") otherContact3Section: {
    @UI.flatten @UI.field(IRS14335.otherContact3) otherContact3: {
      role: IRS14335OtherContact.role;
      name: IRS14335OtherContact.name;
      title: IRS14335OtherContact.title;
      phone: IRS14335OtherContact.phone;
      cellPhone: IRS14335OtherContact.cellPhone;
      email: IRS14335OtherContact.email;

      // Absent/null source object hides this UI-only permission group. Any entered
      // descendant materializes the source object; the answer contract stays unchanged.
      @UI.hiddenWhen(IRS14335.otherContact3, null)
      @UI.label("Sharing permission")
      permission: {
        shareContact: IRS14335OtherContact.shareContact;
      };
    };
  };

  @UI.label("Instructions and definitions")
  @doc("Instructions for Form 14335, Contact Information for VITA and TCE Grant Programs\n\nInstructions: List those individuals that we may contact with questions concerning your grant. Refer to the following definitions. Designate only one primary contact. Designate at least one alternate contact. We are asked occasionally to share contact information with other grant recipients and non-grant recipients involved or interested in the VITA or TCE program. Please indicate whether we may share your information.\n\nDefinitions:\n\n1. Primary — Manages the day-to-day operations of your organization's program and is responsible for ensuring its requirements are met.\n\n2. Alternate — Knowledgeable of the grant and its requirements and assists or directs the primary contact.\n\n3. Authorized Organization Representative — Authorized to act for the organization and to assume the obligations imposed by the Federal laws, regulations, requirements, and conditions that apply to grant applications or grant awards.\n\n4. Federal tax matters — Authorized to discuss your organization's federal tax matters with IRS. This individual is only contacted when questions arise concerning your organization's filing of its federal returns or paying of federal taxes, penalties or interest.\n\n5. Financial/PMS — Responsible for the financial aspects of the grant. This includes responsibility for requesting disbursement and required reporting in the Payment Management System.\n\n6. Other — Provides assistance in the absence of those designated a role or that share responsibility for a role. Please explain their\nrole in the space provided.\n\nPrivacy and Paperwork Reduction Act Notice\n\nThe Privacy Act of 1974 requires that when we ask for information we tell you our legal right to ask for the information, why we are asking for it, and how it will be used. We must also tell you what could happen if we do not receive it, and whether your response is voluntary, required to obtain a benefit, or mandatory. Our legal right to ask for information is 5 U.S.C. 301. The Paperwork Reduction Act requires that the IRS display an OMB control number on all public information requests. The OMB Control Number for this study is 1545-2222. The time estimated for participation is 30 minutes. We are asking for this information to assist us in contacting you relative to your interest and/or participation in the IRS volunteer income tax preparation and outreach programs. The information you provide may be furnished to others who coordinate activities and staffing at volunteer return preparation sites or outreach activities. The information may also be used to establish effective controls, send correspondence and recognize volunteers. Your response is voluntary. However, if you do not provide the requested information, the IRS may not be able to use your assistance in these programs.\n\nCatalog Number 59717U\n\nwww.irs.gov\n\nForm 14335 (Rev. 3-2022)")
  instructions: {};
}
