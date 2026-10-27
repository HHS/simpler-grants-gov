import "@typespec/xml";
import "form-library-xml";

/** Attachments-V1.0.xsd */
namespace XSD.Att;

/**
 * `att:AttachedFileDataType`: one attached file. Its FileName, MimeType, FileLocation and
 * HashValue are written from the upload, not answered, so it is modeled as one value.
 */
@GrantsGov.attachment
scalar AttachedFileDataType extends string;
