import { describe, expect, it } from "vitest";
import type { Organization } from "@/db";
import { buildOrganizationForest } from "@/features/organizations/utils/buildOrganizationForest";

const base = {
  tenantId: "tenant-1",
  description: null,
  isActive: true,
  version: 1,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: null,
  deletedAt: null,
} satisfies Omit<Organization, "id" | "name" | "slug" | "parentOrganizationId">;

const org = (
  id: string,
  name: string,
  parentOrganizationId: string | null = null,
  tenantId = "tenant-1",
): Organization => ({
  ...base,
  id,
  name,
  slug: id,
  parentOrganizationId,
  tenantId,
});

describe("buildOrganizationForest", () => {
  it("returns an empty forest for an empty list", () => {
    expect(buildOrganizationForest([])).toEqual([]);
  });

  it("returns all orgs as roots when none have parents in the set", () => {
    const forest = buildOrganizationForest([org("b", "Beta"), org("a", "Alpha")]);

    expect(forest.map((node) => node.id)).toEqual(["a", "b"]);
    expect(forest.every((node) => node.children.length === 0)).toBe(true);
  });

  it("nests children under parents present in the set", () => {
    const forest = buildOrganizationForest([
      org("child", "Child", "parent"),
      org("parent", "Parent"),
    ]);

    expect(forest).toHaveLength(1);
    expect(forest[0]?.id).toBe("parent");
    expect(forest[0]?.children.map((node) => node.id)).toEqual(["child"]);
  });

  it("promotes orgs to roots when their parent is missing from the set", () => {
    const forest = buildOrganizationForest([org("child", "Child", "missing-parent")]);

    expect(forest).toHaveLength(1);
    expect(forest[0]?.id).toBe("child");
    expect(forest[0]?.children).toEqual([]);
  });

  it("builds multi-level trees and sorts each level by name", () => {
    const forest = buildOrganizationForest([
      org("root", "Root"),
      org("z", "Zed", "root"),
      org("a", "Able", "root"),
      org("a1", "Able One", "a"),
      org("orphan", "Orphan", "gone"),
    ]);

    expect(forest.map((node) => node.id)).toEqual(["orphan", "root"]);
    expect(forest[1]?.children.map((node) => node.id)).toEqual(["a", "z"]);
    expect(forest[1]?.children[0]?.children.map((node) => node.id)).toEqual(["a1"]);
  });
});
