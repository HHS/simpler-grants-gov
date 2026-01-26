import { BrowserContext, Locator, Page, expect } from '@playwright/test';
import { EmailAddress, EmailContent, EmailHeader, EmailService } from './EmailService';

export class MessageCheckerService extends EmailService {
  context: BrowserContext;

  constructor(context: BrowserContext) {
    super();
    this.context = context;
  }

  generateEmailAddress(username: string): EmailAddress {
    return `${username}@message-checker.appspotmail.com`;
  }

  // Action functions
  async getInbox(emailAddress: EmailAddress): Promise<EmailHeader[]> {
    const messageCheckerURL = this.buildMessageCheckerURLToInbox(emailAddress);
    const messageCheckerPage = await this.openNewPage(messageCheckerURL);

    try {
      const inboxEntries: EmailHeader[] = [];

      // Get all rows excluding the table header row
      const rows = (await messageCheckerPage.getByRole('row').all()).slice(1);

      for (const row of rows) {
        const emailHeader = await this.createEmailHeaderFromRow(row, emailAddress);
        inboxEntries.push(emailHeader);
      }
      return inboxEntries;
    } finally {
      await messageCheckerPage.close();
    }
  }

  async getEmailContent(emailHeader: EmailHeader): Promise<EmailContent> {
    const directEmailURL = this.buildMessageCheckerURLToEmail(emailHeader);
    const emailPage = await this.openNewPage(directEmailURL);
    try {
      const container = emailPage.getByRole('document');
      const text = await container.innerText();
      const html = await container.innerHTML();

      return { text, html, emailHeader };
    } finally {
      await emailPage.close();
    }
  }

  async waitForEmailWithSubject(
    emailAddress: EmailAddress,
    subjectSubstring: string
  ): Promise<EmailContent> {
    const inboxURL = this.buildMessageCheckerURLToInbox(emailAddress);
    const inboxPage = await this.openNewPage(inboxURL);
    try {
      const matchingRow = inboxPage.getByRole('row').filter({ hasText: subjectSubstring }).first();

      // Email can take a while to be received
      await matchingRow.waitFor({ timeout: 3 * 60 * 1000 });

      const emailHeader = await this.createEmailHeaderFromRow(matchingRow, emailAddress);

      return this.getEmailContent(emailHeader);
    } finally {
      await inboxPage.close();
    }
  }

  private static readonly MESSAGE_CHECKER_BASE_URL = 'https://message-checker.appspot.com';

  // Helpers
  private buildMessageCheckerURLToEmail(emailHeader: EmailHeader): string {
    return `${MessageCheckerService.MESSAGE_CHECKER_BASE_URL}/message-body/${emailHeader.id}`;
  }

  private async createEmailHeaderFromRow(
    row: Locator,
    emailAddress: EmailAddress
  ): Promise<EmailHeader> {
    const subjectLink = row.getByRole('cell').first().getByRole('link');
    const subject = (await subjectLink.innerText()).trim();

    // EmailLink format: /message-body/{email-id}
    // Split by "/" and get item at index 2 to extract email-id
    const emailLink = (await subjectLink.getAttribute('href')) ?? '';
    const emailId = emailLink.split('/')[2];

    return {
      id: emailId,
      to: emailAddress,
      from: '', // No sender information in MessageChecker
      subject,
    };
  }

  private buildMessageCheckerURLToInbox(emailAddress: string): string {
    const encodedEmailPrefix = this.getEncodedEmailPrefix(emailAddress);
    return `${MessageCheckerService.MESSAGE_CHECKER_BASE_URL}/address/${encodedEmailPrefix}`;
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
