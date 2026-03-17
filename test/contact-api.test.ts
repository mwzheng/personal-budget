// Note 1: The contact route is tested at the request/response boundary so payload
// validation and SES wiring stay covered without touching the real network.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
}));

vi.mock("@aws-sdk/client-ses", () => {
  class SendEmailCommand {
    input: unknown;

    constructor(input: unknown) {
      this.input = input;
    }
  }

  class SESClient {
    send = sendMock;
  }

  return {
    SESClient,
    SendEmailCommand,
  };
});

import { POST } from "@/app/api/contact/route";

const originalSender = process.env.CONTACT_SES_FROM_EMAIL;
const originalRecipient = process.env.CONTACT_SES_TO_EMAIL;

function buildContactRequest(body: unknown) {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("contact api route", () => {
  beforeEach(() => {
    process.env.CONTACT_SES_FROM_EMAIL = "sender@example.com";
    process.env.CONTACT_SES_TO_EMAIL = "owner@example.com";

    sendMock.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-02-03T04:05:06.000Z"));
  });

  afterEach(() => {
    if (originalSender === undefined) {
      delete process.env.CONTACT_SES_FROM_EMAIL;
    } else {
      process.env.CONTACT_SES_FROM_EMAIL = originalSender;
    }

    if (originalRecipient === undefined) {
      delete process.env.CONTACT_SES_TO_EMAIL;
    } else {
      process.env.CONTACT_SES_TO_EMAIL = originalRecipient;
    }

    vi.useRealTimers();
  });

  it("rejects invalid payloads with field-specific errors", async () => {
    const response = await POST(
      buildContactRequest({
        name: "",
        email: "not-an-email",
        subject: "",
        message: "short",
      }),
    );

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      message: "Please review the highlighted fields and try again.",
      fieldErrors: {
        name: "Please enter your name.",
        email: "Enter a valid email address.",
        subject: "Please enter a subject.",
        message: "Message must be at least 10 characters.",
      },
    });
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("sends a validated message through SES", async () => {
    sendMock.mockResolvedValue({ MessageId: "message-123" });

    const response = await POST(
      buildContactRequest({
        name: "Taylor",
        email: "taylor@example.com",
        subject: "Feature idea",
        message: "I have a thoughtful suggestion for the public roadmap.",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      message:
        "Thanks for reaching out. Your message has been sent successfully.",
    });
    expect(sendMock).toHaveBeenCalledTimes(1);

    const [command] = sendMock.mock.calls[0] as [
      {
        input: {
          Source: string;
          Destination: { ToAddresses: string[] };
          ReplyToAddresses: string[];
          Message: {
            Subject: { Charset: string; Data: string };
            Body: { Text: { Charset: string; Data: string } };
          };
        };
      },
    ];

    expect(command.input).toEqual({
      Source: "sender@example.com",
      Destination: {
        ToAddresses: ["owner@example.com"],
      },
      ReplyToAddresses: ["taylor@example.com"],
      Message: {
        Subject: {
          Charset: "UTF-8",
          Data: "[Porridge Budget] Feature idea",
        },
        Body: {
          Text: {
            Charset: "UTF-8",
            Data: [
              "New Porridge Budget contact form submission",
              "",
              "Name: Taylor",
              "Email: taylor@example.com",
              "Subject: Feature idea",
              "Submitted at: 2025-02-03T04:05:06.000Z",
              "",
              "Message:",
              "I have a thoughtful suggestion for the public roadmap.",
            ].join("\n"),
          },
        },
      },
    });
  });
});
