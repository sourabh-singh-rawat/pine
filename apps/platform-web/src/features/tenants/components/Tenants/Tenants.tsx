import DeleteOutline from "@mui/icons-material/DeleteOutline";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
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
import { PLATFORM_OBJECT_ID } from "@pine/authorization";
import { useDeleteTenantMutation, useGetTenantsQuery } from "@generated/gql";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { getErrorMessage, useSnackbar } from "@shared/ui";
import { CreateTenantModal } from "../CreateTenantModal";

export const Tenants = () => {
  const navigate = useNavigate();
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();
  const tenantsQuery = useGetTenantsQuery(
    { platformId: PLATFORM_OBJECT_ID },
    {
      select: (data) => data.getTenants ?? [],
    },
  );
  const deleteTenantMutation = useDeleteTenantMutation();

  const tenants = tenantsQuery.data ?? [];

  const handleDelete = async (id: string | null | undefined, name: string | null | undefined) => {
    if (!id) {
      return;
    }

    const label = name?.trim() || "this tenant";
    const confirmed = window.confirm(`Delete ${label}? This cannot be undone from the UI.`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteTenantMutation.mutateAsync({ id, platformId: PLATFORM_OBJECT_ID });
      await queryClient.invalidateQueries({ queryKey: ["GetTenants"] });
      snackbar.success("Tenant deleted successfully");
    } catch (error) {
      snackbar.error(getErrorMessage(error, "Failed to delete tenant"));
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ mb: 3, alignItems: "flex-start", justifyContent: "space-between" }}
      >
        <Box>
          <Typography variant="h5" component="h1" gutterBottom>
            Tenants
          </Typography>
          <Typography color="text.secondary">Tenants managed by the tenant service.</Typography>
        </Box>
        <CreateTenantModal />
      </Stack>

      {tenantsQuery.isPending ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      ) : null}

      {tenantsQuery.isError ? (
        <Alert severity="error">
          {getErrorMessage(tenantsQuery.error, "Failed to load tenants")}
        </Alert>
      ) : null}

      {tenantsQuery.isSuccess ? (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label="Tenants">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right" width={72}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography color="text.secondary">No tenants found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((tenant) => (
                  <TableRow
                    key={tenant.id ?? tenant.slug ?? undefined}
                    hover
                    sx={tenant.id ? { cursor: "pointer" } : undefined}
                    onClick={() => {
                      if (!tenant.id) {
                        return;
                      }
                      void navigate({
                        to: "/tenants/$tenantId",
                        params: { tenantId: tenant.id },
                        search: { tab: "overview" },
                      });
                    }}
                  >
                    <TableCell>{tenant.name ?? "—"}</TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                      {tenant.slug ?? "—"}
                    </TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                      {tenant.id ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={tenant.isActive ? "Active" : "Inactive"}
                        color={tenant.isActive ? "success" : "default"}
                        variant={tenant.isActive ? "filled" : "outlined"}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        aria-label={`Delete ${tenant.name ?? "tenant"}`}
                        disabled={
                          !tenant.id ||
                          (deleteTenantMutation.isPending &&
                            deleteTenantMutation.variables?.id === tenant.id)
                        }
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleDelete(tenant.id, tenant.name);
                        }}
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
    </Container>
  );
};
