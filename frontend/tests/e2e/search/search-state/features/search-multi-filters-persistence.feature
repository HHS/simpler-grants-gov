/**
* @featureArea Search
* @feature Search State Persistence
* @specFile e2e/search/search-state/specs/search-state-persistence.spec.ts
* @description Validates persistence of multiple filters after page refresh
*/
 
Feature: Search page - state persistence after refresh
  As a grantee searching for opportunities
  I want my search filters and inputs to be preserved in the URL
  So that I can refresh the page and return to the same search state
 
Background:
  Given I am on the search page
  And the search results have loaded
 
/* @tags GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION */
Scenario: Retain all filters and inputs after refresh
  When I enter "<search-term>" in the search input and submit in "<viewport>"
  And I <sort access action>
  And I select sort order "<sort label>"
  And I <filter drawer action>

  And agency filter options have loaded
 
  And the "Opportunity status" accordion is expanded
  And I check the "<status>" status checkbox
 
  And the "Funding instrument" accordion is expanded
  And I check the "<funding instrument>" funding instrument checkbox
 
  And the "Eligibility" accordion is expanded
  And I check the "<eligibility>" eligibility checkbox
 
  And the "Agency" accordion is expanded
  And I check the first available non-numeric agency checkbox
 
  And the "Category" accordion is expanded
  And I check the "<category>" category checkbox
 
  When I refresh the page
 
  Then the search results load
  And the filter drawer is open
  And the search input should contain "<search-term>"
  And the sort order should be "<sort label>"
 
  And the "<status>" status checkbox should be checked
  And the "<funding instrument>" funding instrument checkbox should be checked
  And the "<eligibility>" eligibility checkbox should be checked
  And the previously selected agency checkbox should be checked
  And the "<category>" category checkbox should be checked

  Then the URL should reflect the accumulated query parameters for the selected filters
 
  And the browser URL contains "query=<search-term>"
  And the browser URL contains "sortby=<sort value>"
  And the browser URL contains query param "status" with values "<status values>"
  And the browser URL contains query param "fundingInstrument" with values "<funding value>"
  And the browser URL contains query param "eligibility" with values "<eligibility value>"
  And the browser URL contains query param "agency"
  And the browser URL contains query param "category" with values "<category value>"
 
Examples:
  | viewport | sort access action      | filter drawer action        |
  | mobile   | open the filter drawer  | keep the filter drawer open |
  | desktop  | close the filter drawer | open the filter drawer      |

  | search-term  | sort label                 | sort value        |
  | education    | Award Ceiling (Descending) | awardCeilingDesc  |
  
  | status | status values            | funding instrument | funding value |
  | Closed | forecasted,posted,closed | Grant              | grant         |
  
  | eligibility         | eligibility value     | category     | category value |
  | County Governments  | county_governments    | Agriculture  | agriculture    |

 
/* @tags GRANTEE, OPPORTUNITY_SEARCH, FULL_REGRESSION */
Scenario: Retain all multi-value filters and inputs after refresh
  When I enter "<search-term>" in the search input and submit in "<viewport>"
  And I <sort access action>
  And I select sort order "<sort label>"
  And I <filter drawer action>

  And agency filter options have loaded
 
  And the "Opportunity status" accordion is expanded
  And I check the "<status>" status checkbox
 
  And the "Funding instrument" accordion is expanded
  And I check the "<funding instrument 1>" funding instrument checkbox
  And I check the "<funding instrument 2>" funding instrument checkbox
 
  And the "Eligibility" accordion is expanded
  And I check the "<eligibility 1>" eligibility checkbox
  And I check the "<eligibility 2>" eligibility checkbox
 
  And the "Agency" accordion is expanded
  And I check the first available non-numeric agency checkbox
 
  And the "Category" accordion is expanded
  And I check the "<category 1>" category checkbox
  And I check the "<category 2>" category checkbox
 
  When I refresh the page
 
  Then the search results load
  And the filter drawer is open
  And the search input should contain "<search-term>"
  And the sort order should be "<sort label>"
 
  And the "<status>" status checkbox should be checked
  And the "<funding instrument 1>" funding instrument checkbox should be checked
  And the "<funding instrument 2>" funding instrument checkbox should be checked
  And the "<eligibility 1>" eligibility checkbox should be checked
  And the "<eligibility 2>" eligibility checkbox should be checked
  And the previously selected agency checkbox should be checked
  And the "<category 1>" category checkbox should be checked
  And the "<category 2>" category checkbox should be checked

  Then the URL should reflect the accumulated query parameters for the selected filters
  
  And the browser URL contains "query=<search-term>"
  And the browser URL contains "sortby=<sort value>"
  And the browser URL contains query param "status" with values "<status values>"
  And the browser URL contains query param "fundingInstrument" with values "<funding values>"
  And the browser URL contains query param "eligibility" with values "<eligibility values>"
  And the browser URL contains query param "agency" with the selected agency value
  And the browser URL contains query param "category" with values "<category values>"
 
Examples:
  | viewport | sort access action      | filter drawer action        |
  | mobile   | open the filter drawer  | keep the filter drawer open |
  | desktop  | close the filter drawer | open the filter drawer      |

  | search-term  | sort label                 | sort value        | status | status values            |
  | education    | Award Ceiling (Descending) | awardCeilingDesc  | closed | closed,forecasted,posted |

  | funding instrument 1 | funding instrument 2 | funding values |
  | grant                | other                | grant,other    |

  | eligibility 1        | eligibility 2       | eligibility values                   |
  | county_governments   | state_governments   | county_governments,state_governments |
  
  | category 1  | category 2     | category values             |
  | agriculture | recovery_act   | agriculture,recovery_act    |
   