# Feature Specification: Custom SMTP for Firebase Email Deliverability

**Jira**: [BFF-52](https://eriksensolutions.atlassian.net/browse/BFF-52)  
**Feature Branch**: `BFF-52-custom-smtp-email-deliverability`  
**Created**: 2025-07-11  
**Status**: Draft  

---

## Overview

Configure a custom SMTP provider for Firebase Authentication emails to ensure password resets, email verifications, and other transactional emails land in users' inboxes rather than spam folders.

### Current State
- **Email Sender**: Default Firebase `noreply@*.firebaseapp.com`
- **Deliverability**: Emails flagged as spam by Gmail, Outlook, Yahoo, iCloud
- **Templates**: Generic Firebase branding, no customization
- **DNS Auth**: No SPF, DKIM, or DMARC records for sender domain
- **Impact**: Users requesting password resets may never see the email

### Target State
- **Email Sender**: Branded address (e.g., `noreply@bigfamfestival.com`)
- **Deliverability**: Emails arrive in inbox for all major providers
- **Templates**: Big Fam Festival branded email templates
- **DNS Auth**: SPF, DKIM, and DMARC records configured and passing
- **SMTP Provider**: SendGrid (free tier: 100 emails/day) or equivalent

### Context

Discovered during [BFF-50](https://eriksensolutions.atlassian.net/browse/BFF-50) (Firebase Auth Migration) testing — the password reset flow works functionally, but emails go to spam with the default Firebase sender address.

---

## Constitution Compliance Checklist

- [ ] **Security**: SMTP credentials stored securely in Firebase Console (not in code)
- [ ] **Observability**: Email delivery metrics available via SMTP provider dashboard
- [ ] **Testing**: Verified delivery to Gmail, Outlook, Yahoo, and iCloud
- [ ] **Documentation**: DNS record requirements and SMTP configuration documented

---

## User Scenarios & Testing

### User Story 1 - Password Reset Email Delivery (Priority: P1)

As a user who forgot my password, I want the reset email to arrive in my inbox (not spam), so that I can regain access to my account reliably.

**Why this priority**: Core deliverability — if reset emails go to spam, users can't recover accounts without admin intervention.

**Independent Test**: Trigger password reset for test accounts on Gmail, Outlook, Yahoo, and iCloud. Verify email arrives in inbox within 2 minutes.

**Acceptance Criteria**:
1. **Given** a user requests a password reset, **When** Firebase sends the email via custom SMTP, **Then** the email arrives in the user's inbox (not spam)
2. **Given** a password reset email, **When** the user inspects the sender, **Then** it shows the branded domain (e.g., `noreply@bigfamfestival.com`)

---

### User Story 2 - Branded Email Templates (Priority: P2)

As a user receiving emails from the app, I want them to look professional and match the festival branding, so that I trust the email is legitimate.

**Why this priority**: Branding builds trust and reduces users marking emails as spam.

**Independent Test**: Trigger each email type (password reset, email verification, email change) and verify branding matches Big Fam Festival design.

**Acceptance Criteria**:
1. **Given** any Firebase Auth email, **When** the user opens it, **Then** it displays Big Fam Festival branding (logo, colors, styling)
2. **Given** a password reset email, **When** the user reads it, **Then** the copy is clear, branded, and includes festival-relevant messaging

---

### User Story 3 - DNS Authentication (Priority: P1)

As a system administrator, I want proper DNS records configured, so that emails pass authentication checks and aren't flagged as spam.

**Why this priority**: Without SPF/DKIM/DMARC, even custom SMTP emails may be flagged.

**Independent Test**: Use mail-tester.com or MXToolbox to verify SPF, DKIM, and DMARC records pass for the sending domain.

**Acceptance Criteria**:
1. **Given** the sending domain, **When** checked via MXToolbox, **Then** SPF record passes validation
2. **Given** the sending domain, **When** checked via MXToolbox, **Then** DKIM record passes validation
3. **Given** the sending domain, **When** checked via MXToolbox, **Then** DMARC record passes validation

---

### Edge Cases

- What happens if the SMTP provider (SendGrid) goes down? Firebase falls back to default sender.
- What happens if the free tier sending limit (100/day) is exceeded? Emails may be delayed or rejected.
- How does the system handle emails to addresses with strict corporate spam filters?

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST send all Firebase Auth emails via a custom SMTP provider
- **FR-002**: System MUST use a branded sender address (e.g., `noreply@bigfamfestival.com`)
- **FR-003**: System MUST have SPF, DKIM, and DMARC DNS records configured for the sender domain
- **FR-004**: Email templates MUST be customized with Big Fam Festival branding
- **FR-005**: Password reset emails MUST arrive in inbox (not spam) for Gmail, Outlook, Yahoo, and iCloud
- **FR-006**: SMTP credentials MUST be configured only in Firebase Console (never in source code)

### Implementation Tasks

1. **Choose SMTP Provider**: SendGrid free tier (100 emails/day) recommended
2. **Create SendGrid Account**: Sign up, verify sender domain, generate API key
3. **Firebase Console → Authentication → Templates**: 
   - Configure custom SMTP settings (host, port, username, password)
   - Set custom sender name and email address
4. **DNS Configuration** (via domain registrar):
   - Add SPF record: `v=spf1 include:sendgrid.net ~all`
   - Add DKIM record: CNAME records provided by SendGrid
   - Add DMARC record: `v=DMARC1; p=quarantine; rua=mailto:dmarc@bigfamfestival.com`
5. **Email Template Customization**:
   - Password reset template
   - Email address verification template
   - Email address change template
6. **Testing**: Verify delivery to major providers

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Password reset emails arrive in inbox (not spam) for 95%+ of recipients across Gmail, Outlook, Yahoo, iCloud
- **SC-002**: Email sender shows branded domain in all Firebase Auth emails
- **SC-003**: SPF, DKIM, and DMARC all pass validation on MXToolbox or mail-tester.com
- **SC-004**: Zero support tickets related to "didn't receive password reset email" after implementation

---

## Related Resources

**External References**:
- **Jira Ticket**: [BFF-52](https://eriksensolutions.atlassian.net/browse/BFF-52) - Configure Custom SMTP for Firebase Email Deliverability
- **Related Ticket**: [BFF-50](https://eriksensolutions.atlassian.net/browse/BFF-50) - Firebase Auth Migration (where this issue was discovered)
- **Firebase Docs**: [Customize email handler](https://firebase.google.com/docs/auth/custom-email-handler)
- **Firebase Docs**: [Use custom SMTP server](https://firebase.google.com/docs/auth/email-custom-smtp)
- **SendGrid**: [Free tier](https://sendgrid.com/pricing/) - 100 emails/day
