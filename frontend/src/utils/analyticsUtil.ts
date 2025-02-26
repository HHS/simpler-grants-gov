// // note that the `newrelic` referenced here is the newrelic object added to window when
// // client side new relic scripts are loaded and run, rather than anything explicity imported
// type NewRelicBrowser = typeof newrelic;

// const getNewRelicBrowserInstance = (): NewRelicBrowser | null => {
//   return window && window.newRelic
//     ? (window.newRelic as NewRelicBrowser)
//     : null;
// };

// const setNewRelicCustomAttribute = (key: string, value: string): undefined => {
//   const newRelic = getNewRelicBrowserInstance();
//   if (!newRelic) {
//     return;
//   }
//   newRelic.setCustomAttribute(key, value);
// };

// // TODO does setting "" as the value effectively `unset` the attribute?
// const unsetNewRelicCustomAttribute = (key: string) => {
//   setNewRelicCustomAttribute(key, "");
// };
