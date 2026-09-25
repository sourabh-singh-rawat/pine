import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme, type Theme } from "@mui/material/styles";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import { useMemo } from "react";
import "@xyflow/react/dist/style.css";

export type IdentityRelationsGraphPlatformRelation = {
  id: string | null;
  relation: string | null;
};

export type IdentityRelationsGraphTenantRelation = {
  id: string | null;
  tenantId: string | null;
  relation: string | null;
};

export type IdentityRelationsGraphWorkspaceRelation = {
  id: string | null;
  workspaceId: string | null;
  relation: string | null;
};

export type IdentityRelationsGraphProps = {
  identityId: string;
  displayName?: string | null;
  platform: IdentityRelationsGraphPlatformRelation[];
  tenants: IdentityRelationsGraphTenantRelation[];
  workspaces: IdentityRelationsGraphWorkspaceRelation[];
  height?: number;
};

type RelationKind = "identity" | "platform" | "tenant" | "workspace";

type RelationNodeData = {
  kind: RelationKind;
  title: string;
  subtitle?: string;
};

type RelationFlowNode = Node<RelationNodeData, "relation">;

type TargetEdgeState = {
  nodeData: RelationNodeData;
  memberships: string[];
};

const NODE_WIDTH = 220;
const NODE_HEIGHT = 72;
const COLUMN_GAP = 280;
const ROW_GAP = 96;
const ID_PREVIEW_LENGTH = 8;

const KIND_LABEL: Record<RelationKind, string> = {
  identity: "Identity",
  platform: "Platform",
  tenant: "Tenant",
  workspace: "Workspace",
};

const truncateId = (value: string): string => {
  if (value.length <= ID_PREVIEW_LENGTH + 1) {
    return value;
  }
  return `${value.slice(0, ID_PREVIEW_LENGTH)}…`;
};

const kindAccent = (theme: Theme, kind: RelationKind): string => {
  switch (kind) {
    case "identity":
      return theme.palette.primary.main;
    case "platform":
      return theme.palette.info.main;
    case "tenant":
      return theme.palette.success.main;
    case "workspace":
      return theme.palette.warning.main;
  }
};

const RelationNode = ({ data }: NodeProps<RelationFlowNode>) => {
  const theme = useTheme();
  const accent = kindAccent(theme, data.kind);
  const isIdentity = data.kind === "identity";

  return (
    <Box
      sx={{
        width: NODE_WIDTH,
        minHeight: NODE_HEIGHT,
        boxSizing: "border-box",
        border: 1,
        borderColor: isIdentity ? accent : "divider",
        borderLeft: 4,
        borderLeftColor: accent,
        borderRadius: 1,
        backgroundColor: theme.palette.background.paper,
        px: 1.25,
        py: 1,
        boxShadow: isIdentity ? 1 : 0,
      }}
    >
      {!isIdentity ? (
        <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      ) : null}
      <Stack spacing={0.25} sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            color: accent,
            fontWeight: 600,
            letterSpacing: 0.4,
            textTransform: "uppercase",
            lineHeight: 1.2,
          }}
        >
          {KIND_LABEL[data.kind]}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            lineHeight: 1.3,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={data.title}
        >
          {data.title}
        </Typography>
        {data.subtitle ? (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontFamily: "monospace",
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={data.subtitle}
          >
            {data.subtitle}
          </Typography>
        ) : null}
      </Stack>
      {isIdentity ? (
        <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
      ) : null}
    </Box>
  );
};

const nodeTypes = {
  relation: RelationNode,
} satisfies NodeTypes;

const ensureTarget = (
  targets: Map<string, TargetEdgeState>,
  targetId: string,
  nodeData: RelationNodeData,
): TargetEdgeState => {
  const existing = targets.get(targetId);
  if (existing) {
    return existing;
  }
  const created: TargetEdgeState = {
    nodeData,
    memberships: [],
  };
  targets.set(targetId, created);
  return created;
};

const addMembership = (
  targets: Map<string, TargetEdgeState>,
  targetId: string,
  nodeData: RelationNodeData,
  relation: string,
): void => {
  const target = ensureTarget(targets, targetId, nodeData);
  if (!target.memberships.includes(relation)) {
    target.memberships.push(relation);
  }
};

export const IdentityRelationsGraph = ({
  identityId,
  displayName,
  platform,
  tenants,
  workspaces,
  height = 360,
}: IdentityRelationsGraphProps) => {
  const theme = useTheme();

  const graph = useMemo(() => {
    const identityNodeId = `identity:${identityId}`;
    const targets = new Map<string, TargetEdgeState>();

    for (const item of platform) {
      if (!item.relation) {
        continue;
      }
      addMembership(
        targets,
        "platform:platform",
        {
          kind: "platform",
          title: "Platform",
        },
        item.relation,
      );
    }

    for (const item of tenants) {
      if (!item.tenantId || !item.relation) {
        continue;
      }
      addMembership(
        targets,
        `tenant:${item.tenantId}`,
        {
          kind: "tenant",
          title: truncateId(item.tenantId),
          subtitle: item.tenantId,
        },
        item.relation,
      );
    }

    for (const item of workspaces) {
      if (!item.workspaceId || !item.relation) {
        continue;
      }
      addMembership(
        targets,
        `workspace:${item.workspaceId}`,
        {
          kind: "workspace",
          title: truncateId(item.workspaceId),
          subtitle: item.workspaceId,
        },
        item.relation,
      );
    }

    const objectEntries = Array.from(targets.entries()).sort(([leftId], [rightId]) => {
      const kindOrder = (id: string): number => {
        if (id.startsWith("platform:")) {
          return 0;
        }
        if (id.startsWith("tenant:")) {
          return 1;
        }
        return 2;
      };
      const kindDiff = kindOrder(leftId) - kindOrder(rightId);
      if (kindDiff !== 0) {
        return kindDiff;
      }
      return leftId.localeCompare(rightId);
    });

    const stackHeight =
      objectEntries.length > 0 ? (objectEntries.length - 1) * ROW_GAP + NODE_HEIGHT : NODE_HEIGHT;
    const identityY = Math.max(0, (stackHeight - NODE_HEIGHT) / 2);

    const identityTitle = displayName?.trim() ? displayName.trim() : truncateId(identityId);
    const identitySubtitle = displayName?.trim() ? identityId : undefined;

    const nodes: RelationFlowNode[] = [
      {
        id: identityNodeId,
        type: "relation",
        position: { x: 0, y: identityY },
        data: {
          kind: "identity",
          title: identityTitle,
          subtitle: identitySubtitle,
        },
        draggable: false,
        selectable: false,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      },
    ];

    objectEntries.forEach(([nodeId, state], index) => {
      nodes.push({
        id: nodeId,
        type: "relation",
        position: {
          x: COLUMN_GAP,
          y: index * ROW_GAP,
        },
        data: state.nodeData,
        draggable: false,
        selectable: false,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });
    });

    const edges: Edge[] = objectEntries.map(([targetId, state], index) => {
      const label = state.memberships.join(" · ");
      const offset = (index - (objectEntries.length - 1) / 2) * 12;
      const stroke = theme.palette.grey[500];

      return {
        id: `${identityNodeId}->${targetId}`,
        source: identityNodeId,
        target: targetId,
        type: "smoothstep",
        label,
        pathOptions: { borderRadius: 12, offset },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: stroke,
        },
        style: {
          stroke,
          strokeWidth: 1.5,
        },
        labelStyle: {
          fontFamily: theme.typography.fontFamily,
          fontSize: 11,
          fontWeight: 600,
          fill: theme.palette.text.secondary,
        },
        labelBgStyle: {
          fill: theme.palette.background.paper,
          fillOpacity: 0.92,
        },
        labelBgPadding: [4, 8],
        labelBgBorderRadius: 4,
      };
    });

    return { nodes, edges };
  }, [displayName, identityId, workspaces, platform, tenants, theme]);

  if (graph.edges.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        height,
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        overflow: "hidden",
        backgroundColor: "background.default",
      }}
    >
      <ReactFlow
        nodes={graph.nodes}
        edges={graph.edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
        minZoom={0.4}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: "smoothstep",
        }}
      >
        <Background gap={20} size={1} color={theme.palette.divider} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </Box>
  );
};
