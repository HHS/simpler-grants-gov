# Internationalization (i18n)

- [next-intl](https://next-intl-docs.vercel.app) is used for internationalization. Toggling between languages is done by changing the URL's path prefix (e.g. `/about` ➡️ `/es-US/about`).
- Configuration is located in [`i18n/config.ts`](../frontend/src/i18n/config.ts). For the most part, you shouldn't need to edit this file unless adding a new formatter or new language.

## Managing translations

- Translations are managed as files in the [`i18n/messages`](../frontend/src/i18n/messages/) directory, where each language has its own directory (e.g. `en-US` and `es-US`).
- How you organize translations is up to you, but here are some suggestions:
  - Group your messages. It's recommended to use component/page names as namespaces and embrace them as the primary unit of organization in your app.
  - By default, all messages are in a single file, but you can split them into multiple files if you prefer. Continue to export all messages from `i18n/messages/{locale}/index.ts` so that they can be imported from a single location, and so files that depend on the messages don't need to be updated.
- There are a number of built-in formatters based on [JS's `Intl` API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) that can be used in locale strings, and custom formatters can be added as well. [See the formatting docs for details](https://next-intl-docs.vercel.app/docs/usage/numbers).
- If a string's translation is missing in another language, the default language (English) will be used as a fallback.

### Type-safe translations

The app is configured to report errors if you attempt to reference an i18n key path that doesn't exist in a locale file.

[Learn more about using TypeScript with next-intl](https://next-intl-docs.vercel.app/docs/workflows/typescript).

## Load translations

Locale messages should only ever be loaded on the server-side, to avoid bloating the client-side bundle. If a client component needs to access translations, only the messages required by that component should be passed into it.

[See the Internationalization of Server & Client Components docs](https://next-intl-docs.vercel.app/docs/environments/server-client-components) for more details.

## Add a new language

1. Add a language folder, using the same BCP47 language tag: `mkdir -p src/i18n/messages/<lang>`
1. Add a language file: `touch src/i18n/messages/<lang>/index.ts` and add the translated content. The JSON structure should be the same across languages. However, non-default languages can omit keys, in which case the default language will be used as a fallback.
1. Update [`i18n/config.ts`](../../app/src/i18n/config.ts) to include the new language in the `locales` array.

## Structuring your messages

In terms of best practices, [it is recommended](https://next-intl-docs.vercel.app/docs/usage/messages#structuring-messages) to structure your messages such that they correspond to the component that will be using them. You can nest these definitions arbitrarily deep if you have a particularly complex need.

It is always preferable to structure messages per their usage rather than due to some side effect of a technological implementation. The idea is to group them semantically but also preserve maximum flexibility for a translator. For instance, splitting up a paragraph in order to separate out a link might lead to awkward translation, so it is best to keep it as a single message. The info below shows techniques for common needs that prevent unnecessary splits of content.

### Variables

Messages do not need to be split in order to incorporate dynamic data. Instead, these can be inserted via the [interpolation functionality](https://next-intl-docs.vercel.app/docs/usage/messages#interpolation-of-dynamic-values):

```json
"message": "Hello {name}!"
```

```tsx
t("message", { name: "Jane" }); // "Hello Jane!"
```

### Rich text messages

If your app needs a particular chunk of content to contain something other than plain text (such as links, formatting, or a custom component), you can utilize the "rich text" functionality ([see docs](https://next-intl-docs.vercel.app/docs/usage/messages#rich-text)). This allows one to embed arbitrary custom tags into the translation content strings and specify how each of those should be handled.

Example from their docs:

```json
{
  "message": "Please refer to <guidelines>the guidelines</guidelines>."
}
```

```tsx
// Returns `<>Please refer to <a href="/guidelines">the guidelines</a>.</>`
t.rich("message", {
  guidelines: (chunks) => <a href="/guidelines">{chunks}</a>,
});
```

If you have something that you are going to use repeatedly throughout your app, you can specify it in the [`defaultTranslationValues` config](https://next-intl-docs.vercel.app/docs/usage/configuration#default-translation-values).

### Other needs

For examples of other functionality such as pluralization, arrays of content, etc, please [see the docs](https://next-intl-docs.vercel.app/docs/usage/messages).
