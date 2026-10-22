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
   * Whether to install the form's XML transform rules, so the API can write its
   * submission XML. Defaults to true. Set it to false while the rules cannot produce a
   * valid document yet, e.g. when they leave out required elements.
   */
  xml?: boolean;

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
