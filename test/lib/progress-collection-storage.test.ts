import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDocClientMock, sendMock } = vi.hoisted(() => ({
  getDocClientMock: vi.fn(),
  sendMock: vi.fn(),
}));

vi.mock("@/lib/api/dynamoClient", () => ({ getDocClient: getDocClientMock }));

import {
  getUserMilestones,
  getUserProgressGoals,
  getUserRetirement,
} from "@/lib/utils/progress";

describe("progress collection queries", () => {
  beforeEach(() => {
    sendMock.mockReset();
    getDocClientMock.mockReturnValue({ send: sendMock });
  });

  it("follows cursors for retirement, milestones, and goals without changing shapes", async () => {
    const retirementCursor = { pk: "user#u1", sk: "retirement#2024#r1" };
    sendMock
      .mockResolvedValueOnce({
        Items: [{ entryId: "r1", year: 2024, startAmount: 10, endAmount: 20 }],
        LastEvaluatedKey: retirementCursor,
      })
      .mockResolvedValueOnce({
        Items: [{ entryId: "r2", year: 2025, startAmount: 20, endAmount: 30 }],
      });

    await expect(getUserRetirement("u1")).resolves.toEqual([
      {
        entryId: "r1",
        year: 2024,
        startAmount: 10,
        endAmount: 20,
        createdAt: undefined,
        updatedAt: undefined,
      },
      {
        entryId: "r2",
        year: 2025,
        startAmount: 20,
        endAmount: 30,
        createdAt: undefined,
        updatedAt: undefined,
      },
    ]);
    expect(sendMock).toHaveBeenCalledTimes(2);
    expect(sendMock.mock.calls[1][0].input.ExclusiveStartKey).toEqual(
      retirementCursor,
    );

    sendMock
      .mockResolvedValueOnce({
        Items: [
          {
            milestoneId: "m1",
            amount: 100,
            year: 2024,
            month: 1,
            age: 30,
            note: "first",
          },
        ],
        LastEvaluatedKey: { pk: "user#u1", sk: "milestone#2024#m1" },
      })
      .mockResolvedValueOnce({
        Items: [
          {
            milestoneId: "m2",
            amount: 200,
            year: null,
            month: null,
            age: 31,
            note: "second",
          },
        ],
      });
    await expect(getUserMilestones("u1")).resolves.toHaveLength(2);
    expect(sendMock).toHaveBeenCalledTimes(4);

    sendMock
      .mockResolvedValueOnce({
        Items: [{ goalId: "g1", targetAmount: 1000 }],
        LastEvaluatedKey: { pk: "user#u1", sk: "goal#g1" },
      })
      .mockResolvedValueOnce({ Items: [{ goalId: "g2", targetAmount: 2000 }] });
    await expect(getUserProgressGoals("u1")).resolves.toEqual([
      {
        goalId: "g1",
        targetAmount: 1000,
        createdAt: undefined,
        updatedAt: undefined,
      },
      {
        goalId: "g2",
        targetAmount: 2000,
        createdAt: undefined,
        updatedAt: undefined,
      },
    ]);
    expect(sendMock).toHaveBeenCalledTimes(6);
  });
});
