import "simpler-forms";

using SimplerForms;

/** How the question bank is catalogued. Not a JSON Schema namespace, so nothing here is emitted as a schema. */
@Meta.tags(Tag)
@Meta.entities(Entity)
namespace Catalogue;

/** The headings `@Meta.tag` files a question under in the question browser. */
enum Tag {
  address,
  phone,
  email,
  identifier,
  name,
  title,
  person,
  organization,
  details,
  generic,
  money,
  count,
  attachment,
  narrative,
  date,
  role,
}

/** What a question is asked about: the `entity` half of its id. */
enum Entity {
  primaryOrg,
  fiscalSponsor,
  poc,
  principalInvestigator,
  authorizedRepresentative,
  project,
  opportunity,
  application,
  generic,
}
