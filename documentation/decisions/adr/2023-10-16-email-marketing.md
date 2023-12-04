# Communications Tooling: Email Marketing

- **Status:** Draft
- **Last Modified:** 2023-10-16 <!-- REQUIRED -->
- **Related Issue:** [#590](https://github.com/HHS/grants-equity/issues/590) <!-- RECOMMENDED -->
- **Deciders:** Lucas Brown, Aaron Couch, Billy Daly, Sarah Knopp, Sumi Thaiveettil
- **Tags:** communucations, open source, email marketing

## Context and Problem Statement

An email marketing tool is primarily used for creating, sending, and tracking email campaigns to a list of subscribers. It allows for us to engage with our audience, push notifications and newsletters to our users, share information, and build customer relationships through email. 

## Decision Drivers <!-- RECOMMENDED -->

#### Must Have

- **Usability:** Non-technical users should be able to access and create content with minimal training or guidance.
- **Content Review:** Collaborators should be able to review and edit draft content before emails are sent out.
- **Comments:** Reviewers should be able to leave in-line comments on content that they are reviewing.
- **Internationalization (i18n):** The solution should provide support for displaying content in multiple languages.
- **Analytics:** The platform should provide support for tracking open rates, click-through-rate and other other web analytics.
- **Onboarding Costs:** Onboarding new members to the platform should be relatively inexpensive, both in terms of staff time/resources and direct costs (e.g. licensing fees).
- **Maintenance Costs:** It should not be prohibitively expensive to maintain the email marketing tool, both in terms of staff time/resources and direct costs (e.g. hosting fees).
- **Authority to Operate (ATO):** The tool should be FedRAMPed or have an Authority to Operate as it will have names and email addresses of public users. 

#### Nice to Have

- **Open Source:** The tool used to manage the email marketing content should be open source, if possible.
- **Community & Support**: The platform has a strong community for ongoing support, updates, and bug fixes
- **Scalability**: The platform should be able to hadndle a growing number of subscribers without performance issues

## Options Considered


- [Sendy](https://sendy.co/) 
- [Salesforce Marketing](https://www.salesforce.com/products/engagement-marketing/) - 
- [MailChimp](https://mailchimp.com/)
- [Hubspot](https://www.hubspot.com/)
- [Mautic](https://www.mautic.org/)
- [Adobe Campaign](https://business.adobe.com/products/campaign/adobe-campaign.html)

## Decision Outcome <!-- REQUIRED -->

The suggested approach is to utilize Sendy and create a campaign for Simpler Grants.gov within the existing main account for the near-term, leveraging existing knowledge and allowing for faster use. This allows for a faster initiation of the process. One of the most important criteria given by users of the tool, the Grants.gov Communications team, is the need to be able to send an email to the current 1M current subscribers quickly which Sendy cannot do. There are other limitations of this solution so we recommend that we select a back-up option email marketing solution for our long-term needs. 


### Open Questions <!-- OPTIONAL -->

1. Can we transfer the Simpler Grants.gov email list from Sendy to a different tool in the future?

Yes, we are able to transfer the list created in Sendy to a new tool in the future. 



### Back-up Options

Alternatively, as a backup solution, Mautic is a cost-effective and customizable option that can handle growing subscribers. Being an open-source platform, it comes with a slightly steeper learning curve. However, since only a limited number of individuals will be using the tool, we can provide training to facilitate a smooth onboarding process. 

## Comparison Matrix

- ✅ Feature available, meets requirement
- ❌ Feature not available, does not meet requirement
- 🔄 Partial feature, limited feature availability, feature in progress or undergoing improvements
- 1-3 Strength level
- ❓Unknown

| Factor                         | Sendy | Salesforce | MailChimp | Hubspot | Mautic | Adobe |
| ---------------------------    | :---: | :--------: | :-------: | :-----: | :----: | :---: |
| Usability                      |  2    |   1        |      3    |    3    |    1   |    3  |
| Content Review                 |  🔄   |   ✅        |     ✅    |   ✅    |   ✅    |  ✅   |
| Comments                       |   ❌  |   ✅        |     ❌    |   ✅    |   ✅    |   ✅  |
| Open source*                   |  🔄   |    ❌       |     ❌    |   ❌    |   ✅    |   ❌  |
| Multi-Media                    |   ✅  |   ✅        |     ❌    |   ✅    |   ✅    |   🔄  |
| Analytics                      |    1  |   ✅        |      ✅   |    ✅   |   ✅    |   ✅  |
| Internationalization           |     ❓ |   2        |      3    |    2   |    1   |   1   |
| Onboarding costs               |     1 |   3        |      1    |    2    |    1    |    2 |
| Community and Support*         |     1 |   3        |     3     |   3     |   3     |   3  |
| Scalability                    |     🔄 |   ✅       |     ✅    |   ✅    |   ✅     | ❌    |
| Send 1M emails quickly         |    ❌  |   ❓       |     ❓    |   ❓    |   ❓     |   ❓  |
| Authority to Operate or FedRAMP|     ✅ |   ❓       |     ❌    |   ❌    |   ❌     |   ✅  |



## Pros and Cons of the Options <!-- OPTIONAL -->

### Sendy

#### Details

Sendy is a self-hosted email marketing application that allows users to send newsletters, manage subscribers, and track campaign performance. It is known for its cost-effectiveness and integration with Amazon SES for efficient email delivery.

#### Pros

- Sendy is currently used by HHS and it would be simple for existing users to start using the tool right away
- It provides decent metrics and analytics
- HHS is able to send a few campaigns simultaneously
- Sendy is self-hosted which means we have control over the email list and the data. Sendy is a self hosted application that runs on our own web server. Pay once and it's yours, there's no recurring fee.
- It is a cost-effective option as it is self-hosted.
- Self-hosting provides control over data and infrastructure

#### Cons

- Campaigns with larged audiences or number of emails take a long time to send and a user cannot use the tool while an email is being sent. Currently, we have 1M subscribers and it takes a long time to send to that many subscribers
- Lacks some advanced features present in other platforms.
- It requires technical knowledge for setup and maintenance.
- Limited customer support compared to premium services.


### Salesforce Marketing


#### Details

Salesforce Marketing Cloud is a comprehensive marketing automation platform that enables organizations to create and manage personalized customer journeys. It includes features for email marketing, social media advertising, customer segmentation, and analytics.


#### Pros
- Salesforce Marketing is a comprehensive solution that offers a wide range of features and tools for marketing automation
- If we use any other Salesforce tools in the future, it is an easier integration
- It provides robust analytics and reporting capabilities

#### Cons

- Salesforce Marketing can be expensive, especially for smaller businesses
- There is learning curve as it may be more complex for non-technical users
- It may have more features than needed


### MailChimp


#### Details

Mailchimp is a widely used email marketing platform that offers a user-friendly interface for designing and sending emails, managing subscriber lists, and analyzing campaign performance. It also provides marketing automation features.

#### Pros

- MailChimp is user-friendly for non-technical users with a simple interface
- MailChimp does offer a free plan for small-scale needs
- There are automation features for targeted campaigns


#### Cons

- Pricing can become high as subscriber lists grow
- Some users may find limitations for advanced customization
- Free plan users have limited access to customer support

### Hubspot


#### Details

HubSpot is an all-in-one inbound marketing, sales, and customer service platform. It provides tools for content marketing, social media, lead generation, and customer relationship management (CRM) to help businesses attract, engage, and delight customers.

#### Pros

- Hubspot combines marketing, sales, and customer service tools
- Intuitive interface for non-technical users
- Strong automation and personalization features

#### Cons

- Can be expensive, especially for additional features
- Some users may find it complex initially
- More features th an needed for some smaller organizations

### Mautic

#### Details

Mautic is an open-source marketing automation platform that allows users to automate marketing tasks, personalize communication, and track the behavior of leads. It is known for its flexibility, open-source nature, and strong community support.

#### Pros

-  Offers flexibility for customization
-  Strong community support for ongoing development
-  Can handle growing subscriber lists

#### Cons

- Moderate usability, some users may find it less user-friendly
- May require additional development for certain integrations
- Non-technical users might face a learning curve


### Adobe Campaign

#### Details

Adobe Campaign is a marketing automation tool that forms part of the Adobe Experience Cloud. It enables users to create, execute, and measure multi-channel marketing campaigns, including email, mobile, social, and web, while integrating with other Adobe products.

#### Pros

-  Adobe Campaign is FedRAMP certified
-  Adobe Campaign is part of the broader Adobe Experience Cloud which is a suite of products and could be beneficial if we use more Adobe products for marketing and analytics tools
-  Enables the creation and execution of multi-channel marketing campaigns, including email, mobile, social, and web
-   Offers robust features for personalizing content and creating dynamic, targeted campaigns


#### Cons

- The platform may have a learning curve, especially for users new to advanced marketing automation tools
- Adobe Campaign can be relatively expensive, making it more suitable for larger enterprises with substantial marketing budgets
- Implementation and maintenance may require dedicated resources and expertise
- The extensive feature set may be more than what smaller businesses need, leading to potentially unnecessary complexity


## Links <!-- OPTIONAL -->

