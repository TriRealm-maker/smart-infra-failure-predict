import { Router } from 'express';

const router = Router();

interface TestResult {
  provider: string;
  apiKeyConfigured: boolean;
  apiAccessible: boolean;
  errorCode: string | null;
  errorMessage: string | null;
}

const testBrevoApi = async (): Promise<TestResult> => {
  const apiKey = process.env.BREVO_API_KEY;
  
  if (!apiKey) {
    return {
      provider: 'Brevo HTTP API',
      apiKeyConfigured: false,
      apiAccessible: false,
      errorCode: 'MISSING_API_KEY',
      errorMessage: 'BREVO_API_KEY environment variable is not set'
    };
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      } as Record<string, string>,
      body: JSON.stringify({
        sender: { name: 'CrisisGuard', email: process.env.EMAIL_USER },
        to: [{ email: process.env.EMAIL_USER }],
        subject: 'Test',
        htmlContent: '<p>Test</p>'
      })
    });

    if (response.status === 400) {
      return {
        provider: 'Brevo HTTP API',
        apiKeyConfigured: true,
        apiAccessible: true,
        errorCode: null,
        errorMessage: null
      };
    }

    const error = await response.json().catch(() => ({})) as { message?: string };
    return {
      provider: 'Brevo HTTP API',
      apiKeyConfigured: true,
      apiAccessible: false,
      errorCode: String(response.status),
      errorMessage: error.message || 'Unknown error'
    };
  } catch (error: unknown) {
    const err = error as { message?: string };
    return {
      provider: 'Brevo HTTP API',
      apiKeyConfigured: true,
      apiAccessible: false,
      errorCode: 'NETWORK_ERROR',
      errorMessage: err.message || 'Failed to connect to Brevo API'
    };
  }
};

router.get('/email', async (req, res) => {
  const result = await testBrevoApi();
  res.json({ results: [result] });
});

export default router;
