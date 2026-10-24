import "simpler-forms";
import "./form.tsp";
using SimplerForms;
namespace Forms.NSFDeviationAuthorization;

@UI.layout(NSFDeviationAuthorization)
model NSFDeviationAuthorizationLayout {
  @UI.label("Deviation authorization (if applicable)")
  @doc("Enter text for the Deviation Authorization information in the box below (if applicable):")
  authorization: {
    deviationAuthorization: NSFDeviationAuthorization.deviationAuthorization;
  };
}
