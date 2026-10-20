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
import { useGetOrganizationTypesQuery } from "@generated/gql";
import { getErrorMessage } from "@shared/ui";
import { CreateOrganizationTypeModal } from "../CreateOrganizationTypeModal";

type TenantOrganizationTypesProps = {
  tenantId: string;
};

export const TenantOrganizationTypes = ({ tenantId }: TenantOrganizationTypesProps) => {
  const organizationTypesQuery = useGetOrganizationTypesQuery(
    { tenantId },
    {
      select: (data) => data.getOrganizationTypes ?? [],
      enabled: Boolean(tenantId),
    },
  );

  const organizationTypes = organizationTypesQuery.data ?? [];
  const organizationTypeNameById = new Map<string, string>();
  for (const organizationType of organizationTypes) {
    if (!organizationType.id) {
      continue;
    }
    organizationTypeNameById.set(
      organizationType.id,
      organizationType.name ?? organizationType.slug ?? organizationType.id,
    );
  }

  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: "center", justifyContent: "space-between" }}
      >
        <Typography color="text.secondary">
          Organization types in this tenant. Set a parent type to build the hierarchy.
        </Typography>
        <CreateOrganizationTypeModal tenantId={tenantId} />
      </Stack>

      {organizationTypesQuery.isPending ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      ) : null}

      {organizationTypesQuery.isError ? (
        <Alert severity="error">
          {getErrorMessage(organizationTypesQuery.error, "Failed to load organization types")}
        </Alert>
      ) : null}

      {organizationTypesQuery.isSuccess ? (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label="Organization types">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>Parent type</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {organizationTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography color="text.secondary">No organization types yet.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                organizationTypes.map((organizationType) => (
                  <TableRow key={organizationType.id ?? organizationType.slug ?? undefined}>
                    <TableCell>{organizationType.name ?? "—"}</TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                      {organizationType.slug ?? "—"}
                    </TableCell>
                    <TableCell>
                      {organizationType.parentOrganizationTypeId
                        ? (organizationTypeNameById.get(
                            organizationType.parentOrganizationTypeId,
                          ) ?? organizationType.parentOrganizationTypeId)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={organizationType.isActive ? "Active" : "Inactive"}
                        color={organizationType.isActive ? "success" : "default"}
                        variant={organizationType.isActive ? "filled" : "outlined"}
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
