# Email Setup for Contact Form

## Environment Variables Required

Create a `.env.local` file in your project root with the following variables:

```env
# Gmail Configuration (recommended)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Gmail Setup Instructions

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password for "Mail"
3. **Use the app password** (not your regular Gmail password) in `SMTP_PASS`

## Alternative Email Services

If you prefer to use other email services, modify the transporter in `src/app/api/contact/route.ts`:

### For custom SMTP:

```javascript
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
```

### Additional environment variables for custom SMTP:

```env
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@your-domain.com
SMTP_PASS=your-password
```

## Testing

1. Set up your environment variables
2. Start the development server: `npm run dev`
3. Navigate to `/contact-us`
4. Fill out and submit the form
5. Check your email for the contact form submission

## Security Notes

- Never commit your `.env.local` file to version control
- Use app passwords instead of regular passwords when possible
- Consider using dedicated email services like SendGrid or Resend for production
