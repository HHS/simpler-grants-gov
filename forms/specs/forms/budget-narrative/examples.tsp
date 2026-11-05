import "./form.tsp";

namespace Forms.BudgetNarrative.Examples;

/** One required budget narrative file. */
const oneFile: BudgetNarrative = #{
  attachments: #["00b9001b-6ca8-4c0c-9328-46f39e9ff14b"],
};

/** Two files, in the order they will be written. */
const twoFiles: BudgetNarrative = #{
  attachments: #[
    "00b9001b-6ca8-4c0c-9328-46f39e9ff14b",
    "c8eebbcc-a6ec-4b20-9bfa-e6bcc5abb6d5"
  ],
};
