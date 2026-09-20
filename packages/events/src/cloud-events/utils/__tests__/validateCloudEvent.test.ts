import Type from "typebox";
import { describe, expect, it } from "vitest";
import { CloudEventValidationError } from "../../../errors";
import type { CloudEvent } from "../../CloudEvent";
import { createCloudEvent } from "../createCloudEvent";
import { isCloudEvent, validateCloudEvent } from "../validateCloudEvent";

const REQUIRED_CONTEXT_ATTRIBUTES = ["id", "source", "specversion", "type", "dataschema"] as const;

const OPTIONAL_CONTEXT_ATTRIBUTES = ["datacontenttype", "subject", "time"] as const;

const AnyDataSchema = Type.Unknown();

const minimalValidEvent = {
  id: "A234-1234-1234",
  source: "/cloudevents/spec/pull/123",
  specversion: "1.0",
  type: "com.example.someevent",
  dataschema: "urn:pine:events:com.example.someevent",
} as const;

describe("validateCloudEvent", () => {
  it("accepts a well-formed event", () => {
    const value = {
      id: "evt-1",
      source: "pine/identity-service",
      specversion: "1.0",
      type: "identity.user.registered",
      dataschema: "urn:pine:events:identity.user.registered",
      data: { userId: "u-1" },
    };

    expect(validateCloudEvent(value)).toEqual(value);
    expect(isCloudEvent(value)).toBe(true);
  });

  it("rejects missing required fields", () => {
    expect(() =>
      validateCloudEvent({
        id: "evt-1",
        source: "pine/identity-service",
      }),
    ).toThrow(CloudEventValidationError);

    expect(isCloudEvent({ id: "x" })).toBe(false);
  });

  it("rejects wrong specversion", () => {
    expect(() =>
      validateCloudEvent({
        id: "evt-1",
        source: "pine/identity-service",
        specversion: "0.3",
        type: "identity.user.registered",
        dataschema: "urn:pine:events:identity.user.registered",
      }),
    ).toThrow(CloudEventValidationError);
  });
});

describe("CloudEvents 1.0 compliance", () => {
  describe("REQUIRED context attributes (id, source, specversion, type, dataschema)", () => {
    it("createCloudEvent always produces all REQUIRED attributes including dataschema", () => {
      const event = createCloudEvent({
        type: "com.example.object.created",
        source: "https://example.com/source",
        schema: AnyDataSchema,
      });

      for (const attribute of REQUIRED_CONTEXT_ATTRIBUTES) {
        expect(event).toHaveProperty(attribute);
        expect(event[attribute]).toBeDefined();
        expect(String(event[attribute]).length).toBeGreaterThan(0);
      }
      expect(event.dataschema).toBe("urn:pine:events:com.example.object.created");
    });

    it("validateCloudEvent accepts an event with only REQUIRED attributes", () => {
      expect(validateCloudEvent(minimalValidEvent)).toEqual(minimalValidEvent);
      expect(isCloudEvent(minimalValidEvent)).toBe(true);
    });

    it.each(REQUIRED_CONTEXT_ATTRIBUTES)(
      "rejects when REQUIRED attribute %s is missing",
      (attribute) => {
        const incomplete = { ...minimalValidEvent };
        delete (incomplete as Record<string, unknown>)[attribute];

        expect(() => validateCloudEvent(incomplete)).toThrow(CloudEventValidationError);
        expect(isCloudEvent(incomplete)).toBe(false);
      },
    );

    it.each(["id", "source", "type", "dataschema"] as const)(
      "rejects empty string for REQUIRED attribute %s (MUST be non-empty)",
      (attribute) => {
        const invalid = { ...minimalValidEvent, [attribute]: "" };

        expect(() => validateCloudEvent(invalid)).toThrow(CloudEventValidationError);
        expect(isCloudEvent(invalid)).toBe(false);
      },
    );

    it("id MUST be a string that identifies the event", () => {
      const withId = validateCloudEvent({
        ...minimalValidEvent,
        id: "unique-event-id-42",
      });
      expect(typeof withId.id).toBe("string");
      expect(withId.id).toBe("unique-event-id-42");

      expect(() => validateCloudEvent({ ...minimalValidEvent, id: 123 })).toThrow(
        CloudEventValidationError,
      );
    });

    it("source MUST be a non-empty string (URI-reference in the spec)", () => {
      const absolute = validateCloudEvent({
        ...minimalValidEvent,
        source: "https://github.com/cloudevents",
      });
      expect(absolute.source).toBe("https://github.com/cloudevents");

      const relative = validateCloudEvent({
        ...minimalValidEvent,
        source: "/cloudevents/spec/pull/123",
      });
      expect(relative.source).toBe("/cloudevents/spec/pull/123");

      const urn = validateCloudEvent({
        ...minimalValidEvent,
        source: "urn:uuid:6e8bc430-9c3a-11d9-9669-0800200c9a66",
      });
      expect(urn.source).toMatch(/^urn:/);
    });

    it('specversion MUST be the string "1.0"', () => {
      const event = createCloudEvent({
        type: "com.example.event",
        source: "/source",
        schema: AnyDataSchema,
      });
      expect(event.specversion).toBe("1.0");

      expect(validateCloudEvent({ ...minimalValidEvent, specversion: "1.0" }).specversion).toBe(
        "1.0",
      );

      for (const bad of ["0.3", "1", "1.0.0", "2.0", ""]) {
        expect(() => validateCloudEvent({ ...minimalValidEvent, specversion: bad })).toThrow(
          CloudEventValidationError,
        );
      }
    });

    it("type MUST be a non-empty string describing the event type", () => {
      const event = validateCloudEvent({
        ...minimalValidEvent,
        type: "com.github.pull_request.opened",
      });
      expect(event.type).toBe("com.github.pull_request.opened");

      expect(() => validateCloudEvent({ ...minimalValidEvent, type: 99 })).toThrow(
        CloudEventValidationError,
      );
    });

    it("id + source uniquely identify an event occurrence (producer generates distinct ids)", () => {
      const first = createCloudEvent({
        type: "com.example.event",
        source: "/same-source",
        schema: AnyDataSchema,
      });
      const second = createCloudEvent({
        type: "com.example.event",
        source: "/same-source",
        schema: AnyDataSchema,
      });

      expect(first.source).toBe(second.source);
      expect(first.id).not.toBe(second.id);
    });
  });

  describe("OPTIONAL context attributes", () => {
    it("allows all OPTIONAL attributes when present", () => {
      const full: CloudEvent = {
        ...minimalValidEvent,
        time: "2018-04-05T17:31:00Z",
        datacontenttype: "application/json",
        subject: "my-subject",
        data: { hello: "world" },
      };

      expect(validateCloudEvent(full)).toEqual(full);
      expect(isCloudEvent(full)).toBe(true);
    });

    it.each(OPTIONAL_CONTEXT_ATTRIBUTES)("OPTIONAL attribute %s may be omitted", (attribute) => {
      const event = { ...minimalValidEvent };
      expect(event).not.toHaveProperty(attribute);
      expect(isCloudEvent(event)).toBe(true);
    });

    it("time SHOULD be RFC 3339 when produced by createCloudEvent", () => {
      const rfc3339 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

      const defaultTime = createCloudEvent({
        type: "com.example.event",
        source: "/source",
        schema: AnyDataSchema,
      });
      expect(defaultTime.time).toMatch(rfc3339);

      const fromDate = createCloudEvent({
        type: "com.example.event",
        source: "/source",
        schema: AnyDataSchema,
        time: new Date("2018-04-05T17:31:00.000Z"),
      });
      expect(fromDate.time).toBe("2018-04-05T17:31:00.000Z");
      expect(fromDate.time).toMatch(rfc3339);

      const fromString = createCloudEvent({
        type: "com.example.event",
        source: "/source",
        schema: AnyDataSchema,
        time: "2018-04-05T17:31:00Z",
      });
      expect(fromString.time).toBe("2018-04-05T17:31:00Z");
    });

    it("subject is a string describing the subject of the event in the context of the producer", () => {
      const event = createCloudEvent({
        type: "com.example.object.deleted",
        source: "https://example.com",
        schema: AnyDataSchema,
        subject: "mynewfile.jpg",
      });

      expect(event.subject).toBe("mynewfile.jpg");
      expect(validateCloudEvent(event).subject).toBe("mynewfile.jpg");
    });

    it("datacontenttype describes the data media type (defaults to application/json when data is set)", () => {
      const withData = createCloudEvent({
        type: "com.example.event",
        source: "/source",
        schema: Type.Object({ a: Type.Number() }),
        data: { a: 1 },
      });
      expect(withData.datacontenttype).toBe("application/json");

      const custom = createCloudEvent({
        type: "com.example.event",
        source: "/source",
        schema: Type.String(),
        data: "<note/>",
        datacontenttype: "application/xml",
      });
      expect(custom.datacontenttype).toBe("application/xml");
    });

    it("dataschema is a URI identifying the schema that data adheres to", () => {
      const event = createCloudEvent({
        type: "com.example.event",
        source: "/source",
        schema: Type.Object({ id: Type.String() }),
        dataschema: "https://example.com/schemas/user.json",
        data: { id: "u-1" },
      });

      expect(event.dataschema).toBe("https://example.com/schemas/user.json");
      expect(validateCloudEvent(event).dataschema).toBe("https://example.com/schemas/user.json");
    });
  });

  describe("data attribute", () => {
    it("data is OPTIONAL and may be omitted", () => {
      const event = createCloudEvent({
        type: "com.example.event",
        source: "/source",
        schema: AnyDataSchema,
      });
      expect(event.data).toBeUndefined();
      expect(isCloudEvent(event)).toBe(true);
    });

    it.each([
      [{ hello: "world" }, "object"],
      [[1, 2, 3], "array"],
      ["plain text", "string"],
      [42, "number"],
      [true, "boolean"],
      [null, "null"],
    ] as const)("data may be any JSON value (%s)", (data, _kind) => {
      const event = {
        ...minimalValidEvent,
        data,
        datacontenttype: "application/json",
      };

      expect(validateCloudEvent(event).data).toEqual(data);
      expect(isCloudEvent(event)).toBe(true);
    });
  });

  describe("JSON format / attribute naming", () => {
    it("context attributes use lowercase names as defined by the JSON format", () => {
      const event = createCloudEvent({
        type: "com.example.event",
        source: "/source",
        schema: Type.Object({ x: Type.Number() }),
        data: { x: 1 },
        subject: "s",
        dataschema: "https://example.com/s",
      });

      const keys = Object.keys(event);
      for (const key of keys) {
        expect(key).toBe(key.toLowerCase());
      }

      expect(keys).toEqual(
        expect.arrayContaining([
          "id",
          "source",
          "specversion",
          "type",
          "time",
          "data",
          "datacontenttype",
          "subject",
          "dataschema",
        ]),
      );
      expect(keys).not.toContain("specVersion");
      expect(keys).not.toContain("dataContentType");
      expect(keys).not.toContain("dataSchema");
    });

    it("MUST NOT accept PascalCase / camelCase REQUIRED attribute names in place of lowercase", () => {
      expect(
        isCloudEvent({
          Id: "a",
          Source: "/s",
          SpecVersion: "1.0",
          Type: "t",
          DataSchema: "urn:x",
        }),
      ).toBe(false);

      expect(
        isCloudEvent({
          id: "a",
          source: "/s",
          specVersion: "1.0",
          type: "t",
          dataschema: "urn:x",
        }),
      ).toBe(false);
    });
  });

  describe("extension attributes", () => {
    it("allows extension attributes alongside context attributes (additionalProperties)", () => {
      const withExtension = {
        ...minimalValidEvent,
        comexampleextension1: "value",
        comexampleothervalue: 5,
      };

      expect(validateCloudEvent(withExtension)).toEqual(withExtension);
      expect(isCloudEvent(withExtension)).toBe(true);
    });
  });

  describe("envelope type safety", () => {
    it("rejects non-object values", () => {
      for (const value of [null, undefined, "event", 1, true, []]) {
        expect(isCloudEvent(value)).toBe(false);
        expect(() => validateCloudEvent(value)).toThrow(CloudEventValidationError);
      }
    });

    it("CloudEventValidationError is thrown for invalid envelopes", () => {
      try {
        validateCloudEvent({ id: "" });
        expect.unreachable("expected throw");
      } catch (error) {
        expect(error).toBeInstanceOf(CloudEventValidationError);
        expect((error as CloudEventValidationError).code).toBe("CLOUD_EVENT_VALIDATION_ERROR");
        expect((error as CloudEventValidationError).expose).toBe(true);
        expect((error as CloudEventValidationError).errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe("spec example (JSON format)", () => {
    it("accepts the canonical JSON structured-mode example shape when dataschema is present", () => {
      const example = {
        specversion: "1.0",
        type: "com.github.pull_request.opened",
        source: "https://github.com/cloudevents/spec/pull",
        subject: "123",
        id: "A234-1234-1234",
        time: "2018-04-05T17:31:00Z",
        dataschema: "urn:pine:events:com.github.pull_request.opened",
        comexampleextension1: "value",
        comexampleothervalue: 5,
        datacontenttype: "text/xml",
        data: '<much wow="xml"/>',
      };

      expect(isCloudEvent(example)).toBe(true);
      expect(validateCloudEvent(example)).toEqual(example);
    });

    it("createCloudEvent can produce a compatible event for the same domain", () => {
      const event = createCloudEvent({
        id: "A234-1234-1234",
        type: "com.github.pull_request.opened",
        source: "https://github.com/cloudevents/spec/pull",
        schema: Type.String(),
        subject: "123",
        time: "2018-04-05T17:31:00Z",
        datacontenttype: "text/xml",
        data: '<much wow="xml"/>',
      });

      expect(event.specversion).toBe("1.0");
      expect(event.dataschema).toBe("urn:pine:events:com.github.pull_request.opened");
      expect(validateCloudEvent(event)).toEqual(event);
      expect(isCloudEvent(event)).toBe(true);
    });
  });
});
