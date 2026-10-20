import DeleteOutline from "@mui/icons-material/DeleteOutline";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useDeleteTenantMemberMutation, useGetTenantMembersQuery } from "@generated/gql";
import { useQueryClient } from "@tanstack/react-query";
import { getErrorMessage, useSnackbar } from "@shared/ui";
import { CreateTenantMemberModal } from "../CreateTenantMemberModal";

type TenantMembersProps = {
  tenantId: string;
};

const formatDateTime = (value: unknown): string => {
  if (value == null) {
    return "—";
  }
  if (typeof value === "string" || typeof value === "number" || value instanceof Date) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    return date.toLocaleString();
  }
  return "—";
};

const roleColor = (role: string): "primary" | "secondary" | "default" => {
  if (role === "owners") {
    return "primary";
  }
  if (role === "admins") {
    return "secondary";
  }
  return "default";
};

export const TenantMembers = ({ tenantId }: TenantMembersProps) => {
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteTenantMemberMutation();

  const membersQuery = useGetTenantMembersQuery(
    { tenantId },
    {
      enabled: Boolean(tenantId),
      select: (data) => data.getTenantMembers ?? [],
    },
  );

  const members = membersQuery.data ?? [];

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync({ id });
      await queryClient.invalidateQueries({ queryKey: ["GetTenantMembers"] });
      snackbar.success("Tenant member removed successfully");
    } catch (error) {
      snackbar.error(getErrorMessage(error, "Failed to remove tenant member"));
    }
  };

  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: "center", justifyContent: "space-between" }}
      >
        <Typography color="text.secondary">
          Members of this tenant and their assigned roles.
        </Typography>
        <CreateTenantMemberModal tenantId={tenantId} />
      </Stack>

      {membersQuery.isPending ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : null}

      {membersQuery.isError ? (
        <Alert severity="error">
          {getErrorMessage(membersQuery.error, "Failed to load tenant members")}
        </Alert>
      ) : null}

      {membersQuery.isSuccess && members.length === 0 ? (
        <Alert severity="info">No members found for this tenant.</Alert>
      ) : null}

      {membersQuery.isSuccess && members.length > 0 ? (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label="Tenant members">
            <TableHead>
              <TableRow>
                <TableCell>Identity ID</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((member) => {
                const id = member.id;
                if (!id) {
                  return null;
                }
                const role = member.role ?? "members";
                return (
                  <TableRow key={id}>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                      {member.identityId}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={role} color={roleColor(role)} variant="outlined" />
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.875rem" }}>
                      {formatDateTime(member.createdAt)}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        aria-label="Remove member"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          void handleDelete(id);
                        }}
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
    </Stack>
  );
};
