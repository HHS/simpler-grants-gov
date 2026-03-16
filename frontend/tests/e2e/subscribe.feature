Feature: Newsletter subscription page behavior
  As a visitor
  I want to interact with the newsletter form reliably
  So that title, validation, success, and error behaviors are covered

  Background:
    Given I am on the newsletter page
    And POST requests to newsletter are stubbed with a plain-text 200 response

  Scenario: Newsletter page has expected title
    Then the page title should match "Subscribe | Simpler.Grants.gov"

  Scenario: Client-side required-field errors appear when submitting empty form
    When I click "Subscribe" in "Form actions"
    Then I should see 2 error messages in "Form errors"
    And I should see "Please enter a name." in "Form errors"
    And I should see "Please enter an email address." in "Form errors"

  Scenario Outline: Successful signup with valid required fields
    When I fill "<field>" in "<section>" with "<value>"
    And I fill "<field_2>" in "<section_2>" with "<value_2>"
    And I click "Subscribe" in "Form actions"
    Then I should see "Subscribed" heading in "Confirmation"

    Examples:
      | selector                                | value             | type  | section           | field                 | field_2             | section_2         | value_2          |
      | getByLabel('First Name (required)')     | Apple             | input | Subscriber details | First Name (required) | Email (required)    | Subscriber details | name@example.com |

  Scenario Outline: Error message appears when backend reports subscription failure
    Given newsletter subscribe API is configured to return "<api_response_text>"
    When I fill "<field>" in "<section>" with "<value>"
    And I fill "<field_2>" in "<section_2>" with "<value_2>"
    And I click "Subscribe" in "Form actions"
    Then I should see 1 error message in "Form errors"
    And I should see "An error occurred when trying to save your subscription." in "Form errors"

    Examples:
      | selector                                | value             | type  | section           | field                 | field_2             | section_2         | value_2          | api_response_text        |
      | getByLabel('First Name (required)')     | Apple             | input | Subscriber details | First Name (required) | Email (required)    | Subscriber details | name@example.com | Error with subscribing   |

  Scenario: Hybrid data-driven selector expectation matrix for subscribe page
    Then the subscribe expectation matrix should pass:
      | selector                                                                      | value                                                        | type    | section            | field                                            |
      | page.title                                                                    | Subscribe \| Simpler.Grants.gov                                   | title   | Metadata           | Newsletter page title                            |
      | getByRole('button', { name: /subscribe/i })                                  | Subscribe                                                    | button  | Form actions       | Subscribe submit button                          |
      | getByLabel('First Name (required)')                                           | Apple                                                        | input   | Subscriber details | First Name (required)                            |
      | getByLabel('Email (required)')                                                | name@example.com                                             | input   | Subscriber details | Email (required)                                 |
      | getByTestId('errorMessage')                                                   | 2                                                            | count   | Form errors        | Required-field error count (empty submit)        |
      | getByText('Please enter a name.')                                             | Please enter a name.                                         | text    | Form errors        | Required first-name validation                    |
      | getByText('Please enter an email address.')                                   | Please enter an email address.                               | text    | Form errors        | Required email validation                         |
      | getByRole('heading', { name: /subscribed/i })                                 | Subscribed                                                   | heading | Confirmation       | Successful subscription heading                   |
      | getByText(/an error occurred when trying to save your subscription./i)        | An error occurred when trying to save your subscription.     | text    | Form errors        | Failed subscription server error                  |
