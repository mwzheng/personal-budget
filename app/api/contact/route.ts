/**
 * Note 1: This route validates the public contact payload and relays it through
 * SES from a verified sender so the browser never touches email credentials.
 */

import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { NextResponse } from "next/server";

import {
  ContactSubmissionSchema,
  type ContactSubmission,
} from "@/lib/schemas/schemas";

const sesClient = new SESClient({
  region:
    process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1",
});

function getFieldErrors(fieldErrors: Record<string, string[] | undefined>) {
  return Object.fromEntries(
    Object.entries(fieldErrors).flatMap(([fieldName, messages]) =>
      typeof messages?.[0] === "string" ? [[fieldName, messages[0]]] : [],
    ),
  );
}

function buildEmailBody({ email, message, name, subject }: ContactSubmission) {
  return [
    "New Porridge Budget contact form submission",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Subject: ${subject}`,
    `Submitted at: ${new Date().toISOString()}`,
    "",
    "Message:",
    message,
  ].join("\n");
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Please submit a valid contact form request.",
      },
      { status: 400 },
    );
  }

  const parseResult = ContactSubmissionSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json(
      {
        ok: false,
        message: "Please review the highlighted fields and try again.",
        fieldErrors: getFieldErrors(parseResult.error.flatten().fieldErrors),
      },
      { status: 422 },
    );
  }

  const senderEmail = process.env.CONTACT_SES_FROM_EMAIL?.trim();
  const recipientEmail = process.env.CONTACT_SES_TO_EMAIL?.trim();

  if (!senderEmail || !recipientEmail) {
    console.error(
      "[/api/contact] Missing CONTACT_SES_FROM_EMAIL or CONTACT_SES_TO_EMAIL.",
    );

    return NextResponse.json(
      {
        ok: false,
        message:
          "Contact email delivery is temporarily unavailable. Please try again later.",
      },
      { status: 500 },
    );
  }

  try {
    // Note 2: `ReplyToAddresses` lets the verified inbox answer the sender
    // directly while SES still uses the configured mailbox as the actual From.
    await sesClient.send(
      new SendEmailCommand({
        Source: senderEmail,
        Destination: {
          ToAddresses: [recipientEmail],
        },
        ReplyToAddresses: [parseResult.data.email],
        Message: {
          Subject: {
            Charset: "UTF-8",
            Data: `[Porridge Budget] ${parseResult.data.subject}`,
          },
          Body: {
            Text: {
              Charset: "UTF-8",
              Data: buildEmailBody(parseResult.data),
            },
          },
        },
      }),
    );

    return NextResponse.json({
      ok: true,
      message:
        "Thanks for reaching out. Your message has been sent successfully.",
    });
  } catch (error) {
    console.error("[/api/contact] Failed to send contact email.", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          "We couldn't send your message just now. Please try again in a moment.",
      },
      { status: 502 },
    );
  }
}
