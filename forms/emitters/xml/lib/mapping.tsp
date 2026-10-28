// The JS that implements the `extern dec` declarations below.
import "../dist/src/index.js";

using TypeSpec.Reflection;

// TODO(agilesix/simpler-forms#21): move to simpler-forms' `lib/mapping.tsp`. Declared here, in simpler-forms'
// namespace, so specs read as they will once simpler-forms ships it.
namespace SimplerForms.Mapping;

/**
 * Declare the value transformations `@Mapping.transform` can name, as `@Mapping.targets`
 * declares the mappings. Each member is one transformation an emitter's runtime implements,
 * with the name it implements it under as its value.
 */
extern dec transforms(target: Namespace, transforms: Enum);

/**
 * Transform this target property's value with `transform` before it is written: a member of
 * an enum declared with `@Mapping.transforms`. `params` are passed to it by name, e.g.
 * `#{ max_length: 60 }` for `truncate_string`.
 */
extern dec transform(
  target: ModelProperty,
  transform: EnumMember,
  params?: valueof Record<unknown>
);
