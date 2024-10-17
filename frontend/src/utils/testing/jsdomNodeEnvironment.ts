/**
 * Polyfill fetch globals to test environment
 *
 * https://github.com/jsdom/jsdom/issues/1724#issuecomment-1446858041
 */
import JsDomEnvironment from "jest-environment-jsdom";

export default class JsdomNodeEnvironment extends JsDomEnvironment {
  constructor(...args: ConstructorParameters<typeof JsDomEnvironment>) {
    super(...args);
    this.global.Request = Request;
    this.global.Response = Response;
  }
}
