const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API Key
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
    console.warn('SENDGRID_API_KEY is not set. Email notifications will not be sent.');
}

/**
 * Send an email notification
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content (optional)
 */
const sendNotificationEmail = async (to, subject, text, html) => {
    console.log(`Attempting to send email to: ${to}`); // Debug log

    if (!process.env.SENDGRID_API_KEY) {
        console.error('SENDGRID_API_KEY is missing in environment variables!');
        return;
    }

    const msg = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL, // Verified sender
        subject,
        text,
        html: html || text.replace(/\n/g, '<br>'),
    };

    try {
        await sgMail.send(msg);
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error);
        if (error.response) {
            console.error(error.response.body);
        }
    }
};

module.exports = {
    sendNotificationEmail
};
