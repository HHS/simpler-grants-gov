// The JS that implements the `extern dec` declarations below.
import "../dist/src/index.js";
import "./mapping.tsp";

using TypeSpec.Reflection;

/**
 * What Grants.gov knows a form by, and what its XML transform rules need about an XSD
 * TypeSpec model that `@typespec/xml` does not say.
 */
namespace GrantsGov;

/** The URL of the XSD this root element is declared in. */
extern dec xsd(target: Model, url: valueof string);

/**
 * Grants.gov's identity for a form: what it is listed and versioned as. Goes on the model
 * with `@Meta.form`.
 */
extern dec form(target: Model, identity: valueof FormIdentity);

/**
 * This scalar is an attached file (`att:AttachedFileDataType`): the response holds the
 * upload's id, and the file's name, type, location and hash are written from the upload.
 */
extern dec attachment(target: Scalar);

/** How Grants.gov identifies a form. */
model FormIdentity {
  /** The form's ID in Grants.gov's legacy forms (the FID). */
  legacyFormId?: int32;

  /** The form's short name, e.g. `Key_Contacts`. Also the XSD's root element. */
  shortFormName: string;

  /** The form's version, e.g. `2.0`. Also the root element's `FormVersion`. */
  formVersion: string;

  agencyCode?: string;
  ombNumber?: string;

  /** When the OMB approval for `ombNumber` expires, as an ISO 8601 date, e.g. `2029-08-31`. */
  expirationDate?: string;
}
