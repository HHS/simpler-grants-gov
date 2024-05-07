/**
 * @file Setup type safe message keys with `next-intl`
 * @see https://next-intl-docs.vercel.app/docs/workflows/typescript
 */
type Messages = typeof import("src/i18n/messages/en").messages;
type IntlMessages = Messages;
