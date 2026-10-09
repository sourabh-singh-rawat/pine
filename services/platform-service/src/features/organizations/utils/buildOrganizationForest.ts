import type { Organization } from "@/db";

export type OrganizationNode = Organization & {
  children: OrganizationNode[];
};

const compareByName = (left: OrganizationNode, right: OrganizationNode) =>
  left.name.localeCompare(right.name);

export const buildOrganizationForest = (organizations: Organization[]): OrganizationNode[] => {
  const nodes = new Map<string, OrganizationNode>();

  for (const organization of organizations) {
    nodes.set(organization.id, {
      ...organization,
      children: [],
    });
  }

  const roots: OrganizationNode[] = [];

  for (const node of nodes.values()) {
    const parentId = node.parentOrganizationId;
    if (parentId) {
      const parent = nodes.get(parentId);
      if (parent) {
        parent.children.push(node);
        continue;
      }
    }
    roots.push(node);
  }

  const sortTree = (list: OrganizationNode[]) => {
    list.sort(compareByName);
    for (const node of list) {
      sortTree(node.children);
    }
  };

  sortTree(roots);
  return roots;
};
