import "#forms/sf424-r-r/examples.tsp";

import "./form.tsp";

namespace Forms.SF424ResearchMultiProject.Examples;

// =============================================================================
// FORM EXAMPLES
// =============================================================================

// Every element is optional, so an untouched form is valid.
const empty: MultiProjectCover = #{};

// A component of a multi-project application, with only the answers it needs.
const component: MultiProjectCover = #{
  application: #{
    submissionType: Forms.SF424Research.ResearchSubmissionType.Application,
    applicationType: Forms.SF424Research.ResearchApplicationType.New,
  },
  project: #{
    title: "Core B: Canopy Imaging",
    timeline: #{
      startDate: Questions.Projects.ProjectStartDate.fromISO("2027-01-01"),
    },
  },
  contacts: #{
    projectDirector: #{
      name: #{ lastName: "Tran" },
      email: "avery.tran@example.org",
    },
  },
  budget: #{ fundingSources: #{ federal: "250000.00" } },
};

// Every answer R&R's corrected revision gives.
const revision: MultiProjectCover = Forms.SF424Research.Examples.revision;
