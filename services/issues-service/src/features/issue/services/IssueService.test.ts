import {
  InsufficientPermissionError,
  type IAuthorizationClient,
} from "@pine/authorization";
import { ITEM_PRIORITY } from "@pine/common";
import { IssueCreatedEvent } from "@pine/events";
import type { IOutboxService } from "@pine/outbox";
import { describe, expect, it, vi } from "vitest";
import type { DbClient, Issue } from "@/db";
import { IssueNotFoundError } from "@/features/issue/errors";
import type {
  IIssueAssigneeRepository,
  IIssueRepository,
} from "@/features/issue/repositories";
import {
  type IssueDatabase,
  IssueService,
} from "@/features/issue/services/IssueService";

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
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
};

const createIssueRepository = (
  overrides: Partial<IIssueRepository> = {},
): IIssueRepository => ({
  save: vi.fn().mockResolvedValue(issue),
  update: vi.fn().mockResolvedValue(undefined),
  softDelete: vi.fn().mockResolvedValue(true),
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

const createAuthorizationClient = (
  overrides: Partial<IAuthorizationClient> = {},
): IAuthorizationClient => ({
  checkRelationship: vi.fn().mockResolvedValue(true),
  ensureRelationship: vi.fn().mockResolvedValue({ created: true }),
  deleteRelationship: vi.fn().mockResolvedValue({ deleted: true }),
  listRelationships: vi.fn().mockResolvedValue([]),
  ...overrides,
});

const isDbClient = (_value: unknown): _value is DbClient => true;
const mockTxValue: unknown = {};
const mockTx = isDbClient(mockTxValue) ? mockTxValue : undefined;

const createDb = (): IssueDatabase => ({
  transaction: vi.fn(async (callback) => {
    if (!mockTx) {
      throw new Error("mockTx not defined");
    }
    return callback(mockTx);
  }),
});

const createService = (deps: {
  db?: IssueDatabase;
  issueRepository?: IIssueRepository;
  issueAssigneeRepository?: IIssueAssigneeRepository;
  outboxService?: IOutboxService;
  authorizationClient?: IAuthorizationClient;
} = {}) =>
  new IssueService(
    deps.db ?? createDb(),
    deps.issueRepository ?? createIssueRepository(),
    deps.issueAssigneeRepository ?? createIssueAssigneeRepository(),
    deps.outboxService ?? createOutboxService(),
    deps.authorizationClient ?? createAuthorizationClient(),
  );

describe("IssueService", () => {
  it("schedules IssueCreatedEvent when an issue is created", async () => {
    const issueRepository = createIssueRepository();
    const issueAssigneeRepository = createIssueAssigneeRepository();
    const outboxService = createOutboxService();

    const service = createService({
      issueRepository,
      issueAssigneeRepository,
      outboxService,
    });

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

    const service = createService({
      issueRepository,
      issueAssigneeRepository,
      outboxService,
    });

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

  it("soft-deletes an issue after authorizing delete on the project", async () => {
    const issueRepository = createIssueRepository({
      findById: vi.fn().mockResolvedValue(issue),
      softDelete: vi.fn().mockResolvedValue(true),
    });
    const authorizationClient = createAuthorizationClient();

    const service = createService({ issueRepository, authorizationClient });

    await expect(
      service.deleteIssue({ id: "issue-1", userId: "user-1" }),
    ).resolves.toBeUndefined();

    expect(authorizationClient.checkRelationship).toHaveBeenCalledWith({
      namespace: "project",
      object: "project-1",
      relation: "delete",
      subject: "identity:user-1",
    });
    expect(issueRepository.softDelete).toHaveBeenCalledWith("issue-1");
  });

  it("throws InsufficientPermissionError when delete is not allowed", async () => {
    const issueRepository = createIssueRepository({
      findById: vi.fn().mockResolvedValue(issue),
    });
    const authorizationClient = createAuthorizationClient({
      checkRelationship: vi.fn().mockResolvedValue(false),
    });

    const service = createService({ issueRepository, authorizationClient });

    await expect(
      service.deleteIssue({ id: "issue-1", userId: "user-1" }),
    ).rejects.toBeInstanceOf(InsufficientPermissionError);
    expect(issueRepository.softDelete).not.toHaveBeenCalled();
  });

  it("throws IssueNotFoundError when the issue is missing", async () => {
    const issueRepository = createIssueRepository({
      findById: vi.fn().mockResolvedValue(null),
    });
    const authorizationClient = createAuthorizationClient();

    const service = createService({ issueRepository, authorizationClient });

    await expect(
      service.deleteIssue({ id: "missing", userId: "user-1" }),
    ).rejects.toBeInstanceOf(IssueNotFoundError);
    expect(authorizationClient.checkRelationship).not.toHaveBeenCalled();
    expect(issueRepository.softDelete).not.toHaveBeenCalled();
  });
});
