@7079
Feature: "and / or" search term switch

# Summary
# "And / or" search term verb switch is untested in e2e suite

# Acceptance criteria
# Test(s) written which:

# ensure proper functionality of "and / or" switch in UI / url when search term is entered
# ensure proper functionality of "and / or" switch in UI / url when search term is not entered (should not change anything)

Background: Navigate to search page after login
    Given I click 'Search' tab

@login @PendingAutomate
Scenario: Verify the URL of the search page
    Then I see 'url'
        |url|
        |/search|

@login @PendingAutomate
Scenario: Verify the search defaults to AND condition
    Then I see 'search-verb-switch' selected
        |search-verb-switch|
        |Must include all words (ex. transportation AND safety)|

@login @PendingAutomate
Scenario: Verify no search term entered when switching from AND to OR
    When I clear 'Search' field
    And I click 'Search' button
    Then I see 'url'
        |url|
        |/search|
    And I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    Then I see 'url'
        |url|
        |/search|
    And I select 'Must include all words (ex. transportation AND safety)' at 'search-verb-switch'
    Then I see 'url'
        |url|
        |/search|

@login @PendingAutomate
Scenario: Verify the URL when switching the selection from AND to OR
    When I enter 'ti' at 'Search' field
    Then I see 'url'
        |url|
        |/search|
    And I click 'Search' button
    And I see 'url'
        |url|
        |/search?query=ti|
    And I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    And I see 'url'
        |url|
        |/search?query=ti&andOr=OR|
    And I select 'Must include all words (ex. transportation AND safety)' at 'search-verb-switch'
    And I see 'url'
        |url|
        |/search?query=ti&andOr=AND|

@login @PendingAutomate
Scenario: Verify the URL when switching the selection from OR to AND
    When I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    Then I see 'url'
        |url|
        |/search|
    And I enter 'ti' at 'Search' field
    And I click 'Search' button
    And I see 'url'
        |url|
        |/search?andOr=OR&query=ti|
    And I select 'Must include all words (ex. transportation AND safety)' at 'search-verb-switch'
    And I see 'url'
        |url|
        |/search?andOr=AND&query=ti|
    And I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    And I see 'url'
        |url|
        |/search?andOr=OR&query=ti|

@login @PendingAutomate
Scenario: Verify single search results when switching from AND to OR
    When I enter 'ti' at 'Search' field
    And I click 'Search' button
    Then I see each entry in 'Search Results' section contains 'ti'
    And I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    Then I see each entry in 'Search Results' section contains 'ti'
    And I select 'Must include all words (ex. transportation AND safety)' at 'search-verb-switch'
    Then I see each entry in 'Search Results' section contains 'ti'

@login @PendingAutomate
Scenario: Verify multiple search results when switching from AND to OR
    When I enter 'Research Scientist' at 'Search' field
    And I click 'Search' button
    Then I see each entry in 'Search Results' section contains 'Research' AND 'Scientist'
    And I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    Then I see each entry in 'Search Results' section contains 'Research' OR 'Scientist'
    And I select 'Must include all words (ex. transportation AND safety)' at 'search-verb-switch'
    Then I see each entry in 'Search Results' section contains 'Research' AND 'Scientist'

@login @PendingAutomate
Scenario: Verify single search results when switching from OR to AND
    When I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    And I enter 'ti' at 'Search' field
    And I click 'Search' button
    Then I see each entry in 'Search Results' section contains 'ti'
    And I select 'Must include all words (ex. transportation AND safety)' at 'search-verb-switch'
    Then I see each entry in 'Search Results' section contains 'ti'
    And I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    Then I see each entry in 'Search Results' section contains 'ti'

@login @PendingAutomate
Scenario: Verify multiple search results when switching from OR to AND
    When I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    And I enter 'Research Scientist' at 'Search' field
    And I click 'Search' button
    Then I see each entry in 'Search Results' section contains 'Research' OR 'Scientist'
    And I select 'Must include all words (ex. transportation AND safety)' at 'search-verb-switch'
    Then I see each entry in 'Search Results' section contains 'Research' AND 'Scientist'
    And I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    Then I see each entry in 'Search Results' section contains 'Research' OR 'Scientist'

@login @PendingAutomate
Scenario: Verify search verb switch persistence after page reload
    When I enter 'Research Scientist' at 'Search' field
    And I click 'Search' button
    And I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    And I reload the page
    Then I see 'search-verb-switch' selected
        |search-verb-switch|
        |May include any words (ex. transportation OR safety)|
    And I see each entry in 'Search Results' section contains 'Research' OR 'Scientist'
    And I select 'Must include all words (ex. transportation AND safety)' at 'search-verb-switch'
    And I reload the page
    Then I see 'search-verb-switch' selected
        |search-verb-switch|
        |Must include all words (ex. transportation AND safety)|
    And I see each entry in 'Search Results' section contains 'Research' AND 'Scientist'

@login @PendingAutomate
Scenario: Verify search verb switch persistence after navigating away and back  
    When I enter 'Research Scientist' at 'Search' field
    And I click 'Search' button
    And I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    And I click 'Home' tab
    And I click 'Search' tab
    Then I see 'search-verb-switch' selected
        |search-verb-switch|
        |May include any words (ex. transportation OR safety)|
    And I see each entry in 'Search Results' section contains 'Research' OR 'Scientist'
    And I select 'Must include all words (ex. transportation AND safety)' at 'search-verb-switch'
    And I click 'Home' tab
    And I click 'Search' tab
    Then I see 'search-verb-switch' selected
        |search-verb-switch|
        |Must include all words (ex. transportation AND safety)|
    And I see each entry in 'Search Results' section contains 'Research' AND 'Scientist' 

@login @PendingAutomate
Scenario: Verify search result count when switching from AND to OR
    When I enter 'K01 Mentored Research Scientist' at 'Search' field
    And I click 'Search' button
    And I see '9' at 'Search Results' section
        | results           |
        | 9                 |
    And I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    And I see '15' at 'Search Results' section
        | results           |
        | 15                |
    And I select 'Must include all words (ex. transportation AND safety)' at 'search-verb-switch'
    And I see '9' at 'Search Results' section
        | results           |
        | 9                 |

@login @PendingAutomate
Scenario: Verify search result count when switching from OR to AND
    When I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    And I enter 'K01 Mentored Research Scientist' at 'Search' field
    And I click 'Search' button
    And I see '15' at 'Search Results' section
        | results           |
        | 15                |
    And I select 'Must include all words (ex. transportation AND safety)' at 'search-verb-switch'
    And I see '9' at 'Search Results' section
        | results           |
        | 9                 |
    And I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    And I see '15' at 'Search Results' section
        | results           |
        | 15                |

@login @PendingAutomate
Scenario: Verify search result count remains the same when no search term entered
    When I clear 'Search' field
    And I click 'Search' button
    And I see '1000+' at 'Search Results' section
        | results           |
        | 1000+             |
    And I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    And I see '1000+' at 'Search Results' section
        | results           |
        | 1000+             |
    And I select 'Must include all words (ex. transportation AND safety)' at 'search-verb-switch'
    And I see '1000+' at 'Search Results' section
        | results           |
        | 1000+             |

@login @PendingAutomate
Scenario Outline: Verify search result when search with arithmetic operators when switching from AND to OR
    When I enter <search parameter> at 'Search' field
    And I click 'Search' button
    Then I see each entry in 'Search Results' section contains <search parameter>
    And I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    Then I see each entry in 'Search Results' section contains <search parameter>
    And I select 'Must include all words (ex. transportation AND safety)' at 'search-verb-switch'
    Then I see each entry in 'Search Results' section contains <search parameter>
    Examples:
        | search parameter |
        | 1000            |
        | 1000+1          |
        | 1000-1          |
        |1000*2           |
        |1000/2           |
        |(1000+1)/2       |
        |1000%3           |
        |1000^2           |
        |sqrt(1000)      |
        |log(1000)        |
        |ln(1000)         |
        |exp(5)           |
        |abs(-1000)       |
        |ceil(1000.4)    |
        |floor(1000.6)   |
        |round(1000.5)   |
        |trunc(1000.9)    |
        |sign(-1000)       |
        |max(1000,2000)   |
        |min(1000,2000)   |
        |pow(10,3)        |
        |mod(1000,3)      |
        |random(1,1000)   |
        |randint(1,1000)  |
        |gcd(1000,250)     |
        |lcm(1000,250)     |
        |factorial(5)     |
        |fibonacci(10)    |
        |prime(29)        |
        |isprime(29)      |
        |nextprime(29)    |
        |prevprime(29)    | 
        |euler(10)        |
        |catalan(5)       |
        |bell(5)          |
        |triangular(5)    |
        |hex(255)         |
        |bin(10)          |
        |oct(10)          |
        |deg(3.14)        | 
        |rad(180)         |
        |sin(30)          |
        |cos(60)          |
        |tan(45)          |
        |asin(0.5)       |
        |acos(0.5)       |
        |atan(1)          |
        |atan2(1,1)      |
        |sinh(1)         |
        |cosh(1)         |  
        |tanh(1)         |
        |asinh(1)        |
        |acosh(2)        |
        |atanh(0.5)      |
        |deg2rad(180)     |
        |rad2deg(3.14)    |
        |hypot(3,4)       |
        |log10(1000)     |
        |log2(1024)      |
        |cbrt(27)         |
        |expm1(1)        |
        |log1p(9)        |
        |erf(1)           |
        |erfc(1)          |
        |gamma(5)         |
        |lgamma(120)      |
        |digamma(5)       |
        |trigamma(5)      |
        |zeta(2)          |
        |besselj(0,1)    |

@login @PendingAutomate
Scenario Outline: Verify search result when search with arithmetic operators when switching from OR to AND
    When I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    And I enter <search parameter> at 'Search' field
    And I click 'Search' button
    Then I see each entry in 'Search Results' section contains <search parameter>
    And I select 'Must include all words (ex. transportation AND safety)' at 'search-verb-switch'
    Then I see each entry in 'Search Results' section contains <search parameter>
    And I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    Then I see each entry in 'Search Results' section contains <search parameter>
    Examples:
    | search parameter |
        | 1000            |
        | 1000+1          |
        | 1000-1          |
        |1000*2           |
        |1000/2           |
        |(1000+1)/2       |
        |1000%3           |
        |1000^2           |
        |sqrt(1000)      |
        |log(1000)        |
        |ln(1000)         |
        |exp(5)           |
        |abs(-1000)       |
        |ceil(1000.4)    |
        |floor(1000.6)   |
        |round(1000.5)   |
        |trunc(1000.9)    |
        |sign(-1000)       |
        |max(1000,2000)   |
        |min(1000,2000)   |
        |pow(10,3)        |
        |mod(1000,3)      |
        |random(1,1000)   |
        |randint(1,1000)  |
        |gcd(1000,250)     |
        |lcm(1000,250)     |
        |factorial(5)     |
        |fibonacci(10)    |
        |prime(29)        |
        |isprime(29)      |
        |nextprime(29)    |
        |prevprime(29)    | 
        |euler(10)        |
        |catalan(5)       |
        |bell(5)          |
        |triangular(5)    |
        |hex(255)         |
        |bin(10)          |
        |oct(10)          |
        |deg(3.14)        | 
        |rad(180)         |
        |sin(30)          |
        |cos(60)          |
        |tan(45)          |
        |asin(0.5)       |
        |acos(0.5)       |
        |atan(1)          |
        |atan2(1,1)      |
        |sinh(1)         |
        |cosh(1)         |  
        |tanh(1)         |
        |asinh(1)        |
        |acosh(2)        |
        |atanh(0.5)      |
        |deg2rad(180)     |
        |rad2deg(3.14)    |
        |hypot(3,4)       |
        |log10(1000)     |
        |log2(1024)      |
        |cbrt(27)         |
        |expm1(1)        |
        |log1p(9)        |
        |erf(1)           |
        |erfc(1)          |
        |gamma(5)         |
        |lgamma(120)      |
        |digamma(5)       |
        |trigamma(5)      |
        |zeta(2)          |
        |besselj(0,1)    |

@login @PendingAutomate
Scenario Outline: Verify search result when search with query injection when switching from AND to OR
    When I enter <search parameter> at 'Search' field
    And I click 'Search' button
    Then I see each entry in 'Search Results' section contains <search parameter>
    And I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    Then I see each entry in 'Search Results' section contains <search parameter>
    And I select 'Must include all words (ex. transportation AND safety)' at 'search-verb-switch'
    Then I see each entry in 'Search Results' section contains <search parameter>
    Examples:
        | search parameter            |
        | K01'; DROP TABLE users;--   |
        | '; EXEC xp_cmdshell('dir');--|
        | ' OR '1'='1                 |
        | '; WAITFOR DELAY '00:00:05'--|
        | <script>alert('XSS')</script>|
        | ../../../../etc/passwd          |
        | %3Cscript%3Ealert('XSS')%3C/script%3E |
        | %27%20OR%20%271%27%3D%271 |

@login @PendingAutomate
Scenario Outline: Verify search result when search with query injection when switching from OR to AND
    When I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    And I enter <search parameter> at 'Search' field
    And I click 'Search' button
    Then I see each entry in 'Search Results' section contains <search parameter>
    And I select 'Must include all words (ex. transportation AND safety)' at 'search-verb-switch'
    Then I see each entry in 'Search Results' section contains <search parameter>
    And I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    Then I see each entry in 'Search Results' section contains <search parameter>
    Examples:
        | search parameter            |
        | K01'; DROP TABLE users;--   |
        | '; EXEC xp_cmdshell('dir');--|
        | ' OR '1'='1                 |
        | '; WAITFOR DELAY '00:00:05'--|
        | <script>alert('XSS')</script>|
        | ../../../../etc/passwd          |
        | %3Cscript%3Ealert('XSS')%3C/script%3E |
        | %27%20OR%20%271%27%3D%271 |

@login @PendingAutomate
Scenario: Verify search result count when searching with query injection
    When I enter 'K01'; DROP TABLE users;--' at 'Search' field
    And I click 'Search' button
    And I see '0' at 'Search Results' section
        | results           |
        | 0                 |
    And I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    And I see '0' at 'Search Results' section
        | results           |
        | 0                 |
    And I select 'Must include all words (ex. transportation AND safety)' at 'search-verb-switch'
    And I see '0' at 'Search Results' section
        | results           |
        | 0                 |

@login @PendingAutomate
Scenario: Verify search result count when searching with query injection encoded
    When I enter 'K01%27%3B%20DROP%20TABLE%20users%3B--' at 'Search' field
    And I click 'Search' button
    And I see '0' at 'Search Results' section
        | results           |
        | 0                 |
    And I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    And I see '0' at 'Search Results' section
        | results           |
        | 0                 |
    And I select 'Must include all words (ex. transportation AND safety)' at 'search-verb-switch'
    And I see '0' at 'Search Results' section
        | results           |
        | 0                 |

@login @PendingAutomate
Scenario: Verify search result count when switching from AND to OR with special characters
    When I enter 'C++ Programming & Development' at 'Search' field
    And I click 'Search' button
    And I see '7' at 'Search Results' section
        | results           |
        | 7                 |
    And I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    And I see '12' at 'Search Results' section
        | results           |
        | 12                |
    And I select 'Must include all words (ex. transportation AND safety)' at 'search-verb-switch'
    And I see '7' at 'Search Results' section
        | results           |
        | 7                 |

@login @PendingAutomate
Scenario: Verify search result count when switching from OR to AND with special characters
    When I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    And I enter 'C++ Programming & Development' at 'Search' field
    And I click 'Search' button
    And I see '12' at 'Search Results' section
        | results           |
        | 12                |
    And I select 'Must include all words (ex. transportation AND safety)' at 'search-verb-switch'
    And I see '7' at 'Search Results' section
        | results           |
        | 7                 |
    And I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    And I see '12' at 'Search Results' section
        | results           |
        | 12                |

@login @PendingAutomate
Scenario: Verify search validation with 100 characters (no spaces) when switching from AND to OR
    When I enter '100 characters (with spaces). This is a test. This is a test. This is a test. This is a test. _ END.' at 'Search' field
    And I click 'Search' button
    And I do not see field 'validation text'
        | validation text                                      |
        | Search terms must be no longer than 100 characters. |
    And I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    And I do not see field 'validation text'
        | validation text                                      |
        | Search terms must be no longer than 100 characters. |
    And I select 'Must include all words (ex. transportation AND safety)' at 'search-verb-switch'
    And I do not see field 'validation text'
        | validation text                                      |
        | Search terms must be no longer than 100 characters. |

@login @PendingAutomate
Scenario: Verify search validation with 100 characters (no spaces) when switching from OR to AND
    When I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    And I enter '100 characters (with spaces). This is a test. This is a test. This is a test. This is a test. _ END.' at 'Search' field
    And I click 'Search' button
    And I do not see field 'validation text'
        | validation text                                      |
        | Search terms must be no longer than 100 characters. |
    And I select 'Must include all words (ex. transportation AND safety)' at 'search-verb-switch'
    And I do not see field 'validation text'
        | validation text                                      |
        | Search terms must be no longer than 100 characters. |
    And I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    And I do not see field 'validation text'
        | validation text                                      |
        | Search terms must be no longer than 100 characters. |
    
@login @PendingAutomate
Scenario: Verify search validation with 101 characters (no spaces) when switching from AND to OR
    When I enter '101characters(withoutspaces).Thisisatest.Thisisatest.Thisisatest.Thisisatest._END.' at 'Search' field
    And I click 'Search' button
    And I see field 'validation text'
        | validation text                                      |
        | Search terms must be no longer than 100 characters. |
    And I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    And I see field 'validation text'
        | validation text                                      |
        | Search terms must be no longer than 100 characters. |
    And I select 'Must include all words (ex. transportation AND safety)' at 'search-verb-switch'
    And I see field 'validation text'
        | validation text                                      |
        | Search terms must be no longer than 100 characters. |

@login @PendingAutomate
Scenario: Verify search validation with 101 characters (no spaces) when switching from OR to AND
    When I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    And I enter '101characters(withoutspaces).Thisisatest.Thisisatest.Thisisatest.Thisisatest._END.' at 'Search' field
    And I click 'Search' button
    And I see field 'validation text'
        | validation text                                      |
        | Search terms must be no longer than 100 characters. |
    And I select 'Must include all words (ex. transportation AND safety)' at 'search-verb-switch'
    And I see field 'validation text'
        | validation text                                      |
        | Search terms must be no longer than 100 characters. |
    And I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    And I see field 'validation text'
        | validation text                                      |
        | Search terms must be no longer than 100 characters. | 

@login @PendingAutomate
Scenario: Verify search result count when switching from AND to OR with mixed case search term
    When I enter 'K01 MeNtOrEd ReSeArCh ScIeNtIsT' at 'Search' field
    And I click 'Search' button
    And I see '9' at 'Search Results' section
        | results           |
        | 9                 |
    And I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    And I see '15' at 'Search Results' section
        | results           |
        | 15                |
    And I select 'Must include all words (ex. transportation AND safety)' at 'search-verb-switch'
    And I see '9' at 'Search Results' section
        | results           |
        | 9                 |

@login @PendingAutomate
Scenario: Verify search result count when switching from OR to AND with mixed case search term
    When I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    And I enter 'K01 MeNtOrEd ReSeArCh ScIeNtIsT' at 'Search' field
    And I click 'Search' button
    And I see '15' at 'Search Results' section
        | results           |
        | 15                |
    And I select 'Must include all words (ex. transportation AND safety)' at 'search-verb-switch'
    And I see '9' at 'Search Results' section
        | results           |
        | 9                 |
    And I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    And I see '15' at 'Search Results' section
        | results           |
        | 15                |

@login @PendingAutomate
Scenario: Verify search result count when switching from AND to OR with exact case search term
    When I enter 'K01 Mentored Research Scientist' at 'Search' field
    And I click 'Search' button
    And I see '9' at 'Search Results' section
        | results           |
        | 9                 |
    And I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    And I see '15' at 'Search Results' section
        | results           |
        | 15                |
    And I select 'Must include all words (ex. transportation AND safety)' at 'search-verb-switch'
    And I see '9' at 'Search Results' section
        | results           |
        | 9                 |   

@login @PendingAutomate
Scenario: Verify search result count when switching from OR to AND with exact case search term
    When I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    And I enter 'K01 Mentored Research Scientist' at 'Search' field
    And I click 'Search' button
    And I see '15' at 'Search Results' section
        | results           |
        | 15                |
    And I select 'Must include all words (ex. transportation AND safety)' at 'search-verb-switch'
    And I see '9' at 'Search Results' section
        | results           |
        | 9                 |
    And I select 'May include any words (ex. transportation OR safety)' at 'search-verb-switch'
    And I see '15' at 'Search Results' section
        | results           |
        | 15                |   
