import { test as base } from '@playwright/test';
import { EmailService } from '../lib/services/email/EmailService';
import { MessageCheckerService } from '../lib/services/email/MessageCheckerService';
import { MailinatorService } from '../lib/services/email/MailinatorService';

type EmailServiceOptions = {
  emailServiceType: string;
};

type EmailServiceFixtures = {
  emailService: EmailService;
};

export const test = base.extend<EmailServiceOptions & EmailServiceFixtures>({
  emailServiceType: ['MessageChecker', { option: true }],
  emailService: async ({ emailServiceType, context }, use) => {
    let emailService: EmailService;
    if (emailServiceType === 'MessageChecker') {
      emailService = new MessageCheckerService(context);
    } else if (emailServiceType === 'Mailinator') {
      emailService = new MailinatorService(context);
    } else {
      throw new Error(`Unknown email service type: ${emailServiceType}`);
    }
    await use(emailService);
  },
});
