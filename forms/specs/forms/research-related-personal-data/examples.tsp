import "./form.tsp";
namespace Forms.RRPersonalData.Examples;
const threeDirectors: PersonalData = #{
  projectDirector: #{
    name: #{ firstName: "Casey", lastName: "Example" },
    race: #[Race.asian],
  },
  coProjectDirector: #[
    #{
      name: #{ firstName: "Alex", lastName: "Example" },
      race: #[Race.white],
    },
    #{
      name: #{ firstName: "Robin", lastName: "Example" },
      race: #[Race.doNotWishToProvide],
    }
  ],
};
