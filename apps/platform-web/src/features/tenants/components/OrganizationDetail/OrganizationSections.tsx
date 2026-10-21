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
import { useGetSectionsQuery } from "@generated/gql";
import { getErrorMessage } from "@shared/ui";
import { CreateSectionModal } from "../CreateSectionModal";

type OrganizationSectionsProps = {
  tenantId: string;
  organizationId: string;
};

export const OrganizationSections = ({ tenantId, organizationId }: OrganizationSectionsProps) => {
  const sectionsQuery = useGetSectionsQuery(
    { organizationId },
    {
      select: (data) => data.getSections ?? [],
      enabled: Boolean(organizationId),
    },
  );

  const sections = sectionsQuery.data ?? [];

  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: "center", justifyContent: "space-between" }}
      >
        <Typography color="text.secondary">
          Sections are work units in this organization. Posts will link a section and designation
          later.
        </Typography>
        <CreateSectionModal tenantId={tenantId} organizationId={organizationId} />
      </Stack>

      {sectionsQuery.isPending ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={32} />
        </Box>
      ) : null}

      {sectionsQuery.isError ? (
        <Alert severity="error">
          {getErrorMessage(sectionsQuery.error, "Failed to load sections")}
        </Alert>
      ) : null}

      {sectionsQuery.isSuccess ? (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label="Sections">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Slug</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography color="text.secondary">No sections yet.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sections.map((section) => (
                  <TableRow key={section.id ?? section.slug ?? undefined}>
                    <TableCell>{section.name ?? "—"}</TableCell>
                    <TableCell sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                      {section.slug ?? "—"}
                    </TableCell>
                    <TableCell>{section.description ?? "—"}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={section.isActive ? "Active" : "Inactive"}
                        color={section.isActive ? "success" : "default"}
                        variant={section.isActive ? "filled" : "outlined"}
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
