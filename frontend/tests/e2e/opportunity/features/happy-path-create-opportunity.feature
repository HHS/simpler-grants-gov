# @feature Opportunity - Happy Path
# @featureFile e2e/opportunity/features/happy-path-create-opportunity.feature
# @scenario Happy Path - Create Opportunity

Feature: Opportunity happy path create and publish
  As a grantor user
  I want to create and complete an opportunity draft
  So that I can publish the opportunity

  @GRANTOR
  Scenario: Happy path create opportunity
    Given I am authenticated as a grantor user
    And I am on the Opportunities List page for my agency
    When I click "Create Opportunity"
    And I enter a generated value in "Opportunity number"
    And I enter "Test opportunity title" in "Opportunity title"
    And I select "Discretionary" in "Grant selection method"
    And I enter "00.000" in "Assistance listing number"
    And I click "Save and continue"
    Then I should be on the edit page for the created opportunity

    When I update funding details
    
    And I select "Grant" in "Funding type"
    And I select "Recovery Act" in "Category"
    And I enter "10" in "Expected number of awards"
    And I enter "1000000" in "Estimated total program funding"
    And I enter "50000" in "Award minimum"
    And I enter "100000" in "Award maximum"
    And I enter today in "Publish date"
    And I enter today plus 30 days in "Close date"

    And I select "Small businesses"
    And I select "Other Native American tribal organizations"
    And I select "Independent school districts"
    And I select "Individuals"
    And I select "State governments"

    And I update additional information
    And I enter "Additional - Test opportunity description" in "Description"
    And I enter "https://www.example.com/additional-info" in "Link to additional information"
    And I enter "Additional Info" in "Link display text"
    And I enter "Test grantor contact details" in "Grantor contact details"
    And I enter "test@example.com" in "Contact email"
    And I enter "Contact Email" in "Email display text"

    And I click "Save"
    Then I should see save confirmation

    When I click "Publish"
    Then I should be on the Opportunities List page
    And I should see "posted" in the "Status" column of the opportunities list table