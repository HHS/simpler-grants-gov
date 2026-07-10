# Document Sharing

* **Status:** Accepted
* **Last Modified:** 11/14/2024
* **Deciders:** Lucas, Julius, Billy, Sarah, Margaret, Andy

## Overview

### Context and Problem Statement

The SimplerGrants Project needs a document sharing solution in order to collaborate on work items and deliverables. Examples of work items to be shared for collaboration include: meeting notes, collaborative documents used by the co-design group or code challenge participants, slide decks for internal and/or external briefings, and various other project documents.&#x20;

The goal of this ADR is to evaluate document sharing solutions and determine which one best fits the needs and objectives of this project based on the decision criteria outlined below.

### Decision Drivers

* **Hosting:** Must be SaaS to ensure accessibility and reduce maintenance.&#x20;
* **Usability:** Non-technical users should be able to access and create content with minimal training or guidance.
* **Read-only mode:** Must have the ability to lock editing for some users.
* **Comments:** Reviewers should be able to leave in-line comments on content that they are reviewing.
* **Version History:** Editors should be able to see and restore previous versions of a given page.
* **File Types:** The solution must be compatible with industry standard document file types, including .doc, .pdf, xlsx, .rtf, .txt, .html, .md, .epub, .ods, .tsv, and .csv. The solution should allow users to create and save their documents in these file types, open existing documents in these file types, and edit these file types.
* **Storage:** We don’t have specific storage needs identified at this time, but we would like to be cognizant of storage limits that exist.&#x20;
* **Permissions:** Permissions hierarchies should be robust enough to allow creation of directories that may be shared with the entire program or only with select members of the program.
* **Maintenance Costs:** It should not be prohibitively expensive to maintain the doc sharing platform, both in terms of staff time/resources and direct costs (e.g. hosting fees).

### Options Considered

* Google Workspace
* Github
* Gitbook
* LibreOffice

### Decision Outcome

SimplerGrants will use Google Drive and Google Docs Editors Suite within existing Google Workspace instances from contractors. Additional decisions are needed around which instance will be used for what purpose.

#### Positive Consequences

Google Workspace is a robust solution that meets program needs, needs very little work to implement, does not have additional costs, and has generous storage policies.

#### Negative Consequences

HHS may require contractors to upload, organize, and maintain the files and folders on Google Drive in order to use their Google Workspaces since they will only have access as guests. Additional discussions between contractors will be needed to understand how each Google Workspace will be used.

## Pros and Cons of the Options

### Google Workspace Solution (Google Drive with Google Docs Editors Suite)

Google Workspace is a collection of cloud computing, productivity, and collaboration tools. This solution would entail using the Google Drive and Google Docs Editors Suite tools from Google Workspace in order to satisfy the document sharing requirements.

#### Details

* **Hosting:** SaaS
* **Pricing:** This document assumes that we would use Google Workspace Solutions that one or more SWIFT contractors already have, which results in no added cost for the program.
* **Usability:** Simple for non-technical users
* **Read-only mode:** Yes
* **Comments:** Yes, in-line
* **Version History:** Yes
* **File Types:** supports all required file types, and max file size is 5TB.
* **Storage:** Maximum item quantity is 500,000. No size limit.
* **Permissions:** Can be configured by drive, folder, or document. Allows them to be available to anyone with the link, a specific set of individuals, or private.&#x20;
* **Maintenance Costs:** Low to none

#### Pros:

* Easy and fast to implement, since it is already being used
* Does not need to be acquired because contractors already have it
* Multiple contractors with instances of it mean there are more choices for implementation
* No training required
* No additional costs
* Generous storage policy

#### Cons:

* Multiple contractors with their own Google Workspace instances means some agreement will be needed in order to figure out who is hosting what and where.
* HHS team members will require file management from the contractors whose instance they are using, as they will be guest users.
* HHS team members will need to create their own Google accounts to access Google Workspace and may lack familiarity with the tool. Additional training could be required.

### GitHub

GitHub is a public repository that allows for hosting documents and other content that isn't stored directly within the code repository itself.

#### Details

* **Hosting:** SaaS
* **Pricing:** Free for public repositories
* **Usability:** Not great for non-technical users
* **Read-only mode:** Yes
* **Comments:** No
* **Version History:** Yes
* **File Types:** Supports storage of all required file types, editing of markdown files, and max file size is 100 MB.
* **Storage:** Total repo size should be less than 5 GB.
* **Permissions:** Permissions set per repository (public or private)- all documentation in a repo is available to anyone who can access the repo.&#x20;
* **Maintenance Costs:** None

#### Pros

* Available for free with public repositories
* Anyone with a github license and permissions may use

#### Cons

* One of the hardest-to-use tools for non-technical audiences
* Supports a very limited set of media formats, mainly markdown and images
* Small repo storage max means the program will outgrow it quickly

### GitBook

GitBook is a Software as a Service (SaaS) platform for creating and managing public documentation for a project. GitBook prioritizes version control and collaboration by offering first class support for reviewing and merging content changes. It has become a common documentation and wiki tool for many open source projects.

#### Details

* **Hosting:** SaaS
* **Pricing:** $6.70 (plus) or $12.50 (pro) per user per month
* **Usability:** Program feedback has been mixed. Some training required for non-technical users.
* **Read-only mode:** Yes
* **Comments:** Yes
* **Version History:** Yes
* **File Types:** Does not specify file types supported for storage, supports editing of markdown files, and max file size is 100 MB.
* **Storage:** No storage limit- 500,000 item limit
* **Permissions:** Can be configured by user or organization. Several different options available.
* **Maintenance Costs:** see pricing.

#### Pros

* Public spaces and pages are well organized and searchable which would allow for easy finding of documents
* Supports a wide variety of media and content types
* Supports beginning-of-time page history and version comparison

#### Cons

* Not meant to be a document sharing platform, so document sharing is overly complicated
* Not so friendly for non-technical users
* Doesn’t support editing of file types other than markdown
* External users cannot directly comment or suggest changes in the app
* 100 MB max file size may not be enough in some cases

### LibreOffice

LibreOffice, the successor to OpenOffice, is compatible with O365 files and is backed by a non-profit organization. It has native support for Open Document Format (ODF), an open source document format, and has editors for documents, slides, spreadsheets, drawing, databases, and formula editing. It is an open source software.

#### Details

* **Hosting:** Locally hosted- no SaaS solution available.
* **Pricing:** Free
* **Usability:** Easy to moderate for non-technical users
* **Read-only mode:** Yes
* **Comments:** Yes
* **Version History:** Yes
* **File Types:** all required file types plus ODF
* **Storage:** none- no hosted solution
* **Permissions:** none- no hosted solution
* **Maintenance Costs:** Low to none for editing. However, lack of hosted/SaaS solution implies a very high cost to find a solution that allows for sharing documents.

#### Pros

* Impressive commitment to open source ethos- much like SimplerGrants
* Supports many types of files and editing

#### Cons

* Lack of a hosted/SaaS solution disqualifies this solution.&#x20;

## Links

* [Google Workspace](https://workspace.google.com/)
* [Github](https://github.com/about)
* [Gitbook](https://www.gitbook.com/)
* [LibreOffice](https://www.libreoffice.org/)

<br>
