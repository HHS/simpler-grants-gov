import { readFile } from "fs/promises";
import { random } from "lodash";

type dataType = {
  ids: Array<number>;
  queries: Array<string>;
  pages: Array<string>;
  status: Array<string>;
  agencies: Array<string>;
  funding: Array<string>;
  eligibility: Array<string>;
  category: Array<string>;
  $environment?: string;
};

type queryType = {
  query: string;
};

// eslint-disable-next-line @typescript-eslint/require-await
async function getOppId(context: { vars: { id: number; ids: Array<number> } }) {
  context.vars.id = context.vars.ids[random(context.vars.ids.length - 1)];
}

// eslint-disable-next-line @typescript-eslint/require-await
async function get404(context: { vars: { route: string } }) {
  const num = random(100);
  // ~50% of 404s are opp pages.
  if (num % 2 !== 0) {
    context.vars.route = `opportunity/${num}`;
  } else {
    context.vars.route = randomString(num);
  }
}

// eslint-disable-next-line @typescript-eslint/require-await
async function getStatic(context: {
  vars: { route: string; pages: Array<string> };
}) {
  context.vars.route =
    context.vars.pages[random(context.vars.pages.length - 1)];
}

// eslint-disable-next-line @typescript-eslint/require-await
async function getSearchQuery(context: { vars: queryType & dataType }) {
  const { queries, status, agencies, eligibility, category } = context.vars;
  const qu = `query=${queries[random(queries.length - 1)]}`;
  const st = `status=${status[random(status.length - 1)]}`;
  const ag = `agency=${agencies[random(agencies.length - 1)]}`;
  const cat = `category=${category[random(category.length - 1)]}`;
  const el = `eligibility=${eligibility[random(eligibility.length - 1)]}`;
  const pager = `page=${random(5)}`;
  // Most search params only include the queries, but smaller percent include
  // filters. This allows configuring that percent for composing the query.
  const weights = [
    {
      percent: 50,
      params: [qu, st, pager],
    },
    {
      percent: 20,
      params: [qu, st, ag],
    },
    {
      percent: 20,
      params: [qu, st, ag, cat],
    },
    {
      percent: 10,
      params: [qu, st, ag, cat, el],
    },
  ];
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

async function loadData(context: { vars: dataType }) {
  const env = context.vars.$environment;
  const envs = new Set(["local", "dev", "prod"]);
  if (!env || !envs.has(env)) {
    throw new Error(`env ${env ?? ""} does not exist in env list`);
  }
  const path = "./tests/artillery/params.json";
  const file = await readFile(path, "utf8");
  const {
    ids,
    pages,
    queries,
    agencies,
    status,
    eligibility,
    funding,
    category,
  } = JSON.parse(file);
  context.vars = {
    ids: ids[env],
    pages,
    queries,
    status,
    agencies,
    eligibility,
    funding,
    category,
  };
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
