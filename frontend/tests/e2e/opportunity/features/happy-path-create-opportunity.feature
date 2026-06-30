# Feature: Opportunity - Happy Path
# Related spec: e2e/opportunity/specs/happy-path-create-opportunity.spec.ts
# Scenario: Happy Path - Create Opportunity
#
# ============== Notes for reviewer =================================================
# - The name of the edit page is dynamic.
# - The status in the opportunities list may not update immediately after publishing; you may see "Draft" instead of "Posted".
# - Use today's date and today's date plus 30 days for publish/close date fields.
# - Requested update: status assertion should use "Posted".
# ===================================================================================

Feature: Opportunity happy path create and publish
	As a grantor user
	I want to create and complete an opportunity draft
	So that I can publish the opportunity

	@GRANTOR
	Scenario: Happy path create opportunity
		Given I am authenticated as a grantor user
		And I use direct URL "/grantor/opportunities" to navigate to the "Opportunities List" page
		And I should be on the "Opportunities List" page

		When I click "Create Opportunity"
		And I should be on the "Create Opportunity" page
		And I enter the following values
			| Page Name               | Label                     | Field Type | Value                      |
			| Create Opportunity page | Opportunity number        | text       | Opp-mm-dd-yyyy-hh-mm-sec   |
			| Create Opportunity page | Opportunity title         | text       | Title-mm-dd-yyyy-hh-mm-sec |
			| Create Opportunity page | Grant selection method    | select     | Discretionary              |
			| Create Opportunity page | Assistance listing number | text       | 00.000                     |
		And I click "Save and continue" button
		Then I should be on the "Opportunity Overview" page
		And the URL should include "fromCreate=true"
		And I should see "Opportunity draft started" confirmation message
		and I click "Opportunity Summary"
		Then I should be on the "Edit Opportunity" page
		And the "Save" button should be enabled
		And the "Publish" button should be disabled
		And the "Preview" button should be disabled

		When I update "Funding details" section
		And I enter the following values
			| Page Name             | Label                           | Field Type | Value             |
			| Opportunity edit page | Funding type                    | select     | Grant             |
			| Opportunity edit page | Category                        | select     | Recovery Act      |
			| Opportunity edit page | Expected number of awards       | text       | 10                |
			| Opportunity edit page | Estimated total program funding | text       | 1000000           |
			| Opportunity edit page | Award minimum                   | text       | 50000             |
			| Opportunity edit page | Award maximum                   | text       | 100000            |
			| Opportunity edit page | Publish date                    | date       | <today date>      |
			| Opportunity edit page | Close date                      | date       | <today + 30 days> |

		And I update "Eligibility" section
		And I enter the following values
			| Page Name             | Label               | Field Type | Value                                      |
			| Opportunity edit page | Eligible applicants | checkbox   | Small businesses                           |
			| Opportunity edit page | Eligible applicants | checkbox   | Other Native American tribal organizations |
			| Opportunity edit page | Eligible applicants | checkbox   | Independent school districts               |
			| Opportunity edit page | Eligible applicants | checkbox   | Individuals                                |
			| Opportunity edit page | Eligible applicants | checkbox   | State governments                          |

		And I update "Additional information" section
		And I enter the following values
			| Page Name             | Label                          | Field Type | Value                                      |
			| Opportunity edit page | Description                    | textarea   | Additional - Test opportunity description  |
			| Opportunity edit page | Link to additional information | text       | https://www.example.com/additional-info    |
			| Opportunity edit page | Link display text              | text       | Additional Info                            |
			| Opportunity edit page | Grantor contact details        | textarea   | Test grantor contact details               |
			| Opportunity edit page | Contact email                  | email      | test@example.com                           |
			| Opportunity edit page | Email display text             | text       | Contact Email                              |

		And I click "Save" button
		Then I should see "Opportunity draft started" confirmation message
		And I should see the following values
			| Page Name             | Label                        | Field Type | Value                                                                                     |
			| Opportunity edit page | Save confirmation message    | text       | Your initial information has been saved. Complete the sections below to finish your opportunity details |
			| Opportunity edit page | Opportunity status           | text       | Draft                                                                                     |
			| Opportunity edit page | Opportunity title            | text       | Title-mm-dd-yyyy-hh-mm-sec                                                                |
			| Opportunity edit page | Opportunity number           | text       | Opp-mm-dd-yyyy-hh-mm-sec                                                                  |
			| Opportunity edit page | Grant selection method       | select     | Discretionary                                                                             |

		And the URL should include "fromCreate=true"
		And the "Save" button should be enabled
		And the "Publish" button should be enabled
		And the "Preview" button should be disabled

		When I select "Select" in "Funding type"
		And the "Save" button should be enabled
		And the "Publish" button should be disabled
		And the "Preview" button should be disabled

		When I select "Cooperative Agreement" in "Funding type"
		And the "Save" button should be enabled
		And the "Publish" button should be enabled
		And the "Preview" button should be disabled
        
		And I click "Publish" button
		Then I should be on the "Opportunities List" page
		And I should see "posted" status in the "Status" column for "Title-mm-dd-yyyy-hh-mm-sec"
		And I should not see "Edit", "Copy", "Delete" under Actions column for "Title-mm-dd-yyyy-hh-mm-sec"

		When I click on "Title-mm-dd-yyyy-hh-mm-sec"
		Then I should be on the "Title-mm-dd-yyyy-hh-mm-sec" page
		And I should see the following values
			| Page Name                | Label                           | Field Type | Value                                      |
			| Opportunity details page | Opportunity title               | text       | Title-mm-dd-yyyy-hh-mm-sec                |
			| Opportunity details page | Funding opportunity number      | text       | Opp-mm-dd-yyyy-hh-mm-sec                  |
			| Opportunity details page | Assistance Listings:            | text       | 00.000 -- Test ALN                         |
			| Opportunity details page | Funding instrument type         | select     | Cooperative agreement                      |
			| Opportunity details page | Opportunity Category            | select     | Discretionary                              |
			| Opportunity details page | Category of Funding Activity    | select     | Recovery act                               |
			| Opportunity details page | Expected awards                 | text       | 10                                         |
			| Opportunity details page | Award Minimum                   | currency   | $50,000                                    |
			| Opportunity details page | Award Maximum                   | currency   | $100,000                                   |
			| Opportunity details page | Program Funding                 | currency   | $1,000,000                                 |
			| Opportunity details page | Eligible applicants             | checkbox   | Small businesses                           |
			| Opportunity details page | Eligible applicants             | checkbox   | Other Native American tribal organizations |
			| Opportunity details page | Eligible applicants             | checkbox   | Independent school districts               |
			| Opportunity details page | Eligible applicants             | checkbox   | Individuals                                |
			| Opportunity details page | Eligible applicants             | checkbox   | State governments                          |
			| Opportunity details page | Description                     | textarea   | Additional - Test opportunity description  |
			| Opportunity details page | Link display text               | text       | Additional Info                            |
			| Opportunity details page | Grantor contact details         | textarea   | Test grantor contact details               |
			| Opportunity details page | Contact email                   | email      | test@example.com                           |
			| Opportunity details page | Email display text              | text       | Contact Email                              |

		And I verify the opportunity visibility on search results page after publishing
		