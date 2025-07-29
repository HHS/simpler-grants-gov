# Use Condens.io + Public Wiki for Design Research Repository

* **Status:** Active
* **Last Modified:** July 25, 2025
* **Related Issue:** [https://github.com/HHS/simpler-grants-gov/issues/4855](https://github.com/HHS/simpler-grants-gov/issues/4855)&#x20;
* **Deciders:** Crystabel Rangel (w/ Andy Cochran, Wendy Fong, Julius Chang)&#x20;
* **Tags:** design, research, tool, transparency

## Context and Problem Statement

We want research tooling that supports both 1) internal research operations and 2) public-facing research transparency. This tooling should help our team work more efficiently and effectively, and increase project transparency within the team, for leadership, and to the public.&#x20;

## Decision Drivers

### **Problem 1: Internal Research Repository Needs**

The appropriate internal research repository tool will…&#x20;

* Increase efficiency by reducing the time spent manually organizing, categorizing, annotating, and searching through research notes/videos/spreadsheets/etc.&#x20;
* Allow for improved cross referencing of study efforts and past research
* Provide data access to the entire internal team, documenting researchers' thinking and allowing anyone to interpret findings on their own&#x20;
* Securely handle PII and sensitive information (storing it in a single dedicated space)
* Simplify anonymization and exporting/copying findings for public sharing&#x20;
* Allow robust sorting, filtering, and grouping of research&#x20;
* Include strong transcription capabilities&#x20;
* Support multiple media inputs (video, audio, documents, etc.)&#x20;
* Offer good export options (e.g. spreadsheets, documents, PDFs)&#x20;
* Be a Nava-approved tool (security, compliance)&#x20;

### **Problem 2: Public-Facing Research Repository Needs**

* Share detailed insights without exposing raw notes&#x20;
* Remove or mask any PII&#x20;
* Promote transparency&#x20;
* Enable sharing with broader audiences (e.g. Co-Design Group, open source, general public)&#x20;

## Options Considered

* Dovetail&#x20;
* Qualie&#x20;
* Condense&#x20;
* Public Wiki&#x20;

## Decision Outcome

Use Condens.io for internal research operations and the Public Wiki for external transparency.

**(Problem 1)** Condens meets/exceeds all requirements, including:&#x20;

* **AI-powered transcription** — Automatically transcribes audio and video recordings, saving time and effort in data processing.&#x20;
* **Data organization** — Centralizes all research data (recordings, notes, comments, findings) in a single secure and searchable repo, which can be shared across research efforts for Simpler.Grants.gov _**and**_ SimplerNOFOs.&#x20;
* **Powerful search capabilities** — Quickly find specific insights using keywords/tags/filters. You can ask its AI complex questions, and it packages up the relevant data.&#x20;
* **Collaboration & transparency** — Unlimited read-only accounts provide a self-serve knowledge hub for entire internal team to explore the data, leave comments, share insights, come to their own conclusions/findings, and build reports together.&#x20;
* **Reporting** — Create reports, visualizations, affinity diagrams, and artifacts to identify patterns and themes in research data that can be shared with team (and anonymized for the public).
* **Integration** — Zoom and Google Drive make importing/exporting easy.&#x20;

**(Problem 2)** The Public Wiki is already being used for our public-facing documentation needs. Sharing research findings there will avoid the need for stakeholders to visit yet another tool. And it enforces a clear separation of data that'd public on the wiki (anonymized findings reports, recommendations) and what should remain in Condens (session notes, PII).&#x20;

[Condens Overview - Watch Video](https://www.loom.com/share/74be84e0f1b04fe782dc024e42608e0f) [![](https://cdn.loom.com/sessions/thumbnails/74be84e0f1b04fe782dc024e42608e0f-ad2d8f58dd7753eb-full-play.gif)](https://www.loom.com/share/74be84e0f1b04fe782dc024e42608e0f)

### Positive Consequences

* Increased research operations efficiency&#x20;
* Improved transparency (internal and public)&#x20;
* Easily-shared data allowing whole team to arrive at conclusions/findings (with unlimited veiw-only accounts)&#x20;
* Separation of concerns having both _private_ and _public_ research repositories&#x20;

### Negative Consequences

* Additional project costs&#x20;
* Limited number of licenses/seats for researchers

## Pros and Cons of the Options

### Dovetail

[https://dovetail.com/](https://dovetail.com/) — score: **3.42** (out of 5)

* **Pros**
  * Good auto-categorization of research data, provides good high level summaries&#x20;
  * Fast querying across all video file data in the project&#x20;
  * Good video/audio processing&#x20;
  * Good transcription&#x20;
* **Cons**
  * No view-only access (can't share among internal team w/o licenses)&#x20;
  * No AI-assisted tagging (requires labor-intensive manual tagging)&#x20;
  * Queries must be simple and direct&#x20;
  * Sorting capabilities are basic, based on manual grouping&#x20;
  * PII security requires manual handling, unable to blur name/face in video&#x20;
  * Only supports spreadsheet export; no PDF import/export&#x20;
  * Bit of a learning curve&#x20;

### Qualie

[https://www.qualie.ai/](https://www.qualie.ai/) — score: **3.46** (out of 5)

* **Pros**
  * Excellent auto-categorization of research data (you create key questions and highlights get automatically added)
  * Good automated insight generation and sorting/grouping capabilities&#x20;
  * Excellent querying capabilities&#x20;
  * Good video/audio processing&#x20;
* **Cons**
  * No view-only access — unlimited accounts, but fees are charged per interview not by seat
  * Sufficient tagging, but done by user role (not in transcript)&#x20;
  * Does not store participant information&#x20;
  * Unable to share video clips externally or anonymize participants&#x20;
  * Only _limited_ spreadsheet export; no PDF import/export

### Condense

[https://condens.io/](https://condens.io/) — score: **4.67** (out of 5)

* **Pros**
  * Unlimited view-only accounts do not require license (internal team can browse all data and even leave comments)&#x20;
  * Good AI-assisted auto-categorization of research data, provides suggestions based on tags created (but does not auto tag)&#x20;
  * Excellent querying capabilities&#x20;
  * Excellent encrypted PII handling&#x20;
  * Excellent data organization&#x20;
    * Session information can be customized to use as sort options
    * Global _**and**_ project-specific taxonomies&#x20;
  * Excellent video/audio processing (including PDF imports!)
  * Excellent transcription&#x20;
  * Excellent export options
    * Can download whiteboards as images or public link
    * Artifacts can be printed or exported for private/public sharing&#x20;
* **Cons**
  * Although public links can hide names and tags, unable to blur face or video (but feature is in development, per onboarding call w/ support)&#x20;

## Links

* [Google Sheet with detailed analysis](https://docs.google.com/spreadsheets/d/1oM28qOTsRtVMEsjctBweZPAyyiaB-TjuF6SlcSfDZLs/edit?gid=0#gid=0)&#x20;
* [https://github.com/HHS/simpler-grants-gov/issues/4855](https://github.com/HHS/simpler-grants-gov/issues/4855)&#x20;
