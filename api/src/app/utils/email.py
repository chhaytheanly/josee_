from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from src.app.config.config import settings

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=settings.MAIL_STARTTLS,
    MAIL_SSL_TLS=settings.MAIL_SSL_TLS,
    USE_CREDENTIALS=True
)

async def send_reset_email(email: str, token: str):
    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"

    message = MessageSchema(
        subject="Reset Password",
        recipients=[email],
        body=f"""
        Click the link below to reset your password:

        {reset_link}

        This link will expire in 30 minutes.

        If you did not request a password reset, please ignore this email.
        """,
        subtype="plain"
    )

    fm = FastMail(conf)
    await fm.send_message(message)
