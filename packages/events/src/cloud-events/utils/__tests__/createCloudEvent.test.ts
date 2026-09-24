import Type from "typebox";
import { describe, expect, it } from "vitest";
import { EventValidationError } from "../../../errors";
import { createCloudEvent } from "../createCloudEvent";
import { isCloudEvent, validateCloudEvent } from "../validateCloudEvent";

const UserRegisteredDataSchema = Type.Object({
  userId: Type.String(),
  email: Type.String(),
});

const ProjectCreatedDataSchema = Type.Object({
  id: Type.String(),
});

const MemberInvitedDataSchema = Type.Object({
  userId: Type.String(),
  listId: Type.String(),
  email: Type.String(),
});

describe("createCloudEvent", () => {
  it("fills defaults for id, specversion, time, dataschema, and datacontenttype", () => {
    const event = createCloudEvent({
      type: "user.registered",
      source: "pine/identity-service",
      schema: UserRegisteredDataSchema,
      data: { userId: "u-1", email: "a@b.com" },
    });

    expect(event.specversion).toBe("1.0");
    expect(event.type).toBe("user.registered");
    expect(event.source).toBe("pine/identity-service");
    expect(event.dataschema).toBe("urn:pine:events:user.registered");
    expect(event.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(event.time).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(event.datacontenttype).toBe("application/json");
    expect(event.data).toEqual({ userId: "u-1", email: "a@b.com" });
  });

  it("requires schema and always sets dataschema on the envelope", () => {
    const event = createCloudEvent({
      type: "items.item.created",
      source: "pine/items-service",
      schema: Type.Object({ id: Type.String() }),
      data: { id: "p-1" },
    });

    expect(event.dataschema).toBe("urn:pine:events:items.item.created");
  });

  it("includes version in default dataschema when provided", () => {
    const event = createCloudEvent({
      type: "items.item.created",
      version: 1,
      source: "pine/items-service",
      schema: Type.Object({ id: Type.String() }),
      data: { id: "p-1" },
    });

    expect(event.dataschema).toBe("urn:pine:events:items.item.created:v1");
  });

  it("respects explicit overrides", () => {
    const event = createCloudEvent({
      id: "fixed-id",
      type: "project.created",
      source: "pine/items-service",
      schema: ProjectCreatedDataSchema,
      time: "2020-01-01T00:00:00.000Z",
      subject: "project/abc",
      datacontenttype: "application/cloudevents+json",
      dataschema: "https://example.com/schemas/project.json",
      data: { id: "p-1" },
    });

    expect(event).toEqual({
      id: "fixed-id",
      type: "project.created",
      source: "pine/items-service",
      specversion: "1.0",
      time: "2020-01-01T00:00:00.000Z",
      subject: "project/abc",
      datacontenttype: "application/cloudevents+json",
      dataschema: "https://example.com/schemas/project.json",
      data: { id: "p-1" },
    });
  });

  it("accepts Date for time and omits data defaults when data is absent", () => {
    const event = createCloudEvent({
      type: "project.created",
      source: "pine/items-service",
      schema: Type.Object({}),
      time: new Date("2021-06-15T12:00:00.000Z"),
    });

    expect(event.time).toBe("2021-06-15T12:00:00.000Z");
    expect(event.dataschema).toBe("urn:pine:events:project.created");
    expect(event.data).toBeUndefined();
    expect(event.datacontenttype).toBeUndefined();
  });

  it("validates data against the required schema", () => {
    expect(() =>
      createCloudEvent({
        type: "user.registered",
        source: "pine/identity-service",
        schema: UserRegisteredDataSchema,
        data: { userId: "u-1" } as never,
      }),
    ).toThrow(EventValidationError);
  });

  it("round-trips create → validate", () => {
    const created = createCloudEvent({
      type: "project.member-invited",
      source: "pine/items-service",
      schema: MemberInvitedDataSchema,
      data: {
        userId: "u-1",
        listId: "p-1",
        email: "a@b.com",
      },
    });

    expect(validateCloudEvent(created)).toEqual(created);
    expect(isCloudEvent(created)).toBe(true);
  });
});
