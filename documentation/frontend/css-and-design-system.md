# CSS and Design System 

Simpler Grants uses the U.S. Web Design System (USWDS), a toolkit of principles, guidance, and code to help design and build accessible, mobile-friendly government websites. Its [components](https://designsystem.digital.gov/components/), [patterns](https://designsystem.digital.gov/patterns/), [design tokens](https://designsystem.digital.gov/design-tokens/), and [utilities](https://designsystem.digital.gov/utilities/) are throughly documented at [designsystem.digital.gov](https://designsystem.digital.gov/). 


## Customizing styles

Be mindful when adjusting the presentation of elements, styling existing components, or creating new design patterns. These methods should be used **<u>in following order</u>** to best leverage the design system and existing code: 

### 1) USWDS Settings 

When implementing a design pattern, first configure any available `$theme-` variables to bring the design system defaults closer to the desired pattern. These global system settings are our primary method for maintaining a unified and recognizable identity. 

The design system has been customized to match the [Simpler brand guidlines](https://wiki.simpler.grants.gov/design-and-research/brand-guidelines). However, not all USWDS settings variables have been explicitly defined. It may be necessary to define additional `$theme-` variables to match design mockups and ensure brand consistency.  

_See [USWDS Settings guidance](https://designsystem.digital.gov/documentation/settings/)_

### 2) Utility Classes

USWDS includes a robust set of utility classes. When defining settings is not enough, utility classes can be used to build custom components or to override the style of USWDS components. 

_See [USWDS Utility guidance](https://designsystem.digital.gov/utilities/)_

### 3) Custom CSS

Write custom CSS only when USWDS settings or utility classes do not suffice. Custom styles are often a sign of unnecessary code, as most design patterns can be achieved by USWDS theme variables and utility classes. If custom styles are necessary, be sure to leverage the variables, mixins, functions that USWDS provides. 


## Design Tokens

Avoid magic numbers and hardcoded values. Regardless of the method used to customize styles, leverage USWDS design tokens. This set of discrete options for setting typography, spacing units, color, and other layout properties helps insure consistency throughout our styles. 

_See [USWDS Design Tokens](https://designsystem.digital.gov/design-tokens/)_


## Defer to USWDS defaults

Do not infer design decisions that deviate from USWDS defaults. 

A design system allows us to move quickly and avoid striving for pixel perfection. But it also means that mockups can sometimes be sketchy and challenging to interpret. If a mockup is similar to an existing USWDS style, the designer likely indended to use that style. If a mockup includes obvious deviations, suggest that existing patterns be used instead. Any deviations from USWDS defaults should be explicitly discussed and documented. 
