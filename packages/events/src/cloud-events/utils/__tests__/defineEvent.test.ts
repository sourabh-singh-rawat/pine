import { describe, expect, it } from "vitest";
import { EventValidationError } from "../../../errors";
import { ItemCreatedEvent } from "../../../services/items-service";
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
    expect(ItemCreatedEvent.type).toBe("items.item.created");
    expect(ItemCreatedEvent.version).toBe(1);
    expect(ItemCreatedEvent.schema).toBeDefined();
    expect(Object.isFrozen(ItemCreatedEvent)).toBe(true);
    expect(ItemCreatedEvent).not.toHaveProperty("create");
    expect(ItemCreatedEvent).not.toHaveProperty("validate");
    expect(ItemCreatedEvent).not.toHaveProperty("is");
  });

  it("createCloudEvent builds a CloudEvent using the definition type and schema", () => {
    const event = createCloudEvent({
      type: ItemCreatedEvent.type,
      schema: ItemCreatedEvent.schema,
      source: "pine/items-service",
      data: validData,
    });

    expect(event.type).toBe("items.item.created");
    expect(event.source).toBe("pine/items-service");
    expect(event.specversion).toBe("1.0");
    expect(event.dataschema).toBe("urn:pine:events:items.item.created");
    expect(event.data).toEqual(validData);
    expect(event.datacontenttype).toBe("application/json");
  });

  it("isEvent acts as a type guard for envelope, type, and payload", () => {
    const event = createCloudEvent({
      type: ItemCreatedEvent.type,
      schema: ItemCreatedEvent.schema,
      source: "pine/items-service",
      data: validData,
    });

    expect(isEvent(ItemCreatedEvent, event)).toBe(true);
    expect(
      isEvent(
        ItemCreatedEvent,
        createCloudEvent({
          type: "items.project.created",
          schema: ItemCreatedEvent.schema,
          source: "pine/items-service",
          data: validData,
        }),
      ),
    ).toBe(false);
    expect(isEvent(ItemCreatedEvent, { type: "items.item.created" })).toBe(false);
  });

  it("validateEvent returns a typed event and throws EventValidationError on mismatches", () => {
    const event = createCloudEvent({
      type: ItemCreatedEvent.type,
      schema: ItemCreatedEvent.schema,
      source: "pine/items-service",
      data: validData,
    });

    expect(validateEvent(ItemCreatedEvent, event)).toEqual(event);

    expect(() =>
      validateEvent(
        ItemCreatedEvent,
        createCloudEvent({
          type: "items.project.created",
          schema: ItemCreatedEvent.schema,
          source: "pine/items-service",
          data: validData,
        }),
      ),
    ).toThrow(EventValidationError);

    expect(() =>
      createCloudEvent({
        type: ItemCreatedEvent.type,
        schema: ItemCreatedEvent.schema,
        source: "pine/items-service",
        data: { id: "bad" },
      }),
    ).toThrow(EventValidationError);
  });
});
