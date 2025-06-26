import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, message } = await request.json();

    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json(
        { error: "all fields are required." },
        { status: 400 }
      );
    }

    // Create transporter with Gmail (you can change this to your preferred email service)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER, // Your Gmail address
        pass: process.env.SMTP_PASS, // Your Gmail app password
      },
    });

    // Email data
    const emailData = {
      from: process.env.SMTP_USER, // Your sending email address
      to: "nairakash05@gmail.com", // Target email address
      replyTo: email, // User's email for replies
      subject: `New Contact Form Submission from ${firstName} ${lastName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; border-bottom: 2px solid #000; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          <div style="margin: 20px 0;">
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          </div>
          <div style="margin: 20px 0;">
            <h3 style="color: #333;">Message:</h3>
            <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #000; margin: 10px 0;">
              ${message.replace(/\n/g, "<br>")}
            </div>
          </div>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px;">
            <p>This message was sent from the June Of contact form.</p>
          </div>
        </div>
      `,
    };

    // Send email
    await transporter.sendMail(emailData);

    return NextResponse.json(
      { success: true, message: "message sent successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "internal server error.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
