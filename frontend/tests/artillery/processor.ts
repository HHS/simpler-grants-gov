import { random } from "lodash";


async function getOppId(context: { vars: { id: number } }) {
  console.log(context.vars.ids.length)
  context.vars.id = context.vars.ids[random(context.vars.ids.length-1)]

}

async function loadOppIds(context: { vars: { ids: Array<number>} }) {

  context.vars.ids = [1,2,3,4,5];
  console.log('this is loaded!')
}

module.exports = {
  getOppId,
  loadOppIds
};