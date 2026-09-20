import { describe, expect, it } from "vitest";
import { EventValidationError } from "../../../errors";
import { IssueCreatedEvent } from "../../../services/issues-service";
import { createCloudEvent } from "../createCloudEvent";
import { isEvent, validateEvent } from "../validateEvent";

describe("defineEvent + validateEvent / isEvent", () => {
  const validData = {
    id: "issue-1",
    name: "Bug",
    ownerId: "user-1",
    reporterId: "user-2",
    projectId: "project-1",
    createdAt: "2020-01-01T00:00:00.000Z",
  };

  it("defineEvent exposes only frozen type, version, and schema", () => {
    expect(IssueCreatedEvent.type).toBe("issues.issue.created");
    expect(IssueCreatedEvent.version).toBe(1);
    expect(IssueCreatedEvent.schema).toBeDefined();
    expect(Object.isFrozen(IssueCreatedEvent)).toBe(true);
    expect(IssueCreatedEvent).not.toHaveProperty("create");
    expect(IssueCreatedEvent).not.toHaveProperty("validate");
    expect(IssueCreatedEvent).not.toHaveProperty("is");
  });

  it("createCloudEvent builds a CloudEvent using the definition type and schema", () => {
    const event = createCloudEvent({
      type: IssueCreatedEvent.type,
      schema: IssueCreatedEvent.schema,
      source: "pine/issues-service",
      data: validData,
    });

    expect(event.type).toBe("issues.issue.created");
    expect(event.source).toBe("pine/issues-service");
    expect(event.specversion).toBe("1.0");
    expect(event.dataschema).toBe("urn:pine:events:issues.issue.created");
    expect(event.data).toEqual(validData);
    expect(event.datacontenttype).toBe("application/json");
  });

  it("isEvent acts as a type guard for envelope, type, and payload", () => {
    const event = createCloudEvent({
      type: IssueCreatedEvent.type,
      schema: IssueCreatedEvent.schema,
      source: "pine/issues-service",
      data: validData,
    });

    expect(isEvent(IssueCreatedEvent, event)).toBe(true);
    expect(
      isEvent(
        IssueCreatedEvent,
        createCloudEvent({
          type: "issues.project.created",
          schema: IssueCreatedEvent.schema,
          source: "pine/issues-service",
          data: validData,
        }),
      ),
    ).toBe(false);
    expect(isEvent(IssueCreatedEvent, { type: "issues.issue.created" })).toBe(false);
  });

  it("validateEvent returns a typed event and throws EventValidationError on mismatches", () => {
    const event = createCloudEvent({
      type: IssueCreatedEvent.type,
      schema: IssueCreatedEvent.schema,
      source: "pine/issues-service",
      data: validData,
    });

    expect(validateEvent(IssueCreatedEvent, event)).toEqual(event);

    expect(() =>
      validateEvent(
        IssueCreatedEvent,
        createCloudEvent({
          type: "issues.project.created",
          schema: IssueCreatedEvent.schema,
          source: "pine/issues-service",
          data: validData,
        }),
      ),
    ).toThrow(EventValidationError);

    expect(() =>
      createCloudEvent({
        type: IssueCreatedEvent.type,
        schema: IssueCreatedEvent.schema,
        source: "pine/issues-service",
        data: { id: "bad" },
      }),
    ).toThrow(EventValidationError);
  });
});
