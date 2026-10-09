import { describe, expect, it, vi } from "vitest";
import { KetoAuthorizationGraphProvider } from "@/integrations/authorization/ory-keto/KetoAuthorizationGraphProvider";

describe("KetoAuthorizationGraphProvider", () => {
  const createProvider = () => {
    const createRelationship = vi.fn().mockResolvedValue({});
    const deleteRelationships = vi.fn().mockResolvedValue({});
    const getRelationships = vi.fn().mockResolvedValue({ data: { relation_tuples: [] } });
    const checkPermission = vi.fn().mockResolvedValue({ data: { allowed: true } });

    const keto = {
      relationshipWriteApi: {
        createRelationship,
        deleteRelationships,
      },
      relationshipReadApi: {
        getRelationships,
      },
      permissionApi: {
        checkPermission,
      },
    };

    const provider = new KetoAuthorizationGraphProvider(keto as never);

    return {
      provider,
      createRelationship,
      deleteRelationships,
      getRelationships,
      checkPermission,
    };
  };

  it("creates a relationship with subject_id", async () => {
    const { provider, createRelationship } = createProvider();

    await provider.createRelationship({
      object: { namespace: "role", id: "role-1" },
      relation: "member",
      subject: { namespace: "identity", id: "user-1" },
    });

    expect(createRelationship).toHaveBeenCalledWith({
      createRelationshipBody: {
        namespace: "role",
        object: "role-1",
        relation: "member",
        subject_id: "identity:user-1",
      },
    });
  });

  it("creates a relationship with subject_set", async () => {
    const { provider, createRelationship } = createProvider();

    await provider.createRelationship({
      object: { namespace: "permission", id: "role:create" },
      relation: "has",
      subjectSet: { namespace: "role", id: "role-1", relation: "member" },
    });

    expect(createRelationship).toHaveBeenCalledWith({
      createRelationshipBody: {
        namespace: "permission",
        object: "role:create",
        relation: "has",
        subject_set: {
          namespace: "role",
          object: "role-1",
          relation: "member",
        },
      },
    });
  });

  it("deletes a relationship with subject_set query params", async () => {
    const { provider, deleteRelationships } = createProvider();

    await provider.deleteRelationship({
      object: { namespace: "permission", id: "role:create" },
      relation: "has",
      subjectSet: { namespace: "role", id: "role-1", relation: "member" },
    });

    expect(deleteRelationships).toHaveBeenCalledWith({
      namespace: "permission",
      object: "role:create",
      relation: "has",
      subjectSetNamespace: "role",
      subjectSetObject: "role-1",
      subjectSetRelation: "member",
    });
  });

  it("lists relationships filtered by subject set and maps subject_set responses", async () => {
    const { provider, getRelationships } = createProvider();
    getRelationships.mockResolvedValue({
      data: {
        relation_tuples: [
          {
            namespace: "permission",
            object: "role:create",
            relation: "has",
            subject_set: {
              namespace: "role",
              object: "role-1",
              relation: "member",
            },
          },
        ],
      },
    });

    const results = await provider.listRelationships({
      object: { namespace: "permission", id: "role:create" },
      relation: "has",
      subjectSet: { namespace: "role", id: "role-1", relation: "member" },
    });

    expect(getRelationships).toHaveBeenCalledWith({
      namespace: "permission",
      object: "role:create",
      relation: "has",
      subjectId: undefined,
      subjectSetNamespace: "role",
      subjectSetObject: "role-1",
      subjectSetRelation: "member",
    });

    expect(results).toEqual([
      {
        object: { namespace: "permission", id: "role:create" },
        relation: "has",
        subjectSet: { namespace: "role", id: "role-1", relation: "member" },
      },
    ]);
  });

  it("checks permission with namespace, object, relation, and subject", async () => {
    const { provider, checkPermission } = createProvider();

    await expect(
      provider.checkPermission({
        namespace: "tenant",
        object: "tenant-1",
        relation: "read",
        subject: "identity:user-1",
      }),
    ).resolves.toBe(true);

    expect(checkPermission).toHaveBeenCalledWith({
      namespace: "tenant",
      object: "tenant-1",
      relation: "read",
      subjectId: "identity:user-1",
    });
  });

  it("rejects relationships with neither subject nor subjectSet", async () => {
    const { provider } = createProvider();

    await expect(
      provider.createRelationship({
        object: { namespace: "role", id: "role-1" },
        relation: "member",
      }),
    ).rejects.toThrow("exactly one of subject or subjectSet");
  });

  it("rejects list filters with both subject and subjectSet", async () => {
    const { provider } = createProvider();

    await expect(
      provider.listRelationships({
        subject: { namespace: "identity", id: "user-1" },
        subjectSet: { namespace: "role", id: "role-1", relation: "member" },
      }),
    ).rejects.toThrow("must not set both subject and subjectSet");
  });

  it("lists relationships for a namespace without an object", async () => {
    const { provider, getRelationships } = createProvider();
    getRelationships.mockResolvedValue({
      data: {
        relation_tuples: [
          {
            namespace: "tenant",
            object: "tenant-1",
            relation: "member",
            subject_id: "identity:user-1",
          },
        ],
      },
    });

    const results = await provider.listRelationships({
      namespace: "tenant",
      subject: { namespace: "identity", id: "user-1" },
    });

    expect(getRelationships).toHaveBeenCalledTimes(1);
    expect(getRelationships).toHaveBeenCalledWith({
      namespace: "tenant",
      object: undefined,
      relation: undefined,
      subjectId: "identity:user-1",
      subjectSetNamespace: undefined,
      subjectSetObject: undefined,
      subjectSetRelation: undefined,
    });
    expect(results).toEqual([
      {
        object: { namespace: "tenant", id: "tenant-1" },
        relation: "member",
        subject: { namespace: "identity", id: "user-1" },
      },
    ]);
  });

  it("prefers object namespace over filter namespace", async () => {
    const { provider, getRelationships } = createProvider();

    await provider.listRelationships({
      namespace: "tenant",
      object: { namespace: "organization", id: "org-1" },
      subject: { namespace: "identity", id: "user-1" },
    });

    expect(getRelationships).toHaveBeenCalledTimes(1);
    expect(getRelationships).toHaveBeenCalledWith(
      expect.objectContaining({
        namespace: "organization",
        object: "org-1",
        subjectId: "identity:user-1",
      }),
    );
  });
});
