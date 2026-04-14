import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

/**
 * Initialize SendGrid with API key from environment.
 * Call once at app bootstrap (after NestJS ConfigModule is ready).
 *
 * Required env vars:
 *   SENDGRID_API_KEY   — SendGrid API key (starts with SG.)
 *   EMAIL_FROM         — Verified sender address (e.g. noreply@bigfamfestival.com)
 *   EMAIL_FROM_NAME    — Sender display name (e.g. Big Fam Festival)
 */
export function initSendGrid(configService: ConfigService): void {
  const apiKey = configService.get<string>('SENDGRID_API_KEY');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  if (!apiKey) {
    if (nodeEnv === 'production') {
      console.warn('[SendGrid] SENDGRID_API_KEY not set in production — transactional email disabled');
    }
    return;
  }

  sgMail.setApiKey(apiKey);
}

export interface SendGridEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  templateId?: string;
  dynamicTemplateData?: Record<string, any>;
}

/**
 * Send a transactional email via SendGrid.
 * Returns true on success, false if SendGrid is not configured (dev).
 * Throws on send failure in production.
 */
export async function sendEmail(
  options: SendGridEmailOptions,
  configService: ConfigService,
): Promise<boolean> {
  const apiKey = configService.get<string>('SENDGRID_API_KEY');
  if (!apiKey) {
    console.warn('[SendGrid] Skipping email send — SENDGRID_API_KEY not set');
    return false;
  }

  const from = {
    email: configService.get<string>('EMAIL_FROM', 'noreply@bigfamfestival.com'),
    name: configService.get<string>('EMAIL_FROM_NAME', 'Big Fam Festival'),
  };

  const msg: sgMail.MailDataRequired = {
    to: options.to,
    from,
    subject: options.subject,
    ...(options.text && { text: options.text }),
    ...(options.html && { html: options.html }),
    ...(options.templateId && { templateId: options.templateId }),
    ...(options.dynamicTemplateData && { dynamicTemplateData: options.dynamicTemplateData }),
  };

  await sgMail.send(msg);
  return true;
}
