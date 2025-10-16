import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app

def send_password_reset_email(email, username, reset_token):
    """
    Send password reset email
    In production, this would send an actual email
    For development, we'll just log the reset link
    """
    try:
        # Generate reset URL
        base_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        reset_url = f"{base_url}/reset-password?token={reset_token}"
        
        # Email content
        subject = "Password Reset Request - RENU-CERT CyberLab"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Password Reset</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #1e40af; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background: #f9f9f9; }}
                .button {{ display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ padding: 20px; text-align: center; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>RENU-CERT CyberLab</h1>
                </div>
                <div class="content">
                    <h2>Password Reset Request</h2>
                    <p>Hello {username},</p>
                    <p>We received a request to reset your password for your RENU-CERT CyberLab account.</p>
                    <p>Click the button below to reset your password:</p>
                    <a href="{reset_url}" class="button">Reset Password</a>
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; background: #eee; padding: 10px; border-radius: 3px;">{reset_url}</p>
                    <p><strong>This link will expire in 24 hours.</strong></p>
                    <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
                </div>
                <div class="footer">
                    <p>This is an automated message from RENU-CERT CyberLab. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Password Reset Request - RENU-CERT CyberLab
        
        Hello {username},
        
        We received a request to reset your password for your RENU-CERT CyberLab account.
        
        To reset your password, visit this link:
        {reset_url}
        
        This link will expire in 24 hours.
        
        If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
        
        ---
        RENU-CERT CyberLab
        """
        
        # In development, just log the reset link
        if current_app.config.get('ENV') == 'development' or os.getenv('FLASK_ENV') == 'development':
            current_app.logger.info(f"Password reset email for {email}:")
            current_app.logger.info(f"Reset URL: {reset_url}")
            current_app.logger.info(f"Token: {reset_token}")
            return True
        
        # In production, send actual email
        # This is a placeholder - you would configure with your email service
        # (SendGrid, AWS SES, etc.)
        
        # For now, just log in production too
        current_app.logger.info(f"Password reset email for {email}:")
        current_app.logger.info(f"Reset URL: {reset_url}")
        
        return True
        
    except Exception as e:
        current_app.logger.error(f"Failed to send password reset email: {e}")
        raise e

def send_welcome_email(email, username):
    """Send welcome email to new users"""
    try:
        base_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        
        subject = "Welcome to RENU-CERT CyberLab"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Welcome</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #1e40af; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background: #f9f9f9; }}
                .button {{ display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ padding: 20px; text-align: center; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>RENU-CERT CyberLab</h1>
                </div>
                <div class="content">
                    <h2>Welcome to RENU-CERT CyberLab!</h2>
                    <p>Hello {username},</p>
                    <p>Welcome to RENU-CERT CyberLab! Your account has been successfully created.</p>
                    <p>You can now start exploring cybersecurity challenges and improving your skills.</p>
                    <a href="{base_url}" class="button">Get Started</a>
                    <p>If you have any questions, feel free to contact our support team.</p>
                </div>
                <div class="footer">
                    <p>This is an automated message from RENU-CERT CyberLab. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # In development, just log
        if current_app.config.get('ENV') == 'development' or os.getenv('FLASK_ENV') == 'development':
            current_app.logger.info(f"Welcome email for {email}:")
            current_app.logger.info(f"Username: {username}")
            return True
        
        # In production, send actual email
        current_app.logger.info(f"Welcome email for {email}: {username}")
        
        return True
        
    except Exception as e:
        current_app.logger.error(f"Failed to send welcome email: {e}")
        raise e
