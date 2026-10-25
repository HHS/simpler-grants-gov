import "#questions/index.tsp";

namespace Questions.Types;

// GlobalLibrary-V2.0.xsd YesNoDataType. This shares source choice vocabulary,
// not the semantic identity or applicant answer of the questions using it.
@doc("Yes or No, using the source's encoded values. An unanswered optional question remains absent.")
enum YesNo {
  yes: "Y: Yes",
  no: "N: No",
}
