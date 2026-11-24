import "simpler-forms";
import "./form.tsp";

using SimplerForms;

namespace Forms.NSFDeviationAuthorization;

@UI.layout(NSFDeviationAuthorization)
model NSFDeviationAuthorizationLayout {
  /**
   * Enter text for the Deviation Authorization information in the box below (if applicable):
   */
  @UI.label("Deviation authorization (if applicable)")
  authorization: {
    deviationAuthorization: NSFDeviationAuthorization.deviationAuthorization;
  };
}
