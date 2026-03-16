Feature: Roadmap page core behavior
  As a visitor
  I want the roadmap page to provide expected navigation and outbound link behavior
  So that I can trust core roadmap interactions across devices

  Background:
    Given I am on the Roadmap page

  Scenario: Roadmap page has the expected browser title
    Then the page title should be "Roadmap | Simpler.Grants.gov"

  Scenario Outline: Return to top works after scrolling to the bottom
    Given I am using "<device_profile>"
    When I scroll to the bottom of the page using "<scroll_strategy>"
    And I click "<field>" in "<section>"
    Then "<field>" in "<section>" should not be in the viewport
    And "<target_field>" in "<target_section>" should be in the viewport

    Examples:
      | device_profile | scroll_strategy      | selector                                             | value                 | type | section        | field          | target_section | target_field     |
      | desktop/tablet | scrollIntoViewIfNeed | getByRole('link', { name: /return to top/i })      | Return to top         | link | Footer utility | Return to top  | Hero            | Product roadmap  |
      | mobile-safari  | windowScrollToBottom | getByRole('link', { name: /return to top/i })      | Return to top         | link | Footer utility | Return to top  | Hero            | Product roadmap  |

  Scenario Outline: View all deliverables on Github opens in a new tab
    When I click "<field>" in "<section>"
    Then I should remain on the Roadmap page with title matching "<current_page_expectation>"
    And a popup tab should open
    And the popup URL should be "<popup_expectation>"

    Examples:
      | selector                                                       | value                           | type | section            | field                           | current_page_expectation       | popup_expectation                             |
      | getByRole('link', { name: 'View all deliverables on Github' }) | View all deliverables on Github | link | Roadmap deliverable | View all deliverables on Github | Roadmap \| Simpler.Grants.gov | https://github.com/orgs/HHS/projects/12/views/8 |

  Scenario: Hybrid data-driven assertion matrix for roadmap selectors
    Then the roadmap expectation matrix should pass:
      | selector                                                       | value                           | type    | section             | field                            |
      | page                                                           | Roadmap \| Simpler.Grants.gov  | title   | Metadata            | Document title                   |
      | getByRole('link', { name: /return to top/i })                 | Return to top                   | link    | Footer utility      | Return to top link               |
      | getByRole('heading', { name: 'Product roadmap' })             | Product roadmap                 | heading | Hero                | Product roadmap heading          |
      | getByRole('link', { name: 'View all deliverables on Github' }) | View all deliverables on Github | link    | Roadmap deliverable | Github deliverables link         |
      | popup.url                                                      | https://github.com/orgs/HHS/projects/12/views/8 | url     | External navigation | Github project destination       |
