import { random } from "lodash";

// eslint-disable-next-line @typescript-eslint/require-await
async function getOppId(context: { vars: { id: number; ids: Array<number> } }) {
  context.vars.id = context.vars.ids[random(context.vars.ids.length - 1)];
}

// eslint-disable-next-line @typescript-eslint/require-await
async function loadOppIds(context: { vars: { ids: Array<number> } }) {
  context.vars.ids = [1, 2, 3, 4, 5];
}

module.exports = {
  getOppId,
  loadOppIds,
};
