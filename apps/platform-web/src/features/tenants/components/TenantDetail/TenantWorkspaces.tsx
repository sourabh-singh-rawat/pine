import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useGetWorkspacesQuery } from "@generated/gql";
import { useNavigate } from "@tanstack/react-router";
import { getErrorMessage } from "@shared/ui";
import { CreateWorkspaceModal } from "../CreateWorkspaceModal";

type TenantWorkspacesProps = {
  tenantId: string;
};

export const TenantWorkspaces = ({ tenantId }: TenantWorkspacesProps) => {
  const navigate = useNavigate();
  const workspacesQuery = useGetWorkspacesQuery(
    { tenantId },
    {
      select: (data) => data.getWorkspaces ?? [],
      enabled: Boolean(tenantId),
    },
  );

  const workspaces = workspacesQuery.data ?? [];
  const workspaceNameById = new Map<string, string>();
  for (const workspace of workspaces) {
    if (!workspace.id) {
      continue;
    }
    workspaceNameById.set(workspace.id, workspace.name ?? workspace.slug ?? workspace.id);
  }

  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: "center", justifyContent: "space-between" }}
      >
        <Typography color="text.secondary">Workspaces that belong to this tenant.</Typography>
        <CreateWorkspaceModal tenantId={tenantId} />
      </Stack>

      {workspacesQuery.isPending ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      ) : null}

      {workspacesQuery.isError ? (
        <Alert severity="error">
          {getErrorMessage(workspacesQuery.error, "Failed to load workspaces")}
        </Alert>
      ) : null}

      {workspacesQuery.isSuccess ? (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label="Tenant workspaces">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Parent</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workspaces.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography color="text.secondary">No workspaces found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                workspaces.map((workspace) => (
                  <TableRow
                    key={workspace.id ?? workspace.slug ?? undefined}
                    hover
                    sx={workspace.id ? { cursor: "pointer" } : undefined}
                    onClick={() => {
                      if (!workspace.id) {
                        return;
                      }
                      void navigate({
                        to: "/tenants/$tenantId/workspaces/$workspaceId",
                        params: {
                          tenantId,
                          workspaceId: workspace.id,
                        },
                        search: { tab: "overview" },
                      });
                    }}
                  >
                    <TableCell>{workspace.name ?? "—"}</TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                      {workspace.slug ?? "—"}
                    </TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                      {workspace.id ?? "—"}
                    </TableCell>
                    <TableCell>
                      {workspace.parentWorkspaceId
                        ? (workspaceNameById.get(workspace.parentWorkspaceId) ??
                          workspace.parentWorkspaceId)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={workspace.isActive ? "Active" : "Inactive"}
                        color={workspace.isActive ? "success" : "default"}
                        variant={workspace.isActive ? "filled" : "outlined"}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
    </Stack>
  );
};
