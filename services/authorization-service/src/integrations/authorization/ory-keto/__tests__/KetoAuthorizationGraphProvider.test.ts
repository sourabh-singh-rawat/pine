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
      object: { namespace: "Role", id: "role-1" },
      relation: "member",
      subject: { namespace: "Identity", id: "user-1" },
    });

    expect(createRelationship).toHaveBeenCalledWith({
      createRelationshipBody: {
        namespace: "Role",
        object: "role-1",
        relation: "member",
        subject_id: "Identity:user-1",
      },
    });
  });

  it("creates a relationship with subject_set", async () => {
    const { provider, createRelationship } = createProvider();

    await provider.createRelationship({
      object: { namespace: "Permission", id: "Role:create" },
      relation: "has",
      subjectSet: { namespace: "Role", id: "role-1", relation: "member" },
    });

    expect(createRelationship).toHaveBeenCalledWith({
      createRelationshipBody: {
        namespace: "Permission",
        object: "Role:create",
        relation: "has",
        subject_set: {
          namespace: "Role",
          object: "role-1",
          relation: "member",
        },
      },
    });
  });

  it("deletes a relationship with subject_set query params", async () => {
    const { provider, deleteRelationships } = createProvider();

    await provider.deleteRelationship({
      object: { namespace: "Permission", id: "Role:create" },
      relation: "has",
      subjectSet: { namespace: "Role", id: "role-1", relation: "member" },
    });

    expect(deleteRelationships).toHaveBeenCalledWith({
      namespace: "Permission",
      object: "Role:create",
      relation: "has",
      subjectSetNamespace: "Role",
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
            namespace: "Permission",
            object: "Role:create",
            relation: "has",
            subject_set: {
              namespace: "Role",
              object: "role-1",
              relation: "member",
            },
          },
        ],
      },
    });

    const results = await provider.listRelationships({
      object: { namespace: "Permission", id: "Role:create" },
      relation: "has",
      subjectSet: { namespace: "Role", id: "role-1", relation: "member" },
    });

    expect(getRelationships).toHaveBeenCalledWith({
      namespace: "Permission",
      object: "Role:create",
      relation: "has",
      subjectId: undefined,
      subjectSetNamespace: "Role",
      subjectSetObject: "role-1",
      subjectSetRelation: "member",
    });

    expect(results).toEqual([
      {
        object: { namespace: "Permission", id: "Role:create" },
        relation: "has",
        subjectSet: { namespace: "Role", id: "role-1", relation: "member" },
      },
    ]);
  });

  it("checks permission with namespace, object, relation, and subject", async () => {
    const { provider, checkPermission } = createProvider();

    await expect(
      provider.checkPermission({
        namespace: "Tenant",
        object: "tenant-1",
        relation: "read",
        subject: "Identity:user-1",
      }),
    ).resolves.toBe(true);

    expect(checkPermission).toHaveBeenCalledWith({
      namespace: "Tenant",
      object: "tenant-1",
      relation: "read",
      subjectId: "Identity:user-1",
    });
  });

  it("rejects relationships with neither subject nor subjectSet", async () => {
    const { provider } = createProvider();

    await expect(
      provider.createRelationship({
        object: { namespace: "Role", id: "role-1" },
        relation: "member",
      }),
    ).rejects.toThrow("exactly one of subject or subjectSet");
  });

  it("rejects list filters with both subject and subjectSet", async () => {
    const { provider } = createProvider();

    await expect(
      provider.listRelationships({
        subject: { namespace: "Identity", id: "user-1" },
        subjectSet: { namespace: "Role", id: "role-1", relation: "member" },
      }),
    ).rejects.toThrow("must not set both subject and subjectSet");
  });

  it("lists relationships for a namespace without an object", async () => {
    const { provider, getRelationships } = createProvider();
    getRelationships.mockResolvedValue({
      data: {
        relation_tuples: [
          {
            namespace: "Tenant",
            object: "tenant-1",
            relation: "member",
            subject_id: "Identity:user-1",
          },
        ],
      },
    });

    const results = await provider.listRelationships({
      namespace: "Tenant",
      subject: { namespace: "Identity", id: "user-1" },
    });

    expect(getRelationships).toHaveBeenCalledTimes(1);
    expect(getRelationships).toHaveBeenCalledWith({
      namespace: "Tenant",
      object: undefined,
      relation: undefined,
      subjectId: "Identity:user-1",
      subjectSetNamespace: undefined,
      subjectSetObject: undefined,
      subjectSetRelation: undefined,
    });
    expect(results).toEqual([
      {
        object: { namespace: "Tenant", id: "tenant-1" },
        relation: "member",
        subject: { namespace: "Identity", id: "user-1" },
      },
    ]);
  });

  it("prefers object namespace over filter namespace", async () => {
    const { provider, getRelationships } = createProvider();

    await provider.listRelationships({
      namespace: "Tenant",
      object: { namespace: "Organization", id: "org-1" },
      subject: { namespace: "Identity", id: "user-1" },
    });

    expect(getRelationships).toHaveBeenCalledTimes(1);
    expect(getRelationships).toHaveBeenCalledWith(
      expect.objectContaining({
        namespace: "Organization",
        object: "org-1",
        subjectId: "Identity:user-1",
      }),
    );
  });
});
