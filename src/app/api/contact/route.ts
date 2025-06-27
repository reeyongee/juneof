import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, message } = await request.json();

    // --- Server-Side Validation ---
    if (!firstName || !lastName || !email || !message) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format." },
        { status: 400 }
      );
    }
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error("SMTP environment variables are not set.");
      return NextResponse.json(
        { error: "Server configuration error." },
        { status: 500 }
      );
    }

    // --- Nodemailer Transporter Setup ---
    // This transporter uses your Google Workspace account to send the email.
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS, // Use the App Password here
      },
    });

    // --- Email Content Setup ---
    const mailOptions = {
      from: `"${firstName} ${lastName} via Juneof" <${process.env.SMTP_USER}>`,
      to: "reach@juneof.com", // The email inbox where you want to receive messages
      replyTo: email, // IMPORTANT: Ensures your replies go to the user
      subject: `New Contact Form Submission from ${firstName} ${lastName}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>New Message from Juneof Contact Form</h2>
          <p><strong>Name:</strong> ${firstName} ${lastName}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <hr>
          <h3>Message:</h3>
          <p>${message.replace(/\n/g, "<br>")}</p>
        </div>
      `,
    };

    // --- Send Email ---
    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { success: true, message: "Message sent successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("API Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
