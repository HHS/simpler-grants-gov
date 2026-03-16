Feature: 404 page core behavior
  As a visitor
  I want a clear not found page when a route does not exist
  So that I can recover by returning to the homepage

  Background:
    Given I navigate to "/imnothere" with domcontentloaded strategy and environment-aware timeout
    And I allow additional stabilization time in staging

  Scenario: 404 page shows expected title
    Then the page title should be "Oops, we can't find that page."

  Scenario Outline: 404 page shows the homepage recovery link
    Then I should see "<field>" in "<section>"
    And "<field>" in "<section>" should have text "<text_expectation>"

    Examples:
      | selector                                          | value                | type | section            | field               | text_expectation     |
      | getByRole('link', { name: 'Visit our homepage' }) | Visit our homepage   | link | Recovery actions   | Visit our homepage  | Visit our homepage   |

  Scenario: Hybrid data-driven selector/value/type/section/field matrix for 404 page
    Then the 404 expectation matrix should pass:
      | selector                                          | value                           | type         | section           | field                                    |
      | page.title                                        | Oops, we can't find that page.  | title        | Metadata          | 404 document title                       |
      | getByRole('link', { name: 'Visit our homepage' }) | Visit our homepage              | link         | Recovery actions  | Homepage recovery link is visible        |
      | getByRole('link', { name: 'Visit our homepage' }) | Visit our homepage              | text         | Recovery actions  | Homepage recovery link text matches      |
      | page.goto.options.waitUntil                        | domcontentloaded                | navigation   | Routing           | 404 route navigation wait strategy       |
      | page.goto.options.timeout:local                    | 60000                           | timeout-ms   | Routing           | Non-staging navigation timeout           |
      | page.goto.options.timeout:staging                  | 180000                          | timeout-ms   | Routing           | Staging navigation timeout               |
      | page.title.expect.timeout:local                    | 5000                            | timeout-ms   | Assertions        | Non-staging title assertion timeout      |
      | page.title.expect.timeout:staging                  | 30000                           | timeout-ms   | Assertions        | Staging title assertion timeout          |
      | page.waitForTimeout:staging                        | 3000                            | timeout-ms   | Stabilization     | Staging post-navigation stabilization    |
