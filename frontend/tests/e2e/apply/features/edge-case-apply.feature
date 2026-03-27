Feature: Apply Workflow Edge Cases

#  Audit and Create Plan for priority E2E tests needed for Simpler Apply workflow #6146
  
  ###########################################################################
    # Edge Case 1: Browser or network issues
  ###########################################################################
  Scenario: Apply shell partially loads due to slow network
    Given I select "Start Application"
    When the Apply shell loads partially or times out
    Then I should see an error message or retry option
    And the system should not allow submission until fully loaded
    
  ###########################################################################
  # Edge Case 2: Invalid input formats
  ###########################################################################
  Scenario: Entering unexpected data types in required fields
    Given I am filling out required fields
    When I enter special characters, HTML, or very long strings
    Then the system should validate and show appropriate errors
    And prevent incorrect submission
    
  ###########################################################################
   # Edge Case 3: Page refresh at critical moments at save
  ###########################################################################
  Scenario: Refreshing page during save
    Given I have completed all required fields
    And I click to save
    When I refresh the page while saving
    Then my entered data should persist
