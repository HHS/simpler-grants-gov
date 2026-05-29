
# Feature: Opportunity - Happy Path
# Related spec: e2e/opportunity/specs/happy-path-create-opportunity.spec.ts
# Scenario: Happy Path - Create Opportunity
#
# ============== Notes for reviewer =================================================
# - The name of the edit page is dynamic.
# - The status in the opportunities list may not update immediately after publishing; you may see "Draft" instead of "posted".
# - Use today's date and today's date plus 30 days for publish/close date fields.
# - I would request to update status "posted" to be "Posted"
# ===================================================================================

Feature: Opportunity happy path create and publish
	As a grantor user
	I want to create and complete an opportunity draft
	So that I can publish the opportunity

	@GRANTOR
	Scenario: Happy path create opportunity
		Given I am authenticated as a grantor user
		And I use direct URL "/opportunity" to navigate to the "Opportunities List" page
		And I should be on the "Opportunities List" page

		When I click "Create Opportunity"
		And I enter a generated value in "Opportunity number"
		And I enter "Test Opportunity title" in "Opportunity title"
		And I select "Discretionary" in "Grant selection method"
		And I enter "00.000" in "Assistance listing number"
		And I click "Save and continue" button
		Then I should be on the Opportunity edit page

		And I update "Funding details" section 
		And I select "Grant" in "Funding type"
		And I select "Recovery Act" in "Category"
		And I enter "10" in "Expected number of awards"
		And I enter "1000000" in "Estimated total program funding"
		And I enter "50000" in "Award minimum"
		And I enter "100000" in "Award maximum"
		And I enter <today date> in "Publish date"
		And I enter <today + 30 days> in "Close date"

		And I update "Eligibility" section
		And I select "Small businesses"
		And I select "Other Native American tribal organizations"
		And I select "Independent school districts"
		And I select "Individuals"
		And I select "State governments"

		And I update "Additional information" section
		And I enter "Additional - Test opportunity description" in "Description"
		And I enter "https://www.example.com/additional-info" in "Link to additional information"
		And I enter "Additional Info" in "Link display text"
		And I enter "Test grantor contact details" in "Grantor contact details"
		And I enter "test@example.com" in "Contact email"
		And I enter "Contact Email" in "Email display text"

		When I click "Save" button
		Then I should see save confirmation

		When I select "Cooperative Agreement" in "Funding type"
		And I click "Publish" button
		Then I should be on the "Opportunities List" page
		And I should see "posted" in the "Status" column of the opportunities list table
