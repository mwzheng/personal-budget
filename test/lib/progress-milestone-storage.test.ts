import { PutCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDocClientMock, sendMock } = vi.hoisted(() => ({
  getDocClientMock: vi.fn(),
  sendMock: vi.fn(),
}));

vi.mock("@/lib/api/dynamoClient", () => ({ getDocClient: getDocClientMock }));

import { MilestoneConflictError, updateMilestone } from "@/lib/utils/progress";

describe("updateMilestone", () => {
  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue({});
    getDocClientMock.mockReturnValue({ send: sendMock });
  });

  it("atomically replaces the old year key when the year changes", async () => {
    const updated = await updateMilestone("user-1", {
      milestoneId: "milestone-1",
      originalYear: 2025,
      amount: 200000,
      year: 2026,
      month: 4,
      age: 40,
      note: "Moved",
      createdAt: "2025-01-01T00:00:00.000Z",
      expectedUpdatedAt: "2025-02-01T00:00:00.000Z",
    });

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0][0]).toBeInstanceOf(TransactWriteCommand);
    expect(sendMock.mock.calls[0][0].input).toMatchObject({
      TransactItems: [
        {
          Delete: {
            TableName: expect.any(String),
            Key: { pk: "user#user-1", sk: "milestone#2025#milestone-1" },
            ConditionExpression:
              "attribute_exists(pk) AND #updatedAt = :expectedUpdatedAt",
            ExpressionAttributeNames: { "#updatedAt": "updatedAt" },
            ExpressionAttributeValues: {
              ":expectedUpdatedAt": "2025-02-01T00:00:00.000Z",
            },
          },
        },
        {
          Put: {
            TableName: expect.any(String),
            Item: {
              pk: "user#user-1",
              sk: "milestone#2026#milestone-1",
              milestoneId: "milestone-1",
              amount: 200000,
              year: 2026,
              month: 4,
              age: 40,
              note: "Moved",
              createdAt: "2025-01-01T00:00:00.000Z",
              updatedAt: expect.any(String),
            },
            ConditionExpression:
              "attribute_not_exists(pk) AND attribute_not_exists(sk)",
          },
        },
      ],
    });
    expect(updated).toMatchObject({
      milestoneId: "milestone-1",
      year: 2026,
      month: 4,
    });
  });

  it("uses a single PutCommand when the milestone stays in the same year", async () => {
    await updateMilestone("user-1", {
      milestoneId: "milestone-1",
      originalYear: 2025,
      amount: 200000,
      year: 2025,
      month: 4,
      expectedUpdatedAt: "2025-02-01T00:00:00.000Z",
    });

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock.mock.calls[0][0]).toBeInstanceOf(PutCommand);
    expect(sendMock.mock.calls[0][0].input).toMatchObject({
      TableName: expect.any(String),
      Item: {
        pk: "user#user-1",
        sk: "milestone#2025#milestone-1",
        milestoneId: "milestone-1",
        amount: 200000,
        year: 2025,
        month: 4,
      },
      ConditionExpression:
        "attribute_exists(pk) AND #updatedAt = :expectedUpdatedAt",
      ExpressionAttributeNames: { "#updatedAt": "updatedAt" },
      ExpressionAttributeValues: {
        ":expectedUpdatedAt": "2025-02-01T00:00:00.000Z",
      },
    });
  });

  it("uses an existence and legacy-version condition when no updatedAt is supplied", async () => {
    await updateMilestone("user-1", {
      milestoneId: "milestone-1",
      originalYear: null,
      amount: 200000,
      year: null,
      month: null,
    });

    expect(sendMock.mock.calls[0][0].input).toMatchObject({
      ConditionExpression:
        "attribute_exists(pk) AND attribute_not_exists(#updatedAt)",
      ExpressionAttributeNames: { "#updatedAt": "updatedAt" },
    });
  });

  it("surfaces DynamoDB conditional failures as typed conflicts", async () => {
    sendMock.mockRejectedValue({ name: "ConditionalCheckFailedException" });

    await expect(
      updateMilestone("user-1", {
        milestoneId: "milestone-1",
        originalYear: 2025,
        amount: 200000,
        year: 2025,
        expectedUpdatedAt: "2025-02-01T00:00:00.000Z",
      }),
    ).rejects.toBeInstanceOf(MilestoneConflictError);
  });
});
