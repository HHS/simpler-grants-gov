import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.ACHSF3881;
@UI.layout(ACHEnrollment)
model ACHEnrollmentLayout {
  @UI.label("Agency information")
  @doc("ACH VENDOR/MISCELLANEOUS PAYMENT ENROLLMENT FORM\n\nOMB Number: 1530-0069\n\nExpiration Date: 08/31/2025\n\nThis form is used for Automated Clearing House (ACH) payments with an addendum record that contains payment-related information processed through the Vendor Express Program.  Recipients of these payments should bring this information to the attention of their financial institution when presenting this form for completion.  See reverse for additional instructions.\n\nPRIVACY ACT STATEMENT\n\nThe following information is provided to comply with the Privacy Act of 1974 (P.L. 93-579).  All information collected on this form is required under the provisions of 31 U.S.C. 3322 and 31 CFR 210.  This information will be used by the Treasury Department to transmit payment data, by electronic means to vendor's financial institution.  Failure to provide the requested information may delay or prevent the receipt of payments through the Automated Clearing House Payment System.\n\nAGENCY INFORMATION")
  section0: {
    agency: ACHEnrollment.agency;
  };

  @UI.label("Payee/company information") section1: {
    payee: ACHEnrollment.payee;
  };
  @UI.label("Financial institution information") section2: {
    financialInstitution: ACHEnrollment.financialInstitution;
  };
}
