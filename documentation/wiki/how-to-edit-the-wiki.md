# How to edit the wiki

### Change requests

The Simpler.Grants.gov public wiki is a collaborative resource. Any internal team member may submit a change request (CR) to update or add content to the wiki. We created a protocol everyone must follow to ensure the wiki aligns with our needs and quality standards.

* **Before merging the changes, you must request a review from at least one content owner.** GitBook will email you when the content owner has approved the CR. At that point, you can merge the changes. Use the following table to identify the correct content owner to tag in your request:

<table><thead><tr><th width="218.8125">Type of content</th><th width="245.98046875">Content owners / CR approvers</th><th>Content owners by name</th></tr></thead><tbody><tr><td><strong>Welcome</strong> page</td><td>Nava Content Strategist</td><td>Michelle M.</td></tr><tr><td><strong>Get involved</strong> section</td><td>Nava Open Source Evangelist<br>Nava Content Strategist</td><td>Brandon T.<br>Michelle M.</td></tr><tr><td><strong>Product</strong> section</td><td>Nava Product Manager</td><td>Max K.<br>Chris W.</td></tr><tr><td><strong>Design &#x26; Research</strong> section</td><td>Nava Design Lead<br>Nava Content Strategist</td><td>Andy C.<br>Michelle M.</td></tr><tr><td><strong>References</strong> section</td><td>Nava Content Strategist</td><td>Michelle M.</td></tr></tbody></table>

* Content owners do not need to request a review for their section.
* A6 manages the GitBook and can update any content. Feel free to add them as additional reviewers, especially if you need a fast response or the primary content owner is out of office.
* Structural changes, such as requests to add or delete pages or sections, always require CR approval from the Nava Content Strategist.
* The Nava Content Strategist can help individuals with wiki and editing consultations.
* Suggestion: When requesting feedback on a change request, it can be helpful to send the reviewer a Slack message with the following information:
  * A link to (1) the change request and (2) the preview of published docs
  * A summary of the changes
  * A list of people you’re requesting feedback from

### Git commit history

Our official method and source of truth for tracking changes is GitBook’s [commit history](https://github.com/HHS/simpler-grants-gov/commits/main/documentation/wiki). This process automatically captures the person’s name, the changes, and the date/time of the change.

* When submitting the CR, follow this naming convention:
  * `[GitHub issue #]: Short description`
  * Example: `#1234: Altered format of images in brand guidelines`&#x20;

<figure><img src=".gitbook/assets/CR Title (1).png" alt=""><figcaption><p>Rename your change request in the top left of the header</p></figcaption></figure>

* You may omit the GitHub issue If none is associated with the CR.
  * Example: `Altered format of images in brand guidelines`&#x20;
* Note: GitBook automatically generates a default title for the CR as `[Name’s] [Date] changes`. You will have to change it according to the convention above.

### Change logs

Change logs have historically existed on each wiki page. However, as of March 2025, we don't have strict guidelines for using the logs.

* Existing change logs will stay, and anyone can add change logs to pages that don’t have one.
* Any contributor may add entries to the logs if desired.
* Tip: Log significant changes (such as updating out-of-date, stale content, or deleting large sections) but not minor changes (such as improvements to spelling, formatting, or clarity). Generally speaking, significant changes provide helpful context to the reader.

### How to use GitBook to make edits

1. Log in to GitBook: [https://app.gitbook.com/](https://app.gitbook.com/)
2. In the top left corner, it should say "Simpler Grants." If not, you're in the wrong workspace—click it to switch to the correct workspace.
3. Go to “Public Wiki” under the ’Spaces’ section of the left nav
4. Click “Edit”
5. Make changes
6. Name the change using the instructions in "Git commit history" above
7. Click the arrow next to “Merge” to open the option to "Request a review"
8. Add reviewers using the "content owners" table above
9. When you receive an email that your change was reviewed, use the "Merge" button.

