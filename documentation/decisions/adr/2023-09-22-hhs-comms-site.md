# HHS Communications Site

- **Status:** Active
- **Last Modified:** 2023-09-22
- **Related Issue:** [#498](https://github.com/HHS/grants-equity/issues/498)
- **Deciders:** Lucas, Elizabeth, Julius, Billy
- **Tags:** topic: comms

## Context and Problem Statement

HHS needs a way to distribute information about the Simpler Grants workstreams that is tailored to internal stakeholders. This internal site should prioritize hosting and broadcasting read-only content about these workstreams in a user-friendly format, but also provide a mechanism for stakeholders to pose questions or provide feedback.

## Decision Drivers <!-- RECOMMENDED -->

- **Deployment Timeline:**  We can deploy a site with this tool in less than a month
- **User Experience (UX):** The site is easy to navigate with a modern-looking user interface
- **Hosting Cost:** It is not prohibitively expensive to extend access to all of HHS
- **Access Control:** We can control who can read and edit the site with minimal overhead
- **Content Management:** It is easy for HHS staff and contractors to update the site content
- **Feedback Mechanism:** We can solicit feedback and questions from site visitors

## Options Considered

- GitBook publishing options
  - Guest Access
  - Visitor Authentication
  - “Private” Links
- SharePoint hosting options
  - HHS-owned site
  - Contractor-owned site
- Options for custom-built sites
  - Page on HHS intranet site
  - Contractor-built static site

## Decision Outcome <!-- REQUIRED -->

Use **GitBook** to create and manage content publishing to the site via **“private” link**. The link to this site will be added to the HHS intranet and/or OG Resource Center so that HHS staff can find it.

In parallel we'll actively work on developing a **visitor authentication option** to restrict access to the site in the long-term. Once this visitor authentication option is built and undergoes security review and approval, we'll change the publishing strategy for GitBook from "private" link to visitor authentication.

### Positive Consequences <!-- OPTIONAL -->

- Allows us to deploy and publish the site in time for the kickoff of the initiative
- Enables HHS staff and contractors to manage the content directly in a easy to use editor
- Provides a modern user interface for visitors to the site.

### Negative Consequences <!-- OPTIONAL -->

- During the period in which we are using the "private" link publishing strategy we'll need to be avoid of including any sensitive information on the site. The strategy to address this is to keep sensitive information in an access controlled environment and to simply link to where that information is stored from GitBook.
- We'll need to allocate some technical resources in the upcoming period of performance to work on implementing the visitor authentication option for GitBook.
- We may need to have a period of downtime when we switch from the "private" link publishing strategy to the visitor authentication strategy.

## Comparison Matrix

### Table Legend
- ✅ - Meets decision criteria
- ❌ - Does not meet decision criteria
- 🟡 - Partially meets criteria or requires more info

### Table

| Option                          | Timeline | UX  | Cost | Access | Content | Feedback |
| ------------------------------- | :------: | :-: | :--: | :----: | :-----: | :------: |
| GitBook: Guest Access           |    ✅    |  ✅  |  ❌  |   🟡   |    ✅    |    ✅     |
| GitBook: Visitor Authentication |    ❌    |  ✅  |  ✅  |   ✅   |    ✅    |    ✅     |
| Gitbook: “Private” Link         |    ✅    |  ✅  |  ✅  |   ❌   |    ✅    |    ✅     |
| SharePoint: HHS-owned           |    🟡    |  🟡  |  ✅  |   ✅   |    🟡    |    ✅     |
| SharePoint: Contractor-owned    |    🟡    |  🟡  |  ❌  |   🟡   |    ✅    |    ✅     |
| Custom: HHS Intranet Page       |    🟡    |  ✅  |  ✅  |   🟡   |    ❌    |    🟡     |
| Custom: Contractor-built Site   |    ❌    |  ✅  |  ✅  |   🟡   |    ✅    |    ✅     |

## Pros and Cons of the Options <!-- OPTIONAL -->

### GitBook: Guest Access

Create and maintain the site contents in **GitBook** and extend view access to through **GitBook-managed licenses**.

**Bottom Line:** GitBook is likely the best platform, but this is not a viable publishing option because it would be too costly and difficult to administer

- **Pros**
  - **Timeline:** Site can be deployed in 1-2 weeks
  - **Usability:** Clean and customizable user interface
  - **Access:** Can control both edit and view access
  - **Content:** HHS staff and contractors can edit content
  - **Feedback:** Supports embedding Microsoft forms
- **Cons**
  - **Cost:** More than $25k per month for all HHS users
  - **Access:** View access needs to be managed per user

### GitBook: Visitor Authentication

Create and maintain the site contents in **GitBook** and extend view access to through an **HHS-managed authentication solution**.

**Bottom Line:** GitBook is likely the best platform, and this publishing option meets most of the key criteria except our desired timeline for deployment

- **Pros**
  - **Usability:** Clean and customizable user interface
  - **Cost:** Only pay for editors, no per-viewer costs
  - **Access:** Can control both edit and view access
  - **Content:** HHS staff and contractors can edit content
  - **Feedback:** Supports embedding Microsoft forms
- **Cons**
  - **Timeline:** May take several months to set up authentication (due to security review)

### GitBook: Visitor Authentication

Create and maintain the site contents in **GitBook** and extend view access through a **shareable link with a secret token**.

**Bottom Line:** GitBook is likely the best platform, and this publishing option meets most of the key criteria except our desired desired access controls

- **Pros**
  - **Timeline:** Site can be deployed in 1-2 weeks
  - **Usability:** Clean and customizable user interface
  - **Cost:** Only pay for editors, no per-viewer costs
  - **Content:** HHS staff and contractors can edit content
  - **Feedback:** Supports embedding Microsoft forms
- **Cons**
  - **Access:** Anyone with the link can view the site

### SharePoint: HHS-owned

Create and maintain the site contents in an **HHS-owned SharePoint** instance. Use a **communications site template** (if available) for a modern look and feel.

**Bottom Line:** SharePoint could be a viable option, but there are still open questions and challenges getting access for contractors

- **Pros**
  - **Usability:** Modern UI (with correct SharePoint version)
  - **Cost:** No cost for HHS staff with O365 licenses
  - **Access:** Supports fine-tuned access controls
  - **Feedback:** Supports integration with Microsoft forms
- **Cons**
  - **Usability:** Current version may not support modern UI
  - **Timeline:** Timeline for creating a new site is unclear
  - **Content:** Contractors may not have edit access

### SharePoint: Contractor-owned

Create and maintain the site contents in a **contractor-owned SharePoint** instance. Use communications site template (if available) for a modern look and feel.

**Bottom Line:** SharePoint could be a viable option, but using a contractor-owned site would likely be too costly and difficult to administer

- **Pros**
  - **Usability:** Modern UI (with correct SharePoint version)
  - **Timeline:** Likely faster to create than HHS-owned site
  - **Content:** Likely easier to give contractors edit access
  - **Feedback:** Supports integration with Microsoft forms
- **Cons**
  - **Usability:** We may not have access to required version
  - **Cost:** May have to pay per user for HHS access
  - **Access:** May have to provision access per user

### Custom: HHS Intranet Site

Work with **HHS intranet site** admins to create a custom page. Manage updates and content through their existing request process.

**Bottom Line:** A page on the HHS intranet is a safe fallback option, but may have limits on timeline and the ability to manage and update content

- **Pros**
  - **Usability:** Intranet site uses modern USWDS branding
  - **Cost:** No additional per-user cost to host site
  - **Access:** HHS staff already have access to the site
- **Cons**
  - **Timeline:** Timeline for creating a new page is unclear
  - **Access:** Contractors don’t have view or edit access
  - **Content:** Changes may need to go through approval
  - **Feedback:** Options for collecting feedback are unclear

### Custom: Contractor-built Site

Add a **custom-built site** to the scope for the next period of performance with MicroHealth/Nava. Use the **Storyblock CMS** or another solution to manage content updates.

**Bottom Line:** A contractor-built site is a strong back-up option, but it would delay the timeline and it may divert resources from other priorities

- **Pros**
  - **Usability:** Gives us more control over the look and feel
  - **Cost:** No additional per-user cost to host site
  - **Access:** We can control both read and write access
  - **Content:** Content edits could be made by contractors
  - **Feedback:** We can build our own custom forms
- **Cons**
  - **Timeline:** May take several months to set up authentication (due to security review)
  - **Content:** Fewer staff may be able to manage content
  - **Access:** Some technical details to work out

## Links <!-- OPTIONAL -->

- [GitBook visitor authentication](https://docs.gitbook.com/publishing/visitor-authentication)
- [GitBook private links](https://docs.gitbook.com/publishing/share/share-links)
- [HHS comms site options slide deck](https://docs.google.com/presentation/d/1vo7GvTqQKxHcXX65sXyTIJziEXfrPeLh/edit#slide=id.g281eab1baba_1_111)
