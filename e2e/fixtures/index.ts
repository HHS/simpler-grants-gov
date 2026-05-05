import { mergeTests } from '@playwright/test';
import { test as emailServiceTest } from './email-service-fixture';

export const test = mergeTests(emailServiceTest);
