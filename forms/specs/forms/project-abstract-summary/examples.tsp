import "./form.tsp";

namespace Forms.ProjectAbstractSummary.Examples;

const requiredFields: ProjectAbstractSummary = #{
  fundingOpportunityNumber: "ABC-123",
  applicantName: "My Company LLC",
  projectTitle: "Research into Science",
  projectAbstract: "We plan to do research on science",
};

const allFields: ProjectAbstractSummary = #{
  fundingOpportunityNumber: "XYZ-456",
  assistanceListingNumber: "12.345",
  applicantName: "My Business Inc",
  projectTitle: "Space Exploration",
  projectAbstract: "We are going to Pluto",
};
