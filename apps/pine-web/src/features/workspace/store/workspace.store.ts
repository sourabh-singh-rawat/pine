import { create } from "zustand";
import type { GetMyWorkspacesQuery } from "@generated/gql";

type GetMyWorkspacesResult = NonNullable<GetMyWorkspacesQuery["getMyWorkspaces"]>;
export type WorkspaceFromQuery = GetMyWorkspacesResult[number];

type WorkspaceTreeNode = {
  id?: string | null;
  name?: string | null;
  slug?: string | null;
  tenantId?: string | null;
  isActive?: boolean | null;
  children?: ReadonlyArray<WorkspaceTreeNode> | null;
};

export type CurrentWorkspace = {
  id: string;
  name: string;
  slug: string;
  tenantId: string;
};

const STORAGE_KEY = "currentWorkspace";

const isCurrentWorkspace = (value: unknown): value is CurrentWorkspace => {
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

const readStoredWorkspace = (): CurrentWorkspace | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    return isCurrentWorkspace(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const writeStoredWorkspace = (workspace: CurrentWorkspace | null) => {
  if (!workspace) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
};

export const toCurrentWorkspace = (workspace: WorkspaceTreeNode): CurrentWorkspace | null => {
  if (
    typeof workspace.id !== "string" ||
    typeof workspace.name !== "string" ||
    typeof workspace.slug !== "string" ||
    typeof workspace.tenantId !== "string"
  ) {
    return null;
  }
  if (workspace.isActive === false) {
    return null;
  }
  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    tenantId: workspace.tenantId,
  };
};

export const flattenWorkspaces = (
  workspaces: ReadonlyArray<WorkspaceTreeNode>,
): CurrentWorkspace[] => {
  const flattened: CurrentWorkspace[] = [];

  const visit = (nodes: ReadonlyArray<WorkspaceTreeNode>) => {
    for (const node of nodes) {
      const current = toCurrentWorkspace(node);
      if (current) {
        flattened.push(current);
      }
      if (node.children && node.children.length > 0) {
        visit(node.children);
      }
    }
  };

  visit(workspaces);
  return flattened;
};

type SyncWorkspacesOptions = {
  preferredWorkspaceId?: string | null;
};

interface WorkspaceState {
  workspaces: CurrentWorkspace[];
  currentWorkspace: CurrentWorkspace | null;
  isLoading: boolean;
  setCurrentWorkspace: (workspace: CurrentWorkspace | null) => void;
  syncWorkspaces: (workspaces: WorkspaceFromQuery[], options?: SyncWorkspacesOptions) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  currentWorkspace: null,
  isLoading: true,
  setCurrentWorkspace: (workspace) => {
    writeStoredWorkspace(workspace);
    set({ currentWorkspace: workspace });
  },
  syncWorkspaces: (workspaces, options) => {
    const nextWorkspaces = flattenWorkspaces(workspaces);

    const preferredId = options?.preferredWorkspaceId;
    const preferred = preferredId
      ? nextWorkspaces.find((workspace) => workspace.id === preferredId)
      : undefined;

    const stored = get().currentWorkspace ?? readStoredWorkspace();
    const matchedStored = stored
      ? nextWorkspaces.find((workspace) => workspace.id === stored.id)
      : undefined;

    const currentWorkspace = preferred ?? matchedStored ?? nextWorkspaces[0] ?? null;

    writeStoredWorkspace(currentWorkspace);
    set({
      workspaces: nextWorkspaces,
      currentWorkspace,
      isLoading: false,
    });
  },
}));
