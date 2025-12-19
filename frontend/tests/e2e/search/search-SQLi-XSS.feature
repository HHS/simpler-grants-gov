@7079
Feature: Open search field secure from SQL Injection (SQLi) and Cross-Site Scripting (XSS) Attack

Background: Navigate to search page after login
    Given I click 'Search' tab

@login @PendingAutomate
Scenario Outline: Verify search result when search with query injection
    When I enter <search parameter> at 'Search' field
    And I click 'Search' button
    Then I see each entry in 'Search Results' section contains <search parameter>
    And I verify if response is <Likely Response>
    And I verify if 403 is expected as <403 Expected?>
    Examples:
        | search parameter                      | Backend / Frontend | Likely Response     | 403 Expected?              | Notes                                                                                | Our result                             |
        | K01'; DROP TABLE users;--             | Backend            | 403 / 400           | ✅ 403 can be expected      | Web application firewall (WAF) may block SQLi attempts                               | Your search didn't return any results. |
        | '; EXEC xp_cmdshell('dir');--         | Backend            | 403 / 400           | ✅ Expected                 | Dangerous OS command, WAF should block                                               | Your search didn't return any results. |
        | ' OR '1'='1                           | Backend            | 200 / 401 / 403     | ⚠ Depends                  | If unauthenticated, 403 can be expected; if logged in, 403 may indicate overblocking | Your search didn't return any results. |
        | ; WAITFOR DELAY '00:00:05'--          | Backend            | 403 / 500           | ✅ 403 safe                 | Delay attempts can trigger WAF throttling                                            | 403 Forbidden                          |
        | <script>alert('XSS')</script>         | Frontend           | 200 + browser alert | ❌ 403 usually not expected | XSS is normally blocked via sanitization, not HTTP code                              | 403 Forbidden                          |
        | %3Cscript%3Ealert('XSS')%3C/script%3E | Frontend           | 200                 | ❌ 403 usually not expected | Encoded scripts should be escaped, not rejected with 403                             | 403 Forbidden                          |
        | ../../../../etc/passwd                | Backend            | 403 / 400           | ✅ Expected                 | Path traversal blocked by server access control                                      | 403 Forbidden                          |
        | %27%20OR%20%271%27%3D%271             | Backend            | 403 / 400           | ✅ Expected                 | Encoded SQLi blocked by WAF                                                          | Your search didn't return any results. |
        | %3Cimg%20src=x%20onerror=alert('XSS')%3E | Frontend        | 200 + browser alert | ❌ 403 usually not expected | Encoded XSS should be escaped, not rejected with 403                                 | 403 Forbidden                          |
