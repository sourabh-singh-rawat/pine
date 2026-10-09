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
import { useGetOfficeTypesQuery } from "@generated/gql";
import { getErrorMessage } from "@shared/ui";
import { CreateOfficeTypeModal } from "../CreateOfficeTypeModal";

type TenantOfficeTypesProps = {
  tenantId: string;
};

export const TenantOfficeTypes = ({ tenantId }: TenantOfficeTypesProps) => {
  const officeTypesQuery = useGetOfficeTypesQuery(
    { tenantId },
    {
      select: (data) => data.getOfficeTypes ?? [],
      enabled: Boolean(tenantId),
    },
  );

  const officeTypes = officeTypesQuery.data ?? [];
  const officeTypeNameById = new Map<string, string>();
  for (const officeType of officeTypes) {
    if (!officeType.id) {
      continue;
    }
    officeTypeNameById.set(officeType.id, officeType.name ?? officeType.slug ?? officeType.id);
  }

  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: "center", justifyContent: "space-between" }}
      >
        <Typography color="text.secondary">
          Office types in this tenant. Set a parent type to build the hierarchy.
        </Typography>
        <CreateOfficeTypeModal tenantId={tenantId} />
      </Stack>

      {officeTypesQuery.isPending ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      ) : null}

      {officeTypesQuery.isError ? (
        <Alert severity="error">
          {getErrorMessage(officeTypesQuery.error, "Failed to load office types")}
        </Alert>
      ) : null}

      {officeTypesQuery.isSuccess ? (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label="Office types">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>Parent type</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {officeTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography color="text.secondary">No office types yet.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                officeTypes.map((officeType) => (
                  <TableRow key={officeType.id ?? officeType.slug ?? undefined}>
                    <TableCell>{officeType.name ?? "—"}</TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                      {officeType.slug ?? "—"}
                    </TableCell>
                    <TableCell>
                      {officeType.parentOfficeTypeId
                        ? (officeTypeNameById.get(officeType.parentOfficeTypeId) ??
                          officeType.parentOfficeTypeId)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={officeType.isActive ? "Active" : "Inactive"}
                        color={officeType.isActive ? "success" : "default"}
                        variant={officeType.isActive ? "filled" : "outlined"}
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
