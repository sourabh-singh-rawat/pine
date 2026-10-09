import { create } from "zustand";
import type { GetMyOrganizationsQuery } from "@generated/gql";

type GetMyOrganizationsResult = NonNullable<GetMyOrganizationsQuery["getMyOrganizations"]>;
export type OrganizationFromQuery = GetMyOrganizationsResult[number];

type OrganizationTreeNode = {
  id?: string | null;
  name?: string | null;
  slug?: string | null;
  tenantId?: string | null;
  isActive?: boolean | null;
  children?: ReadonlyArray<OrganizationTreeNode> | null;
};

export type CurrentOrganization = {
  id: string;
  name: string;
  slug: string;
  tenantId: string;
};

const STORAGE_KEY = "currentOrganization";

const isCurrentOrganization = (value: unknown): value is CurrentOrganization => {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if (!("id" in value) || !("name" in value) || !("slug" in value) || !("tenantId" in value)) {
    return false;
  }
  return (
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.slug === "string" &&
    typeof value.tenantId === "string"
  );
};

const readStoredOrganization = (): CurrentOrganization | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    return isCurrentOrganization(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const writeStoredOrganization = (organization: CurrentOrganization | null) => {
  if (!organization) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(organization));
};

export const toCurrentOrganization = (
  organization: OrganizationTreeNode,
): CurrentOrganization | null => {
  if (
    typeof organization.id !== "string" ||
    typeof organization.name !== "string" ||
    typeof organization.slug !== "string" ||
    typeof organization.tenantId !== "string"
  ) {
    return null;
  }
  if (organization.isActive === false) {
    return null;
  }
  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    tenantId: organization.tenantId,
  };
};

export const flattenOrganizations = (
  organizations: ReadonlyArray<OrganizationTreeNode>,
): CurrentOrganization[] => {
  const flattened: CurrentOrganization[] = [];

  const visit = (nodes: ReadonlyArray<OrganizationTreeNode>) => {
    for (const node of nodes) {
      const current = toCurrentOrganization(node);
      if (current) {
        flattened.push(current);
      }
      if (node.children && node.children.length > 0) {
        visit(node.children);
      }
    }
  };

  visit(organizations);
  return flattened;
};

type SyncOrganizationsOptions = {
  preferredOrganizationId?: string | null;
};

interface OrganizationState {
  organizations: CurrentOrganization[];
  currentOrganization: CurrentOrganization | null;
  isLoading: boolean;
  setCurrentOrganization: (organization: CurrentOrganization | null) => void;
  syncOrganizations: (
    organizations: OrganizationFromQuery[],
    options?: SyncOrganizationsOptions,
  ) => void;
}

export const useOrganizationStore = create<OrganizationState>((set, get) => ({
  organizations: [],
  currentOrganization: null,
  isLoading: true,
  setCurrentOrganization: (organization) => {
    writeStoredOrganization(organization);
    set({ currentOrganization: organization });
  },
  syncOrganizations: (organizations, options) => {
    const nextOrganizations = flattenOrganizations(organizations);

    const preferredId = options?.preferredOrganizationId;
    const preferred = preferredId
      ? nextOrganizations.find((organization) => organization.id === preferredId)
      : undefined;

    const stored = get().currentOrganization ?? readStoredOrganization();
    const matchedStored = stored
      ? nextOrganizations.find((organization) => organization.id === stored.id)
      : undefined;

    const currentOrganization = preferred ?? matchedStored ?? nextOrganizations[0] ?? null;

    writeStoredOrganization(currentOrganization);
    set({
      organizations: nextOrganizations,
      currentOrganization,
      isLoading: false,
    });
  },
}));
