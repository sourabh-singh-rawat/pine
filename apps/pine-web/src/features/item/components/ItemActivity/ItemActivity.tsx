import { Stack, Typography, useTheme } from "@mui/material";
import { useGetItemAuditLogsQuery } from "@generated/gql";
import { ProgressCircularIndicator } from "@pine/ui";
import { useOrganizationStore } from "@features/organization/store";

interface ItemActivityProps {
  itemId: string;
}

type ActorLabelSource = {
  actorId?: string | null;
  actor?: {
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
};

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

const formatActorLabel = (log: ActorLabelSource): string => {
  const fullName = log.actor?.fullName?.trim();
  if (fullName) {
    return `by ${fullName}`;
  }

  const firstName = log.actor?.firstName?.trim() ?? "";
  const lastName = log.actor?.lastName?.trim() ?? "";
  const combinedName = `${firstName} ${lastName}`.trim();
  if (combinedName.length > 0) {
    return `by ${combinedName}`;
  }

  if (log.actorId) {
    return "by unknown user";
  }

  return "by unknown";
};

export const ItemActivity = ({ itemId }: ItemActivityProps) => {
  const theme = useTheme();
  const organizationId = useOrganizationStore((state) => state.currentOrganization?.id);
  const auditLogsQuery = useGetItemAuditLogsQuery(
    {
      itemId,
      organizationId: organizationId ?? "",
    },
    {
      enabled: Boolean(organizationId) && Boolean(itemId),
      select: (data) => data.getItemAuditLogs ?? [],
    },
  );

  const logs = auditLogsQuery.data ?? [];

  return (
    <Stack spacing={1}>
      <Typography variant="body1" fontWeight="600">
        Activity
      </Typography>

      {!organizationId && (
        <Typography variant="body2" color="text.secondary">
          Select a organization to view activity.
        </Typography>
      )}

      {organizationId && auditLogsQuery.isPending && (
        <ProgressCircularIndicator size={32} aria-label="Loading activity" />
      )}

      {organizationId && auditLogsQuery.isError && (
        <Typography variant="body2" color="error">
          Failed to load activity.
        </Typography>
      )}

      {organizationId && auditLogsQuery.isSuccess && logs.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No activity yet.
        </Typography>
      )}

      {organizationId &&
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
              {formatActorLabel(log)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatTimestamp(log.createdAt)}
            </Typography>
          </Stack>
        ))}
    </Stack>
  );
};
