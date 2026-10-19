"""Email service — sends transactional emails via SMTP (Gmail-compatible).

Infrastructure layer: wraps Python's standard smtplib with async support
using anyio's thread offload so FastAPI's async event loop stays unblocked.

Environment variables consumed (all in backend/.env):
    MAIL_SERVER       – SMTP host (e.g. smtp.gmail.com)
    MAIL_PORT         – SMTP port (587 for STARTTLS)
    MAIL_USERNAME     – SMTP auth username / sender address
    MAIL_PASSWORD     – SMTP auth password / App Password
    MAIL_FROM         – "From" address shown to recipients
    MAIL_FROM_NAME    – "From" display name
    MAIL_STARTTLS     – use STARTTLS (default True)
    MAIL_SSL_TLS      – use SSL/TLS wrapping (default False)
    USE_CREDENTIALS   – authenticate with username+password (default True)
    VALIDATE_CERTS    – validate TLS certificates (default False for dev)

Never log passwords, OTPs, or reset tokens from this module.
"""
from __future__ import annotations

import logging
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr

import anyio

from app.config import get_settings

logger = logging.getLogger(__name__)
_settings = get_settings()


# ── HTML email templates ───────────────────────────────────────────────────────

_OTP_HTML_TEMPLATE = """\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Fresher360 Password Reset Code</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:16px;overflow:hidden;
                      box-shadow:0 4px 24px rgba(15,23,42,0.08);border:1px solid #e2e8f0;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);
                       padding:32px 40px 28px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="display:inline-block;">
                <tr>
                  <td style="background:rgba(255,255,255,0.15);border-radius:10px;
                             width:42px;height:42px;text-align:center;vertical-align:middle;
                             font-weight:800;font-size:18px;color:#ffffff;letter-spacing:-1px;">
                    FB
                  </td>
                  <td style="padding-left:12px;font-weight:800;font-size:22px;
                             color:#ffffff;letter-spacing:-0.5px;">
                    Fresher360
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0;font-size:15px;color:rgba(255,255,255,0.85);">
                Password Reset Request
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 20px;font-size:16px;color:#334155;line-height:1.6;">
                Hello,
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.7;">
                We received a request to reset the password for your Fresher360 account
                associated with <strong>{email}</strong>. Use the verification code below
                to continue. It expires in <strong>5 minutes</strong>.
              </p>

              <!-- OTP box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;background:#eff6ff;border:2px solid #bfdbfe;
                                border-radius:12px;padding:20px 40px;text-align:center;">
                      <p style="margin:0 0 6px;font-size:12px;font-weight:600;
                                color:#3b82f6;text-transform:uppercase;letter-spacing:1.5px;">
                        Verification Code
                      </p>
                      <p style="margin:0;font-size:36px;font-weight:800;letter-spacing:10px;
                                color:#1e40af;font-family:'Courier New',monospace;">
                        {otp}
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 12px;font-size:14px;color:#64748b;line-height:1.6;">
                If you did not request a password reset, you can safely ignore this email.
                Your password will not be changed.
              </p>
              <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">
                For your security, never share this code with anyone.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;
                       padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                &copy; {year} Fresher360 &mdash; This is an automated message, please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""

_OTP_TEXT_TEMPLATE = """\
Fresher360 – Password Reset Verification Code

Hello,

We received a request to reset the password for your Fresher360 account ({email}).

Your verification code is: {otp}

This code expires in 5 minutes.

If you did not request a password reset, ignore this email.

– Fresher360 Team
"""


# ── SMTP helper ────────────────────────────────────────────────────────────────

def _send_smtp_sync(
    *,
    to_email: str,
    subject: str,
    html_body: str,
    text_body: str,
) -> None:
    """Blocking SMTP send — runs in a thread pool via anyio.to_thread.run_sync."""
    from_addr = _settings.MAIL_FROM
    from_name = _settings.MAIL_FROM_NAME

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = formataddr((from_name, from_addr))
    msg["To"] = to_email

    msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    ctx = ssl.create_default_context() if _settings.VALIDATE_CERTS else ssl._create_unverified_context()

    if _settings.MAIL_SSL_TLS:
        # Direct SSL/TLS connection (port 465)
        with smtplib.SMTP_SSL(
            _settings.MAIL_SERVER, _settings.MAIL_PORT, context=ctx
        ) as smtp:
            if _settings.USE_CREDENTIALS:
                smtp.login(_settings.MAIL_USERNAME, _settings.MAIL_PASSWORD)
            smtp.sendmail(from_addr, to_email, msg.as_string())
    else:
        # STARTTLS connection (port 587)
        with smtplib.SMTP(_settings.MAIL_SERVER, _settings.MAIL_PORT) as smtp:
            smtp.ehlo()
            if _settings.MAIL_STARTTLS:
                smtp.starttls(context=ctx)
                smtp.ehlo()
            if _settings.USE_CREDENTIALS:
                smtp.login(_settings.MAIL_USERNAME, _settings.MAIL_PASSWORD)
            smtp.sendmail(from_addr, to_email, msg.as_string())


# ── Public API ─────────────────────────────────────────────────────────────────

async def send_otp_email(*, to_email: str, otp: str) -> None:
    """Send an OTP verification email for the password-reset flow.

    Runs the blocking SMTP call in a worker thread so the event loop
    is not blocked.

    Never log ``otp`` — the value is security-sensitive.
    """
    from datetime import datetime, timezone
    year = datetime.now(timezone.utc).year

    html_body = _OTP_HTML_TEMPLATE.format(email=to_email, otp=otp, year=year)
    text_body = _OTP_TEXT_TEMPLATE.format(email=to_email, otp=otp)

    try:
        await anyio.to_thread.run_sync(
            lambda: _send_smtp_sync(
                to_email=to_email,
                subject="Your Fresher360 Password Reset Code",
                html_body=html_body,
                text_body=text_body,
            )
        )
        logger.info("email.otp_sent", extra={"to": to_email})
    except Exception as exc:
        # Log the error class but NOT the OTP or credentials
        logger.error(
            "email.send_failed",
            extra={"to": to_email, "error_type": type(exc).__name__},
        )
        raise
