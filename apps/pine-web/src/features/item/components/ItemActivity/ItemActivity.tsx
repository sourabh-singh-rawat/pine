import { Stack, Typography, useTheme } from "@mui/material";
import { useGetAuditLogsQuery } from "@generated/gql";
import { ProgressCircularIndicator } from "@pine/ui";
import { useWorkspaceStore } from "@features/workspace/store";

interface ItemActivityProps {
  itemId: string;
}

const formatAction = (action: string): string => {
  if (action.length === 0) {
    return action;
  }
  return action.charAt(0).toUpperCase() + action.slice(1);
};

const formatTimestamp = (value: unknown): string => {
  if (!(value instanceof Date) && typeof value !== "string" && typeof value !== "number") {
    return "";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export const ItemActivity = ({ itemId }: ItemActivityProps) => {
  const theme = useTheme();
  const workspaceId = useWorkspaceStore((state) => state.currentWorkspace?.id);
  const auditLogsQuery = useGetAuditLogsQuery(
    {
      entityType: "item",
      entityId: itemId,
      workspaceId: workspaceId ?? "",
    },
    {
      enabled: Boolean(workspaceId) && Boolean(itemId),
      select: (data) => data.getAuditLogs ?? [],
    },
  );

  const logs = auditLogsQuery.data ?? [];

  return (
    <Stack spacing={1}>
      <Typography variant="body1" fontWeight="600">
        Activity
      </Typography>

      {!workspaceId && (
        <Typography variant="body2" color="text.secondary">
          Select a workspace to view activity.
        </Typography>
      )}

      {workspaceId && auditLogsQuery.isPending && (
        <ProgressCircularIndicator size={32} aria-label="Loading activity" />
      )}

      {workspaceId && auditLogsQuery.isError && (
        <Typography variant="body2" color="error">
          Failed to load activity.
        </Typography>
      )}

      {workspaceId && auditLogsQuery.isSuccess && logs.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No activity yet.
        </Typography>
      )}

      {workspaceId &&
        logs.map((log) => (
          <Stack
            key={log.id ?? `${log.action}-${String(log.createdAt)}`}
            direction="row"
            spacing={2}
            sx={{
              py: theme.spacing(1),
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="body2" sx={{ minWidth: theme.spacing(12) }}>
              {formatAction(log.action ?? "")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              {log.actorId ? `by ${log.actorId}` : "by unknown"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatTimestamp(log.createdAt)}
            </Typography>
          </Stack>
        ))}
    </Stack>
  );
};
