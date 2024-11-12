import { readFile } from "fs/promises";
import { random } from "lodash";

type dataType = {
  ids: {
    [key: string]: Array<number>;
  };
  queries: Array<string>;
  pages: Array<string>;
  status: Array<string>;
  agencies: Array<string>;
  funding: Array<string>;
  eligibility: Array<string>;
  category: Array<string>;
};
type globalVars = {
  $environment?: string;
};

type returnVars = {
  id: number;
  query: string;
  route: string;
  pages: string;
};

// eslint-disable-next-line @typescript-eslint/require-await
async function getOppId(context: { vars: dataType & returnVars & globalVars }) {
  const env = context.vars.$environment as string;
  context.vars.id =
    context.vars.ids[env][random(context.vars.ids[env].length - 1)];
}

// eslint-disable-next-line @typescript-eslint/require-await
async function get404(context: { vars: returnVars }) {
  const num = random(10);
  // ~50% of 404s are opp pages.
  if (num % 2 !== 0) {
    context.vars.route = `opportunity/${num}`;
  } else {
    context.vars.route = randomString(num);
  }
}

// eslint-disable-next-line @typescript-eslint/require-await
async function getStatic(context: { vars: returnVars }) {
  context.vars.route =
    context.vars.pages[random(context.vars.pages.length - 1)];
}

// eslint-disable-next-line @typescript-eslint/require-await
async function getSearchQuery(context: { vars: returnVars & dataType }) {
  const { queries, status, agencies, eligibility, category } = context.vars;
  const queryParam = `query=${queries[random(queries.length - 1)]}`;
  const statusParam = `status=${status[random(status.length - 1)]}`;
  const agencyParam = `agency=${agencies[random(agencies.length - 1)]}`;
  const categoryParam = `category=${category[random(category.length - 1)]}`;
  const eligibilityParam = `eligibility=${eligibility[random(eligibility.length - 1)]}`;
  const pagerParam = `page=${random(5)}`;
  // Most search params only include the queries, but smaller percent include
  // filters. This allows configuring that percent for composing the query
  const weights = [
    {
      percent: 50,
      params: [queryParam, statusParam, pagerParam],
    },
    {
      percent: 20,
      params: [queryParam, statusParam, agencyParam],
    },
    {
      percent: 20,
      params: [queryParam, statusParam, agencyParam, categoryParam],
    },
    {
      percent: 10,
      params: [queryParam, statusParam, agencyParam, categoryParam, eligibility],
    },
  ];
  // Weight of percents out of 100
  const hundred = random(100);
  let total = 0;
  const selected = weights.find((item) => {
    total += item.percent;
    if (hundred <= total) {
      return true;
    }
    return false;
  });
  context.vars.query = selected?.params.join("&") as string;
}

async function loadData(context: { vars: dataType & globalVars }) {
  // Dev and stage have the same data.
  const env =
    context.vars.$environment === "stage" ? "dev" : context.vars.$environment;
  const envs = new Set(["local", "dev", "prod"]);
  if (!env || !envs.has(env)) {
    throw new Error(`env ${env ?? ""} does not exist in env list`);
  }
  const path = "./tests/artillery/params.json";
  const file = await readFile(path, "utf8");
  context.vars = JSON.parse(file) as dataType;
}

function randomString(length: number) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = " ";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(random(charactersLength)));
  }
  return result;
}

module.exports = {
  loadData,
  getOppId,
  get404,
  getStatic,
  getSearchQuery,
};
