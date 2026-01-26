import { BrowserContext, Page, expect } from '@playwright/test';
import { EmailAddress, EmailContent, EmailHeader, EmailService } from './EmailService';

export class MailinatorService extends EmailService {
  context: BrowserContext;

  constructor(context: BrowserContext) {
    super();
    this.context = context;
  }

  generateEmailAddress(username: string): EmailAddress {
    return `${username}@mailinator.com`;
  }

  // Action functions
  async getInbox(emailAddress: EmailAddress): Promise<EmailHeader[]> {
    const mailinatorURL = this.buildMailinatorURLToInbox(emailAddress);
    const mailinatorPage = await this.openNewPage(mailinatorURL);

    // Wait for email rows to load
    const rows = mailinatorPage.locator(this.SELECTORS.inbox.emailRow);

    const rowCount = await rows.count();
    console.log(`Found ${rowCount} email(s) in the inbox.`);

    const fromSelector = this.SELECTORS.inbox.cells.from;
    const subjectSelector = this.SELECTORS.inbox.cells.subject;

    const inboxEntries: EmailHeader[] = await rows.evaluateAll(
      (rows, { emailAddress, fromSelector, subjectSelector }) => {
        const entries: EmailHeader[] = [];
        for (const row of rows) {
          const fullRowId = row.getAttribute('id') || ''; // e.g., 'row_test+2f4e8guu-1734141721-9052847012'
          const extractedId = fullRowId.split('-').slice(-2).join('-'); // just the ID portion: 1734141721-9052847012
          entries.push({
            id: extractedId,
            to: emailAddress,
            from: row.querySelector(fromSelector)?.textContent?.trim() || '',
            subject: row.querySelector(subjectSelector)?.textContent?.trim() || '',
          });
        }
        return entries;
      },
      { emailAddress, fromSelector, subjectSelector }
    );

    await mailinatorPage.close();
    return inboxEntries;
  }

  async getEmailContent(emailHeader: EmailHeader): Promise<EmailContent> {
    const directEmailURL = this.buildMailinatorURLToEmail(emailHeader);
    const emailPage = await this.openNewPage(directEmailURL);

    await emailPage.waitForSelector(this.SELECTORS.email.iframe);

    const iframe = emailPage.frame({ name: this.SELECTORS.email.iframeName });
    const text = (await iframe?.textContent(this.SELECTORS.email.body)) || '';
    const html = (await iframe?.evaluate(() => document.body.innerHTML)) || '';

    await emailPage.close();
    return { text, html, emailHeader };
  }

  async waitForEmailWithSubject(
    emailAddress: EmailAddress,
    subjectSubstring: string
  ): Promise<EmailContent> {
    const mailinatorURL = this.buildMailinatorURLToInbox(emailAddress);
    const mailinatorPage = await this.openNewPage(mailinatorURL);

    const matchingEmail = mailinatorPage
      .locator(this.SELECTORS.inbox.emailRowTR)
      .filter({ hasText: subjectSubstring })
      .first();

    await matchingEmail.waitFor();
    const idAttribute = await matchingEmail.getAttribute('id');
    expect(idAttribute, 'Email row missing required ID attribute').not.toBeNull();
    const emailHeaderId = idAttribute!.split('-').slice(-2).join('-');

    const emailHeader: EmailHeader = {
      id: emailHeaderId,
      to: emailAddress,
      from: await matchingEmail.locator('td:nth-of-type(2)').innerText(),
      subject: await matchingEmail.locator('td:nth-of-type(3)').innerText(),
    };

    return this.getEmailContent(emailHeader);
  }

  private static readonly MAILINATOR_BASE_URL = 'https://www.mailinator.com/v4/public/inboxes.jsp';
  private readonly SELECTORS = {
    inbox: {
      emailRow: '[ng-repeat="email in emails"]',
      emailRowTR: "tr[ng-repeat='email in emails']",
      cells: {
        from: 'td:nth-of-type(2)',
        subject: 'td:nth-of-type(3)',
      },
    },
    email: {
      iframe: 'iframe[name="html_msg_body"]',
      iframeName: 'html_msg_body',
      body: 'body',
    },
  };

  // Helpers
  private buildMailinatorURLToEmail(emailHeader: EmailHeader): string {
    const encodedEmailPrefix = this.getEncodedEmailPrefix(emailHeader.to);
    return `${MailinatorService.MAILINATOR_BASE_URL}?msgid=${encodedEmailPrefix}-${emailHeader.id}`;
  }

  private buildMailinatorURLToInbox(emailAddress: string): string {
    const encodedEmailPrefix = this.getEncodedEmailPrefix(emailAddress);
    return `${MailinatorService.MAILINATOR_BASE_URL}?to=${encodedEmailPrefix}`;
  }

  private getEncodedEmailPrefix(emailAddress: string): string {
    return encodeURIComponent(emailAddress.split('@')[0]);
  }

  private async openNewPage(url: string): Promise<Page> {
    const page = await this.context.newPage();
    await page.goto(url);
    return page;
  }
}
