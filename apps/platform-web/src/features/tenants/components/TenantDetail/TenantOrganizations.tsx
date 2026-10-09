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
import { useGetOrganizationsQuery } from "@generated/gql";
import { useNavigate } from "@tanstack/react-router";
import { getErrorMessage } from "@shared/ui";
import { CreateOrganizationModal } from "../CreateOrganizationModal";

type TenantOrganizationsProps = {
  tenantId: string;
};

export const TenantOrganizations = ({ tenantId }: TenantOrganizationsProps) => {
  const navigate = useNavigate();
  const organizationsQuery = useGetOrganizationsQuery(
    { tenantId },
    {
      select: (data) => data.getOrganizations ?? [],
      enabled: Boolean(tenantId),
    },
  );

  const organizations = organizationsQuery.data ?? [];
  const organizationNameById = new Map<string, string>();
  for (const organization of organizations) {
    if (!organization.id) {
      continue;
    }
    organizationNameById.set(
      organization.id,
      organization.name ?? organization.slug ?? organization.id,
    );
  }

  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: "center", justifyContent: "space-between" }}
      >
        <Typography color="text.secondary">Organizations that belong to this tenant.</Typography>
        <CreateOrganizationModal tenantId={tenantId} />
      </Stack>

      {organizationsQuery.isPending ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      ) : null}

      {organizationsQuery.isError ? (
        <Alert severity="error">
          {getErrorMessage(organizationsQuery.error, "Failed to load organizations")}
        </Alert>
      ) : null}

      {organizationsQuery.isSuccess ? (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label="Tenant organizations">
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
              {organizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography color="text.secondary">No organizations found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                organizations.map((organization) => (
                  <TableRow
                    key={organization.id ?? organization.slug ?? undefined}
                    hover
                    sx={organization.id ? { cursor: "pointer" } : undefined}
                    onClick={() => {
                      if (!organization.id) {
                        return;
                      }
                      void navigate({
                        to: "/tenants/$tenantId/organizations/$organizationId",
                        params: {
                          tenantId,
                          organizationId: organization.id,
                        },
                        search: { tab: "overview" },
                      });
                    }}
                  >
                    <TableCell>{organization.name ?? "—"}</TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                      {organization.slug ?? "—"}
                    </TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                      {organization.id ?? "—"}
                    </TableCell>
                    <TableCell>
                      {organization.parentOrganizationId
                        ? (organizationNameById.get(organization.parentOrganizationId) ??
                          organization.parentOrganizationId)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={organization.isActive ? "Active" : "Inactive"}
                        color={organization.isActive ? "success" : "default"}
                        variant={organization.isActive ? "filled" : "outlined"}
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
