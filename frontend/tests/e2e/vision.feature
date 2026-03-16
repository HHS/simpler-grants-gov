Feature: Vision page navigation and external links
  As a visitor
  I want the Vision page to present correct metadata and outbound links
  So that I can access related research resources in new tabs

  Background:
    Given I am on the Vision page
    And the page is loaded with domcontentloaded strategy

  Scenario: Vision page has expected title
    Then the page title should be "Vision | Simpler.Grants.gov"

  Scenario Outline: Public wiki link opens in a new tab with expected destination
    Given I can see "<field>" in "<section>"
    When I scroll "<field>" in "<section>" into view
    Then "<field>" in "<section>" should have href "<href_value>"
    When I click "<field>" in "<section>"
    Then a new tab should open
    And the new tab URL should be "<new_tab_url>"

    Examples:
      | selector                                                                           | value                                          | type | section         | field                        | href_value                                                                                       | new_tab_url                                                                                      |
      | getByRole('link', { name: /Read more about the research on our public wiki/i })   | Read more about the research on our public wiki | link | Research links  | Public wiki research link    | https://wiki.simpler.grants.gov/design-and-research/user-research/grants.gov-archetypes        | https://wiki.simpler.grants.gov/design-and-research/user-research/grants.gov-archetypes        |

  Scenario Outline: Ethnio link opens in a new tab with expected destination
    Given I can see "<field>" in "<section>"
    When I scroll "<field>" in "<section>" into view
    Then "<field>" in "<section>" should have href "<href_value>"
    When I click "<field>" in "<section>"
    Then a new tab should open
    And the new tab URL should be "<new_tab_url>"

    Examples:
      | selector                                                                      | value                                         | type | section         | field                         | href_value              | new_tab_url            |
      | getByRole('link', { name: /Sign up to participate in future user studies/i }) | Sign up to participate in future user studies | link | Research links  | Ethnio participation link    | https://ethn.io/91822   | https://ethn.io/91822  |

  Scenario: Hybrid data-driven selector expectation matrix for vision page
    Then the vision expectation matrix should pass:
      | selector                                                                           | value                                                                                             | type    | section            | field                                         |
      | page.title                                                                          | Vision \| Simpler.Grants.gov                                                                          | title   | Metadata           | Vision document title                          |
      | getByRole('link', { name: /Read more about the research on our public wiki/i })   | https://wiki.simpler.grants.gov/design-and-research/user-research/grants.gov-archetypes         | link    | Research links     | Public wiki outbound link href                 |
      | newTab.url:wiki                                                                     | https://wiki.simpler.grants.gov/design-and-research/user-research/grants.gov-archetypes         | url     | External navigation| Public wiki destination in opened tab          |
      | getByRole('link', { name: /Sign up to participate in future user studies/i })      | https://ethn.io/91822                                                                            | link    | Research links     | Ethnio outbound link href                      |
      | newTab.url:ethnio                                                                   | https://ethn.io/91822                                                                            | url     | External navigation| Ethnio destination in opened tab               |
