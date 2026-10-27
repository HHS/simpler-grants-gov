// The JS that implements the `extern dec` declarations below. Imported here rather than
// only from an entry point so that this file type-checks on its own -- an editor opens
// one file, and an unimplemented `extern dec` is an error.
import "../dist/src/index.js";
import "simpler-forms";
import "form-library-xml";

using TypeSpec.Reflection;

namespace SimplerForms.Sgg;

/** How sync installs a form. */
model SyncOptions {
  /**
   * Whether, and in which format, to install how the form's submission XML is built:
   *
   *   - `"transform"` (or `true`, the default): `xml_transform.json`, rules keyed by the
   *     response's properties;
   *   - `"mapping"`: `xml_mapping.json`, a mapping shaped like the XML;
   *   - `false`: neither, while the form can't produce a valid document yet, e.g. when its
   *     mapping leaves out required elements.
   */
  xml?: boolean | "transform" | "mapping";

  /**
   * The form's version in Simpler Grants, which the API reports as its legacy form version.
   * Defaults to `1.0`, where every form starts.
   */
  sggVersion?: string;

  /**
   * The UUID of the form's instructions: a form instruction record in the API, uploaded to
   * each environment with the API's `update-form-instruction` task. Without it, the form has
   * no instructions to download.
   */
  instructions?: string;
}

/**
 * Install this form into the API tree when `npm run sync` runs.
 *
 * Opt in rather than opt out: a form without it still compiles and still emits its
 * artifacts, but sync leaves it out of `api/src/form_schema/forms/`. A specification can
 * then be worked on in the tree without registering it anywhere. The form also needs
 * `@GrantsGov.form`, the identity the API registers it under.
 */
extern dec sync(target: Model, options?: valueof SyncOptions);

/**
 * This question's answer is the id of one of the application's uploads. The API checks
 * each one still belongs to the application, with a `gg_validation` attachment rule in the
 * form's rule schema.
 */
extern dec attachment(target: Scalar);
