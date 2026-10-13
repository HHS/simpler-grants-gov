import "simpler-forms";

using SimplerForms;

/** The other representations a form is mapped to. Not a JSON Schema namespace, so nothing here is emitted as a schema. */
@Mapping.targets(Target)
namespace Mappings;

/** Each member is one mapping, written by the emitter `tspconfig.yaml` configures with it. */
enum Target {
  /** The XML Grants.gov's XSDs describe, written by `form-library-xml` as XML transform rules. */
  grantsGovXml,
}
