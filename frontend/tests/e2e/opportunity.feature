Feature: Opportunity page core behavior and outbound navigation
  As a visitor
  I want opportunity details and content toggles to behave consistently
  So that I can review details and navigate to Grants.gov with confidence

  Background:
    Given I am on the Opportunity page for the configured test opportunity ID

  Scenario: Opportunity page has expected browser title pattern
    Then the page title should match regex "^Opportunity Listing - .*"

  Scenario: Opportunity page shows key page attributes
    Then I should see "Application process" in "Application process section"

  Scenario Outline: Content display toggle can expand and collapse in opportunity sections
    Given I can see "<show_field>" in "<section>"
    And "<hide_field>" in "<section>" should not be visible
    And I record the visible div count as "<before_expand_count_key>"
    When I click "<show_field>" in "<section>"
    Then "<show_field>" in "<section>" should not be visible
    And "<hide_field>" in "<section>" should be visible
    And visible div count "<after_expand_count_key>" should be greater than "<before_expand_count_key>"
    When I click "<hide_field>" in "<section>"
    Then "<show_field>" in "<section>" should be visible
    And "<hide_field>" in "<section>" should not be visible
    And visible div count "<after_collapse_count_key>" should be less than "<after_expand_count_key>"

    Examples:
      | selector                                                                                      | value                 | type   | section                      | field                                | show_field             | hide_field             | before_expand_count_key                 | after_expand_count_key                 | after_collapse_count_key                 |
      | div[data-testid='opportunity-description'] div[data-testid='content-display-toggle']          | Show full description | button | Opportunity description      | Opportunity description toggle       | Show full description  | Hide full description  | opportunity-description-before-expand   | opportunity-description-after-expand   | opportunity-description-after-collapse   |
      | div[data-testid='opportunity-status-widget'] div[data-testid='content-display-toggle']        | Show full description | button | Opportunity status widget    | Close date description toggle        | Show full description  | Hide full description  | opportunity-close-date-before-expand    | opportunity-close-date-after-expand    | opportunity-close-date-after-collapse    |

  Scenario Outline: View on Grants.gov opens expected destination in new tab
    Given I can see "<field>" in "<section>"
    When I click "<field>" in "<section>"
    Then a new tab should open
    And the new tab URL should contain "<new_tab_url_contains>"

    Examples:
      | selector                                                  | value               | type   | section             | field                | new_tab_url_contains                              |
      | getByRole('button', { name: 'View on Grants.gov' })      | View on Grants.gov  | button | External navigation | View on Grants.gov   | https://test.grants.gov/search-results-detail/    |

  Scenario: Hybrid data-driven selector/value/type/section/field matrix for opportunity page
    Then the opportunity expectation matrix should pass:
      | selector                                                                                      | value                                           | type          | section                    | field                                                |
      | page.title.regex                                                                              | ^Opportunity Listing - .*                       | title-regex   | Metadata                   | Opportunity document title pattern                   |
      | getByText('Application process')                                                              | Application process                             | text-visible  | Application process        | Application process content                          |
      | div[data-testid='opportunity-description'] div[data-testid='content-display-toggle']          | Show full description                           | button        | Opportunity description    | Description expander show control                    |
      | div[data-testid='opportunity-description'] div[data-testid='content-display-toggle']          | Hide full description                           | button        | Opportunity description    | Description expander hide control                    |
      | divCount.delta:opportunity-description:expand                                                 | greaterThanZero                                 | count-delta   | Opportunity description    | Visible div count increases after expanding          |
      | divCount.delta:opportunity-description:collapse                                               | lessThanZero                                    | count-delta   | Opportunity description    | Visible div count decreases after collapsing         |
      | div[data-testid='opportunity-status-widget'] div[data-testid='content-display-toggle']        | Show full description                           | button        | Opportunity status widget  | Close date expander show control                     |
      | div[data-testid='opportunity-status-widget'] div[data-testid='content-display-toggle']        | Hide full description                           | button        | Opportunity status widget  | Close date expander hide control                     |
      | divCount.delta:opportunity-status-widget:expand                                               | greaterThanZero                                 | count-delta   | Opportunity status widget  | Visible div count increases after close date expand  |
      | divCount.delta:opportunity-status-widget:collapse                                             | lessThanZero                                    | count-delta   | Opportunity status widget  | Visible div count decreases after close date collapse|
      | getByRole('button', { name: 'View on Grants.gov' })                                           | View on Grants.gov                              | button        | External navigation        | Grants.gov outbound button                           |
      | newTab.url.contains                                                                            | https://test.grants.gov/search-results-detail/  | url-contains  | External navigation        | Grants.gov destination URL in opened tab             |
