import getFormData from 'src/utils/getFormData';
import { getSession } from 'src/services/auth/session';
import { getApplicationFormDetails } from 'src/services/fetch/fetchers/applicationFetcher';

jest.mock('src/services/auth/session', () => ({
  getSession: jest.fn(),
}));
jest.mock('src/services/fetch/fetchers/applicationFetcher', () => ({
  getApplicationFormDetails: jest.fn(),
}));
jest.mock('src/components/applyForm/utils', () => ({
  processFormSchema: jest.fn(() => ({})),
}));
jest.mock('src/components/applyForm/validate', () => ({
  validateUiSchema: jest.fn(() => null),
}));

describe('getFormData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns UnauthorizedError if no session and no internalToken', async () => {
    (getSession as jest.Mock).mockResolvedValue(null);
    const result = await getFormData({ applicationId: 'app1', appFormId: 'form1' });
    expect(result).toEqual({ error: 'UnauthorizedError' });
  });

  it('returns TopLevelError if API response status is not 200', async () => {
    (getSession as jest.Mock).mockResolvedValue({ token: 'session-token' });
    (getApplicationFormDetails as jest.Mock).mockResolvedValue({ status_code: 500, data: {} });
    const result = await getFormData({ applicationId: 'app1', appFormId: 'form1' });
    expect(result).toEqual({ error: 'TopLevelError' });
  });

  it('returns TopLevelError if no form data', async () => {
    (getSession as jest.Mock).mockResolvedValue({ token: 'session-token' });
    (getApplicationFormDetails as jest.Mock).mockResolvedValue({ status_code: 200, data: {} });
    const result = await getFormData({ applicationId: 'app1', appFormId: 'form1' });
    expect(result).toEqual({ error: 'TopLevelError' });
  });

  it('returns TopLevelError if application_form_id does not match', async () => {
    (getSession as jest.Mock).mockResolvedValue({ token: 'session-token' });
    (getApplicationFormDetails as jest.Mock).mockResolvedValue({
      status_code: 200,
      data: { form: { form_id: 'form1', form_name: 'Test', form_json_schema: {}, form_ui_schema: {} }, application_form_id: 'wrong-id' },
    });
    const result = await getFormData({ applicationId: 'app1', appFormId: 'form1' });
    expect(result).toEqual({ error: 'TopLevelError' });
  });

  it('returns data on success', async () => {
    (getSession as jest.Mock).mockResolvedValue({ token: 'session-token' });
    (getApplicationFormDetails as jest.Mock).mockResolvedValue({
      status_code: 200,
      data: {
        form: {
          form_id: 'form1',
          form_name: 'Test',
          form_json_schema: {},
          form_ui_schema: {},
        },
        application_form_id: 'form1',
        application_response: { foo: 'bar' },
      },
      warnings: [],
    });
    const result = await getFormData({ applicationId: 'app1', appFormId: 'form1' });
    expect(result).toEqual({
      data: {
        applicationResponse: { foo: 'bar' },
        applicationFormData: {
          form: {
            form_id: 'form1',
            form_name: 'Test',
            form_json_schema: {},
            form_ui_schema: {},
          },
          application_form_id: 'form1',
          application_response: { foo: 'bar' },
        },
        formId: 'form1',
        formName: 'Test',
        formSchema: {},
        formUiSchema: {},
        formValidationWarnings: [],
      },
    });
  });
});
