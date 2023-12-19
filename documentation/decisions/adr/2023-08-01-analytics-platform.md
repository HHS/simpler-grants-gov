# Communications Tooling: Analytics Platform

- **Status:** Accepted
- **Last Modified:** 2023-08-01 <!-- REQUIRED -->
- **Related Issue:** [#323](https://github.com/HHS/simpler-grants-gov/issues/323) <!-- RECOMMENDED -->
- **Deciders:** Lucas Brown, Aaron Couch, Billy Daly, Sarah Knopp, Sumi Thaiveettil
- **Tags:** communucations, open source, analytics

## Context and Problem Statement

The communications platform deliverable identifies a series of platforms through which the Grants API project needs to engage both internal and external stakeholders. One of these platforms is an analytics platform for tracking key metrics during the launch of the first version of simpler.grants.gov and as the project continues to grow. We will evaluate top 3-5 analytics tools, including analytics.gov and Google Analytics, to identify the best fit for our specific needs and objectives. The selected tool should provide valuable insights and data to help us measure and optimize the platform's performance.

## Decision Drivers <!-- RECOMMENDED -->

#### Must Have

- **Data tracking capabilities**: solution should be able to track the essential metrics and events relevant to the project's goals, such as page views, user interactions, and other custom events.
- **Data visualization and reporting**: The tool should offer clear and comprehensive data visualization and reporting features to present data in a way that is easy to understand and interpret for multiple audiences (public, internal HHS, etc.)
- **Integration with existing systems**: consider whether the analytics tool can seamlessly integrate with the project's existing infrastructure, and other tools used in the development process. We will have a content management system in the future and we should have forward thinking to ensure it could be compatible with various CMS options.
- **Real-time data processing**: Assess whether the analytics tool can provide real-time data processing capabilities, enabling timely responses to critical events.
- **Data privacy and security**: Ensure that the selected tool complies with data privacy regulations and provides robust security measures to protect sensitive information.
- **Scalability**: Consider whether the analytics tool can handle the expected growth in data volume and user traffic as the project expands.
- **Cost**: Evaluate the pricing structure of the analytics tool.
- **Customization and flexibility**: Determine the level of customization and flexibility offered by the tool to tailor it to the specific needs and requirements of the project.
- **Support and documentation**: Check the availability of technical support, documentation, and community forums to aid in implementation and troubleshooting.
- **User-friendly interface**: Consider the ease of use and intuitiveness of the tool's interface, enabling team members to efficiently navigate and extract insights.

#### Nice to Have

- **Open Source:** The tool used to manage and host the analytics should be open source, if possible.

## Options Considered

- [Analytics.usa.gov](https://analytics.usa.gov/)
- [Google Analytics](https://analytics.google.com/analytics/web/provision/#/provision)
- [Mixpanel](https://mixpanel.com/)
- [Adobe Analytics](https://business.adobe.com/products/analytics/adobe-analytics.html)
- [Matomo](https://matomo.org/)

## Decision Outcome <!-- REQUIRED -->

We recommend moving forward with analytics.usa.gov through the Digital Analytics Program for the public facing analytics. It is required for all public-facing government agency websites. The platform aligns well with our goals due to its robust data tracking capabilities, allowing us to monitor essential metrics and custom events critical to our project's success. Its comprehensive data visualization and reporting features ensure that data can be presented in an easily understandable format for various audiences, including the general public and internal stakeholders at HHS. Since it is run by the Digital Analytics Program, we have greater confidence in the data and security standards. It is free for government agencies. Additionally, it allows us to align with other government agencies and ensure transparency to public.

DAP cannot be used for authenticated pages. We recommend Google Analytics with any logged in or authenticated pages. Since DAP is powered by Google Analytics, it makes sense to have the same Analytics platform on those pages as well. An assumption is that we will be able to connect the user sessions between authenticated and the public site together. However, if it is not possible to stitch the user journey (unauthenticated to authenticated and back and forth) together, it is worth revisiting the analytics tool selection.

### Positive Consequences <!-- OPTIONAL -->

- **Data-Driven Decision Making**: With an analytics platform, our project can gather valuable data and insights about usage and identify where there are shortfalls to our product. It can allow us to ensure we are building an accessible solution for the public. This data-driven approach enables informed decision-making and allows teams to identify trends, opportunities, and areas for improvement.
- **Improved Performance**: Analytics platforms help track key performance indicators (KPIs) and measure the success of various initiatives and deliverables. By monitoring these metrics, we can optimize our strategies and improve overall performance.
- **Enhanced User Experience**: Understanding user behavior through analytics helps tailor products, services, and content to meet users' needs and preferences leading to a better user experience.

### Negative Consequences <!-- OPTIONAL -->

- **Data Privacy Concerns**: Collecting and analyzing user data can raise privacy concerns, especially with the increasing focus on data protection. We must handle data responsibly and set a high standard for compliance.
- **Data Overload**: Too much data without proper analysis can overwhelm teams and lead to decision paralysis. It's important to focus on relevant metrics and insights to continue moving forward.
- **Misinterpretation of Data**: Misinterpreting or misrepresenting data can lead to incorrect conclusions and misguided strategies. Proper data analysis and understanding are essential to draw accurate insights.
- **Cost and Resource Allocation**: Implementing and maintaining an analytics platform can be costly and resource-intensive that goes beyond just the cost of the tool.
- **Learning Curve**: Adopting new analytics platforms may require training and time for team members to become proficient, potentially affecting productivity during the initial stages.

## Comparison Matrix

- ✅ Feature available, meets requirement
- ❌ Feature not available, does not meet requirement
- 🔄 Partial feature, limited feature availability, feature in progress or undergoing improvements
- 1-4 Strength level
- ❓Unknown

| Factor                            | Analytics.usa.gov | Google Analytics | Mixpanel | Adobe Analytics | Matomo |
| --------------------------------- | :---------------: | :--------------: | :------: | :-------------: | :----: |
| Data tracking capabilities        |        ✅         |        3         |    3     |        3        |   3    |
| Data visualization and reporting  |         1         |        3         |    2     |        3        |   1    |
| Integration with existing systems |        ❓         |        3         |    2     |        1        |   2    |
| Real-time data processing         |        ✅         |        🔄        |    ✅    |       🔄        |   🔄   |
| Data privacy and security         |         3         |        3         |    3     |        3        |   4    |
| Scalability                       |         2         |        4         |    3     |        3        |   3    |
| Cost                              |  Free (gov use)   |  Free + Premium  |    $     |       $$        |  Free  |
| Customization and flexibility     |         1         |        4         |    3     |        3        |   4    |
| Support and documentation         |         2         |        4         |    3     |        4        |   3    |
| User-friendly interface           |        ✅         |        ✅        |    ✅    |       ✅        |   🔄   |
| Authority to Operate              |        ✅         |        ❓        |    ❓    |       ❓        |   ❓   |
| Open Source\*                     |        ❌         |        ❌        |    ❌    |       ❌        |   ✅   |

\*Nice to have

## Pros and Cons of the Options <!-- OPTIONAL -->

### Analytics.usa.gov

The Digital Analytics Program (DAP) offers a web analytics tool, training, and support to federal agencies. The program is a shared service provided by the Technology Transformation Services (TTS) at the U.S. General Services Administration (GSA).

DAP provides federal agencies with:

- Free web analytics tools for public-facing federal websites that are comprehensive and easy-to-use
- Scalable infrastructure for measuring a broad range of .gov sites (large and small)
- Training on analytics tools and reporting
  - View upcoming trainings and talks »
  - View past recorded trainings »
  - Ongoing help-desk support around implementation, data, and reporting

#### Details

- The public reporting page, analytics.usa.gov, is powered from the Google Analytics account that DAP manages. Currently, the DAP code snippet is implemented at grants.gov.
- Currently powered by Universal Analytics (UA), but we will have access to both UA and GA4. On July 1, 2024, the Digital Analytics Program (DAP) will replace Universal Analytics (UA) with Google Analytics 4 (GA4).
- DAP is required: On November 8, 2016, the Office of Management and Budget (OMB) released a memorandum on [Policies for Federal Agency Public Websites and Digital Services](https://www.whitehouse.gov/wp-content/uploads/legacy_drupal_files/omb/memoranda/2017/m-17-06.pdf) (PDF, 1.2 MB, 18 pages), which requires executive branch federal agencies to implement the DAP JavaScript code on all public facing federal websites.
- Details on the code are available at the [DAP Github Repo](https://github.com/digital-analytics-program/gov-wide-code). Under the Code Capabilities Summary there are details on the types of data that are collected.
- The DAP script should only be applied to public-facing pages. Public-facing web pages are defined as those that can be accessed without any authentication or login, and are not part of an otherwise “privileged session.”
- The DAP script tag should not be placed on pages visited during logged-in sessions. Notably, other seemingly “public” pages that can be accessed without authentication may also be part of privileged sessions; for example, a password reset page that is accessed by clicking a link in an email is not appropriate for DAP code because it assumes the visitor has the privilege of control over the email account used to provide the link.

#### Pros

- DAP is free for government agencies
- DAP provides insights across government agencies. It delivers an unprecedented, government-wide view of how the public interacts with federal websites.
- Follows the recommended standards by government
- Promotes transparency by sharing data on how citizens interact with various federal government websites. This transparency can foster accountability and open up insights into user behavior and government services usage.
- By providing real-time data and analytics, government agencies can make more informed decisions about website design, content, and functionality. This can lead to improved user experiences and more effective government services.
- The insights derived from Analytics.usa.gov can contribute to the optimization of government websites and services especially by our users and community as they will have a direct view, resulting in a more efficient and effective delivery of information and services to the public.

#### Cons

- DAP can only be on public facing systems, no logged in states should have DAP

### Google Analytics

Google Analytics is a widely used web and app analytics platform that provides in-depth insights into user behavior, traffic sources, and more. It offers a user-friendly interface, robust tracking capabilities, and integration with other Google services. Customization options, like creating custom reports and goals, allow tailored analysis.

#### Pros

- Robust tracking offering comprehensive website and app data providing insights into user behavior, traffic sources, and more.
- It integrates seamlessly with other Google services and tools, making it easy to connect and analyze data across platforms.
- It allows for advanced customization, including creating custom reports, segments, and goals.

#### Cons

- The collection of user data by Google Analytics raises privacy concerns, especially with stricter data protection regulations.
- Using Google Analytics means sharing data with Google, which can raise questions about data ownership and control.
- While Google Analytics offers real-time data, it's not as robust as some other real-time analytics tools.
- Will need to get ATO or FedRAMP approval

### Mixpanel

Mixpanel is a user-centric analytics tool primarily focused on app analytics. It excels in tracking specific events and user flows, providing valuable insights into user engagement. Its funnel analysis helps pinpoint where users drop off in processes. While it's strong for app analytics, its web tracking capabilities might be less comprehensive.

#### Pros

- Mixpanel focuses on user behavior, allowing for deep insights into how individual users interact with your app or website.
- It excels in tracking specific events, actions, and user flows, providing valuable insights for user engagement.
- Mixpanel offers powerful funnel analysis, helping you understand where users drop off in a specific process.
- Real-time tracking and reporting enable you to monitor user behavior as it happens.

#### Cons

- The extensive features can make Mixpanel more complex to set up and use, requiring a learning curve.
- While Mixpanel is strong for app analytics, its web tracking capabilities might not be as comprehensive as other platforms.
- Mixpanel's pricing can be higher compared to some other analytics tools, particularly as usage scales.
- Will need to get ATO or FedRAMP approval

### Adobe Analytics

Adobe Analytics is an enterprise-grade solution suitable for large organizations. It integrates well with other Adobe products and offers extensive customization options, allowing for tailor-made reports and dashboards.

#### Pros

- Adobe Analytics is a powerful enterprise-grade solution suitable for large organizations with complex analytics needs.
- It integrates well with other Adobe products, creating a seamless experience for marketing and data analysis.
- Adobe Analytics allows extensive customization and flexibility in creating reports, segments, and dashboards.
- Real-time data reporting is available, allowing for immediate insights into user behavior.

#### Cons

- Adobe Analytics can be complex to set up and manage, requiring expertise and dedicated resources.
- The enterprise-level features are more costly.
- Due to its advanced capabilities, Adobe Analytics might have a steeper learning curve for new users and the general public.
- Will need to get ATO or FedRAMP approval

### Matomo

Matomo, an open-source alternative, offers data ownership and control, making it attractive for privacy-conscious organizations. As self-hosted software, it can be customized and audited, addressing data privacy concerns.

#### Pros

- Matomo allows you to retain complete ownership and control of your data, addressing privacy concerns.
- As open-source software, Matomo's code can be audited, customized, and self-hosted.
- Matomo provides tools to help with GDPR compliance, making it suitable for businesses in regions with strict data protection laws.
- Matomo offers customization and flexibility similar to other analytics tools, allowing you to tailor reports and dashboards.

#### Cons

- There are downsides and costs to self-hosting
- The support ecosystem might not be as extensive as that of larger, commercial analytics platforms.
- Will need to get ATO or FedRAMP approval

## Links <!-- OPTIONAL -->

- [Analytics.usa.gov](https://analytics.usa.gov/)
- [DAP](https://digital.gov/)
- [Google Analytics](https://analytics.google.com/analytics/web/provision/#/provision)
- [Adobe Analytics](https://business.adobe.com/products/analytics/adobe-analytics.html)
- [Matomo](https://matomo.org/)
