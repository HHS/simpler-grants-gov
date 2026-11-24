import "./form.tsp";

namespace Forms.Phs398CareerDevelopmentAwardSupplemental.Examples;

const minimum = #{
  researchStrategy: "00000000-0000-4000-8000-000000079901",
  isUsCitizenOrNational: true,
};

const temporaryVisa = #{
  researchStrategy: "00000000-0000-4000-8000-000000079901",
  appendix: #[
    "00000000-0000-4000-8000-000000079902",
    "00000000-0000-4000-8000-000000079903"
  ],
  isUsCitizenOrNational: false,
  nonUsCitizenshipStatus: NonUsCitizenshipStatus.temporaryVisa,
  permanentResidentByAward: true,
};
