export interface EmailHeader {
  id: string;
  to: EmailAddress;
  from: string;
  subject: string;
}

export interface EmailContent {
  text: string;
  html: string;
  emailHeader: EmailHeader;
}

export type EmailAddress = `${string}@${string}.${string}`;

export abstract class EmailService {
  /*
   * Generate a random email address
   */
  abstract generateEmailAddress(username: string): EmailAddress;

  /*
   * Get EmailContent associated with an Email
   */
  abstract getEmailContent(email: EmailHeader): Promise<EmailContent>;

  /*
   * Get all emails sent to an email address
   */
  abstract getInbox(emailAddress: EmailAddress): Promise<EmailHeader[]>;

  /*
   * Return the first email sent to an email address that contains a specific subject sent. Waits for the email for a default amount of time before timing out.
   */
  abstract waitForEmailWithSubject(
    emailAddress: EmailAddress,
    subjectSubstring: string
  ): Promise<EmailContent>;

  /*
   * Generate a random username
   */
  generateUsername(): string {
    const randomStringLength = 10;
    const numBytes = Math.ceil(randomStringLength * 2);
    const randomString = Array.from(crypto.getRandomValues(new Uint8Array(numBytes)))
      .map((b) => b.toString(36))
      .join('')
      .slice(0, randomStringLength);
    return `test-${randomString}`;
  }
}
