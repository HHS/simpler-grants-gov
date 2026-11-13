import "form-library-xml";
import "simpler-forms";
import "simpler-forms-sgg";

import "#forms/index.tsp";
import "#questions/types/attachment.tsp";

import "./examples.tsp";
import "./fragments.tsp";

using SimplerForms;

namespace Forms.PerformanceSites;

@Sgg.sync(#{ instructions: "30e2d140-46b8-4fe0-b48c-48a5270ed118" })
@Meta.form(#{
  id: "performance-sites",
  formName: "PROJECT/PERFORMANCE SITE LOCATION(S)",
})
@GrantsGov.form(#{
  legacyFormId: 723,
  shortFormName: "PerformanceSite",
  formVersion: "4.0",
  agencyCode: "SGG",
  ombNumber: "4040-0010",
  expirationDate: "2029-08-31",
})
@example(Examples.individualPrimarySite, Examples.individualPrimarySiteOptions)
@example(Examples.canadianPartner, Examples.canadianPartnerOptions)
@example(Examples.fieldOffice, Examples.fieldOfficeOptions)
model PerformanceSites {
  @UI.label("Primary site")
  primarySite: PrimarySite;

  @doc("Add up to 299 additional project/performance site locations. Each entry has independent answers.")
  @UI.label("Additional site")
  @UI.widget(Rendering.Widget.CollapsibleFieldList)
  @maxItems(299)
  additionalSites?: Site[];

  @doc("Attach a file listing additional locations if more than 299 additional sites are needed.")
  @UI.label("Additional Location(s)")
  @UI.widget(Rendering.Widget.Attachment)
  additionalLocationsAttachment?: Questions.Types.Attachment;
}
