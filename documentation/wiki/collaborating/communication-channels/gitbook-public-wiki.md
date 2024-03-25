---
description: User guide for navigating and accessing the content in our public wiki.
---

# GitBook - Public wiki

Welcome to the Simpler Grants Wiki! GitBook is our primary tool for documentation and knowledge sharing within the Simpler Grants community. This guide will help you get started and make the most out of your wiki experience.

## Key Concepts & Features

### Content Hierarchy

* **Page:** A page (like this one!) with content that is often focused on a single topic
* **Space:** A collection of pages that can be published as a public-facing website. Spaces are the level at which the following things are configured, such as:
  * **Publication Status:** Whether or not pages are published as a public-facing website
  * **Domain name:** The prefix of the URL used to access the site e.g. `docs.grants.gov`
  * **Branding:** The color and the font used visible on the published version of the site
  * **Edit Access:** Whether live edits are allowed and who has access to view and edit content
  * **Integrations:** Integrations with tools like Google Analytics or GitHub
* **Organization:** A collection of spaces that belong to a single organizational account. Organizations are the level at which the following things are configured:
  * **Licenses:** Adding or removing members to our GitBook account
  * **Billing:** Managing the GitBook plan we're currently on and how we're paying for it

### Content Blocks

{% hint style="info" %}
**Note:** For a complete breakdown of all of the content supported by GitBook, please refer to the [list of blocks in their documentation](https://docs.gitbook.com/content-creation/blocks).
{% endhint %}

GitBook allows users to use "blocks" to represent content in different formats. We've listed some common types of blocks below:

<table><thead><tr><th width="178.5">Block Type</th><th>Description</th></tr></thead><tbody><tr><td><a href="https://docs.gitbook.com/content-creation/blocks/heading">Headings</a></td><td>Bolded text that divide the page into sections and provide a stable link to a given section</td></tr><tr><td><a href="https://docs.gitbook.com/content-creation/blocks/paragraph">Paragraphs</a></td><td>Normal text that can be <strong>bolded</strong> or <em>italicized</em> or <mark style="color:red;">colored</mark></td></tr><tr><td><a href="https://docs.gitbook.com/content-creation/blocks/unordered-list">Bulleted Lists</a></td><td>Text arranged in a list where each line is a new bullet</td></tr><tr><td><a href="https://docs.gitbook.com/content-creation/blocks/ordered-list">Numbered Lists</a></td><td>Text arranged in a list where each line is a new number</td></tr><tr><td><a href="https://docs.gitbook.com/content-creation/blocks/table">Table</a></td><td>Text arranged in columns and rows with an optional header</td></tr><tr><td><a href="https://docs.gitbook.com/content-creation/blocks/cards">Cards</a></td><td>Items arranged in a grid that support multiple field types, cover images, and can redirect a user to a target link when clicked</td></tr><tr><td><a href="https://docs.gitbook.com/content-creation/blocks/insert-files">Files</a></td><td>Links to content that have been uploaded to GitBook</td></tr><tr><td><a href="https://docs.gitbook.com/content-creation/blocks/insert-images">Images</a></td><td>Embedded images that appear within the body of a page</td></tr><tr><td><a href="https://docs.gitbook.com/content-creation/blocks/embed-a-url">Embedded URL</a></td><td>Embedded videos, forms, publicly accessible documents, etc.</td></tr><tr><td><a href="https://docs.gitbook.com/content-creation/blocks/expandable">Expandable</a></td><td>Sections on the page that can be expanded to reveal more content</td></tr><tr><td><a href="https://docs.gitbook.com/content-creation/blocks/hint">Hint</a></td><td>Text with specific formatting that allows content editors to highlight notes, tips, or warnings for the reader</td></tr></tbody></table>

### **Integrations**

{% hint style="info" %}
**Note:** For an up-to-date list of all of the integrations supported by GitBook, please refer to [the integrations page on their website](https://www.gitbook.com/integrations).
{% endhint %}

GitBook functionality can be extended with a number of out of the box integrations. We've highlighted a few key integrations that we plan to use below:

<table><thead><tr><th width="208">Integration</th><th>Features</th></tr></thead><tbody><tr><td><a href="https://docs.gitbook.com/integrations/git-sync">GitHub Sync</a></td><td>Bi-directionally syncs GitBook content with markdown files in a GitHub repository</td></tr><tr><td><a href="https://www.gitbook.com/integrations/googleanalytics">Google Analytics</a></td><td>Track in-depth page analytics for published spaces</td></tr><tr><td><a href="https://www.gitbook.com/integrations/figma">Figma</a></td><td>Embeds Figma art boards and files into GitBook pages</td></tr><tr><td><a href="https://www.gitbook.com/integrations/slack">Slack</a></td><td>Search GitBook docs and save content to GitBook directly from Slack</td></tr></tbody></table>

## Navigating the Workspace

The workspace is broken down into main sections with subtopics underneath. These can all be seen on the left side of the screen.

<table><thead><tr><th width="196">Topics</th><th>Details</th></tr></thead><tbody><tr><td><a href="broken-reference"><strong>About</strong></a></td><td>This section includes information about team norms, people contributing and terminology used by our community.</td></tr><tr><td><a href="broken-reference"><strong>Product</strong></a></td><td>This section includes planning information about the product including the roadmap and any deliverables along the way. It also contains information about the product itself.</td></tr><tr><td><a href="broken-reference"><strong>Collaborating</strong></a></td><td>This includes policies including our code of conduct, as well as guides on how to use the different communication tools that we have available. Finally, it includes information on how to get involved. </td></tr><tr><td><a href="broken-reference"><strong>Contributing</strong></a></td><td>This contains information on how to participate in contributing code and other assets to the Simpler Grants project.</td></tr></tbody></table>

## FAQs

<details>

<summary>I can't seem to edit the text on the page. How can make changes?</summary>

If you want to make changes to a page but can't edit the page contents by clicking into them, the page most likely has live edits locked. To edit the contents of a locked page, follow the instructions in [this section on change requests](gitbook-public-wiki.md#when-live-edits-are-locked)

If you don't have the option to create a change request _and_ you can't edit the page directly, reach out to a GitBook administrator to make sure you have the correct permissions within the space.

</details>

<details>

<summary>The tables on the page are too cramped. How can I fix that?</summary>

GitBook allows you to set [tables to full-width](https://docs.gitbook.com/content-creation/blocks#new-full-width-blocks) which should provide you with more horizontal space to view the table.&#x20;

If the table is already full-width and the information is still too cramped, hiding [your sidebar](https://docs.gitbook.com/product-tour/navigation#sidebar) on the left-hand side may help:

<img src="broken-reference" alt="Screenshot of the hide sidebar image on the lefthand side" data-size="original">

If your table is full-width _and_ the sidebar is hidden and it still appears too cramped, you may want to consider spreading the contents across multiple tables or converting it into a set of cards.

</details>

Major updates to the content of this page will be added here.

<table><thead><tr><th>Date</th><th width="246">Update</th><th>Notes</th></tr></thead><tbody><tr><td>2/12/2024</td><td>Initial Content</td><td>Updated with Initial content</td></tr><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></tbody></table>
