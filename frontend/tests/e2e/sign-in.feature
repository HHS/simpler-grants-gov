Feature: Sign in flow using mock OAuth
  As a visitor
  I want to sign in successfully from the homepage
  So that authenticated navigation and identity display are confirmed

  Background:
    Given I am on the homepage "/"

  Scenario Outline: User can complete sign in and return to homepage
    Given I can see "<field>" in "<section>"
    And "<field>" in "<section>" has text "<value>"
    When I click "<field>" in "<section>"
    And I click "<modal_field>" in "<modal_section>"
    And I enter a generated username into "<username_field>" in "<auth_section>"
    And I submit "<submit_field>" in "<auth_section>"
    Then the URL should be "<post_login_url>"
    And I should see "<email_expectation>" in "<identity_section>" for "<device_profile>"

    Examples:
      | selector                                   | value   | type   | section           | field           | modal_section | modal_field          | auth_section | username_field   | submit_field       | post_login_url           | email_expectation   | identity_section  | device_profile |
      | button[data-testid='sign-in-button']       | Sign in | button | Header navigation | Sign in button  | Sign-in modal | Continue sign in CTA | OAuth screen | Username input   | Username submit    | http://localhost:3000/   | fake_mail@mail.com  | User menu         | desktop        |
      | button[data-testid='sign-in-button']       | Sign in | button | Header navigation | Sign in button  | Sign-in modal | Continue sign in CTA | OAuth screen | Username input   | Username submit    | http://localhost:3000/   | fake_mail@mail.com  | User menu         | mobile         |

  Scenario: Hybrid data-driven selector expectation matrix for sign in
    Then the sign-in expectation matrix should pass:
      | selector                                                   | value                  | type   | section            | field                                |
      | button[data-testid='sign-in-button']                       | Sign in                | button | Header navigation  | Primary sign-in button               |
      | .usa-modal__footer a                                       | Continue sign in       | link   | Sign-in modal      | Secondary sign-in link               |
      | input[type='text']                                         | generated username     | input  | OAuth screen       | Username text input                  |
      | input[type='submit']                                       | Submit                 | submit | OAuth screen       | Username submit control              |
      | current.url                                                | http://localhost:3000/ | url    | Browser state      | Post-auth redirect URL               |
      | button[data-testid='navDropDownButton'] a div              | fake_mail@mail.com     | text   | User menu desktop  | Signed-in email display (desktop)    |
      | #user-control > li:first-child a div                       | fake_mail@mail.com     | text   | User menu mobile   | Signed-in email display (mobile)     |
