import { ITEM_PRIORITY } from "@pine/common";
import { IssueCreatedEvent } from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { describe, expect, it, vi } from "vitest";
import type { Issue } from "@/db";
import type {
  IIssueAssigneeRepository,
  IIssueRepository,
} from "@/features/issue/repositories";
import { IssueService } from "@/features/issue/services/IssueService";

const issue: Issue = {
  id: "issue-1",
  name: "Fix login",
  description: "Users cannot sign in",
  type: "task",
  statusId: "status-1",
  priority: ITEM_PRIORITY.NORMAL,
  projectId: "project-1",
  startDate: null,
  dueDate: null,
  createdById: "user-1",
  updatedById: null,
  parentIssueId: null,
  estimate: null,
  component: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const createIssueRepository = (
  overrides: Partial<IIssueRepository> = {},
): IIssueRepository => ({
  save: vi.fn().mockResolvedValue(issue),
  update: vi.fn().mockResolvedValue(undefined),
  hardDelete: vi.fn().mockResolvedValue(undefined),
  findById: vi.fn().mockResolvedValue(null),
  findByIdForUser: vi.fn().mockResolvedValue(null),
  findRootsByProject: vi.fn().mockResolvedValue([]),
  findChildren: vi.fn().mockResolvedValue([]),
  ...overrides,
});

const createIssueAssigneeRepository = (
  overrides: Partial<IIssueAssigneeRepository> = {},
): IIssueAssigneeRepository => ({
  saveMany: vi.fn().mockResolvedValue([]),
  ...overrides,
});

const createOutboxService = (
  overrides: Partial<IOutboxService> = {},
): IOutboxService => ({
  schedule: vi.fn().mockResolvedValue({ id: "outbox-1" }),
  claimBatch: vi.fn().mockResolvedValue([]),
  complete: vi.fn().mockResolvedValue({ id: "outbox-1" }),
  failed: vi.fn().mockResolvedValue({ id: "outbox-1" }),
  get: vi.fn().mockResolvedValue(null),
  getByEventId: vi.fn().mockResolvedValue(null),
  ...overrides,
});

const createDb = () => ({
  transaction: vi.fn(async (fn: (tx: Record<string, never>) => Promise<unknown>) => fn({})),
});

describe("IssueService", () => {
  it("schedules IssueCreatedEvent when an issue is created", async () => {
    const issueRepository = createIssueRepository();
    const issueAssigneeRepository = createIssueAssigneeRepository();
    const outboxService = createOutboxService();
    const db = createDb();

    const service = new IssueService(
      db,
      issueRepository,
      issueAssigneeRepository,
      outboxService,
    );

    await expect(
      service.createIssue({
        userId: "user-1",
        projectId: "project-1",
        type: "task",
        name: "Fix login",
        assigneeIds: [],
        description: "Users cannot sign in",
        statusId: "status-1",
      }),
    ).resolves.toBe("issue-1");

    expect(issueRepository.save).toHaveBeenCalledWith(
      {
        projectId: "project-1",
        type: "task",
        name: "Fix login",
        description: "Users cannot sign in",
        statusId: "status-1",
        priority: ITEM_PRIORITY.NORMAL,
        estimate: undefined,
        component: undefined,
        createdById: "user-1",
        parentIssueId: null,
      },
      { tx: {} },
    );
    expect(issueAssigneeRepository.saveMany).not.toHaveBeenCalled();
    expect(outboxService.schedule).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: IssueCreatedEvent.type,
        eventVersion: IssueCreatedEvent.version,
        aggregateType: "issue",
        aggregateId: "issue-1",
        payload: expect.objectContaining({
          type: IssueCreatedEvent.type,
          subject: "issue-1",
          data: {
            id: "issue-1",
            name: "Fix login",
            ownerId: "user-1",
            reporterId: "user-1",
            projectId: "project-1",
            createdAt: "2026-01-01T00:00:00.000Z",
            description: "Users cannot sign in",
          },
        }),
      }),
      { tx: {} },
    );
  });

  it("saves assignees before scheduling IssueCreatedEvent", async () => {
    const issueRepository = createIssueRepository();
    const issueAssigneeRepository = createIssueAssigneeRepository();
    const outboxService = createOutboxService();
    const db = createDb();

    const service = new IssueService(
      db,
      issueRepository,
      issueAssigneeRepository,
      outboxService,
    );

    await service.createIssue({
      userId: "user-1",
      projectId: "project-1",
      type: "task",
      name: "Fix login",
      assigneeIds: ["user-2", "user-3"],
      statusId: "status-1",
    });

    expect(issueAssigneeRepository.saveMany).toHaveBeenCalledWith(
      [
        { issueId: "issue-1", userId: "user-2" },
        { issueId: "issue-1", userId: "user-3" },
      ],
      { tx: {} },
    );
    expect(outboxService.schedule).toHaveBeenCalled();
  });
});
