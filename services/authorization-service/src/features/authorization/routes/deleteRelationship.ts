import type { HttpRoute } from "@pine/server";
import { json } from "@pine/server";
import Value from "typebox/value";
import { container } from "@/bootstrap";
import { TYPES } from "@/bootstrap/container-types";
import { InvalidGraphRelationshipBodyError } from "@/features/authorization/errors";
import type { IAuthorizationService } from "@/features/authorization/services";
import {
  DeleteRelationshipResponseSchema,
  GraphRelationshipBodySchema,
  type DeleteRelationshipResponse,
} from "@/features/authorization/schemas";

export const deleteRelationship: HttpRoute = {
  url: "/authorization/deleteRelationship",
  method: "POST",
  schema: {
    tags: ["authorization"],
    summary: "Delete a graph relationship",
    description: "Idempotently delete a relationship from the authorization graph (Ory Keto).",
    operationId: "deleteRelationship",
    body: GraphRelationshipBodySchema,
    response: {
      200: DeleteRelationshipResponseSchema,
    },
  },
  handler: async (request) => {
    const body = request.body;
    if (!Value.Check(GraphRelationshipBodySchema, body)) {
      throw new InvalidGraphRelationshipBodyError();
    }

    const hasSubject = body.subject !== undefined;
    const hasSubjectSet = body.subjectSet !== undefined;
    if (hasSubject === hasSubjectSet) {
      throw new InvalidGraphRelationshipBodyError(
        "Graph relationship requires exactly one of subject or subjectSet",
      );
    }

    const service = container.get<IAuthorizationService>(TYPES.AuthorizationService);
    const result = await service.deleteRelationship({
      object: body.object,
      relation: body.relation,
      subject: body.subject,
      subjectSet: body.subjectSet,
    });

    const response: DeleteRelationshipResponse = { deleted: result.deleted };
    return json(response);
  },
};
