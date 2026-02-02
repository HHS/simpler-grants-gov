# How to edit the wiki

The Simpler.Grants.gov public wiki is a collaborative resource. Any internal team member may submit a change request (CR) to update or add content to the wiki.

### Who to ask for access

Below is a list of administrators who can grant editor permissions, in order of who you should reach out to first:

* Justin Weiss (Nava)
* Billy Daly or Sarah Knopp (A6)
* Margaret Spring (Nava)

### How to make edits

1. Log in to GitBook: [https://app.gitbook.com/](https://app.gitbook.com/)
2. In the top left corner, it should say **Simpler Grants**. If not, you're in the wrong workspace—click it to switch to the correct workspace. If you don't see the option, ask Justin W. or anyone from A6 to give you 'reviewer' permissions.
3. Go to `Public Wiki` , under the `Spaces` section of the left nav.
4. Click `Edit` .
5. Make your changes.
6. Name the change using the instructions in "Git commit history" above.
7. Click the arrow next to `Merge` to open the option to `Request a review` .
8. Add reviewers using the "content owners" table above.
9. When you receive an email that your change was reviewed, use the `Merge` button to publish your changes.

We created a protocol everyone should follow to ensure the wiki aligns with our needs and quality standards.

### Change requests

* **Before merging changes, you must request a review from at least one content owner.** GitBook will email you when the content owner has approved the CR. At that point, you can merge the changes. Use the following table to identify the correct content owner to tag in your request:

<table><thead><tr><th width="218.8125">Type of content</th><th width="245.98046875">Content owners / CR approvers</th><th>Content owners by name (Last reviewed 07-2025)</th></tr></thead><tbody><tr><td><strong>Welcome</strong> page</td><td>Nava Comms Strategist</td><td>Justin W.</td></tr><tr><td><strong>Get involved</strong> section</td><td>Nava Open Source Evangelist<br>Nava Comms Strategist</td><td>Brandon T.<br>Justin W.</td></tr><tr><td><strong>Product</strong> section</td><td>Nava Product Manager</td><td>Max K.<br>Chris W.<br>Eric S. (SimplerFind)<br>Chris K. (SimplerApply) <br>Justin W. (Release Notes)</td></tr><tr><td><strong>Design &#x26; Research</strong> section</td><td>Nava Design Lead</td><td>Andy C.</td></tr><tr><td><strong>References</strong> section</td><td>Nava Comms Strategist</td><td>Justin W.</td></tr></tbody></table>

* Content owners do not need to request a review for their section.
* A6 manages the GitBook and can update any content. Feel free to add them as additional reviewers, especially if you need a fast response or the primary content owner is out of office.
* Structural changes, such as requests to add or delete pages or sections, always require CR approval from the Nava Comms Strategist.
* The Nava Comms Strategist can help individuals with wiki and editing consultations.
* Suggestion: When requesting feedback on a change request, it can be helpful to send the reviewer a Slack message with the following information:
  * A link to (1) the change request and (2) the preview of published docs
  * A summary of the changes
  * A list of people you’re requesting feedback from

### Git commit history

Our official method and source of truth for tracking changes is GitBook’s [commit history](https://github.com/HHS/simpler-grants-gov/commits/main/documentation/wiki). This process automatically captures the person’s name, the changes, and the date/time of the change.\
\
GitBook will generate a default title for the CR as `[Name’s] [Date] changes`. You need to re-title it to match our naming convention.

* Naming convention:
  * `[GitHub issue #]: Short description`
    * Example: `#1234: Altered format of images in brand guidelines`&#x20;
  * Omit the GitHub issue number if none is associated with your changes.
    * Example: `Altered format of images in brand guidelines`&#x20;

<figure><img src=".gitbook/assets/CR Title (1).png" alt="Header of the wiki&#x27;s editor with an arrow pointing to the field where the CR should be re-titled"><figcaption><p>Rename your change request in the top left of the header</p></figcaption></figure>

### Change logs

Change logs have historically existed on each wiki page. However, as of March 2025, we don't have strict guidelines for using the logs.

* Existing change logs will stay, and anyone can add change logs to pages that don’t have one.
* Any contributor may add entries to the logs if desired.
* Tip: Log significant changes (such as updating out-of-date, stale content, or deleting large sections) but not minor changes (such as improvements to spelling, formatting, or clarity). Generally speaking, significant changes provide helpful context to the reader.

