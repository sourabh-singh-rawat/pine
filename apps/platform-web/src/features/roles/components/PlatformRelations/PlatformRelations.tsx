import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
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
import { useGetIdentitiesQuery } from "@generated/gql";
import { useNavigate } from "@tanstack/react-router";
import { getErrorMessage } from "@shared/ui";
import { CreatePlatformRelationModal } from "../CreatePlatformRelationModal";

export const PlatformRelations = () => {
  const navigate = useNavigate();

  const identitiesQuery = useGetIdentitiesQuery(
    { platformId: PLATFORM_OBJECT_ID },
    {
      select: (data) => data.getIdentities ?? [],
    },
  );

  const identities = identitiesQuery.data ?? [];

  const openIdentity = (identityId: string) => {
    void navigate({
      to: "/identities/$identityId",
      params: { identityId },
    });
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
            Identities
          </Typography>
          <Typography color="text.secondary">
            Identities on this platform. Open an identity to inspect its platform, tenant, and
            workspace relations.
          </Typography>
        </Box>
        <CreatePlatformRelationModal />
      </Stack>

      {identitiesQuery.isPending ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={32} />
        </Box>
      ) : null}

      {identitiesQuery.isError ? (
        <Alert severity="error">
          {getErrorMessage(identitiesQuery.error, "Failed to load identities")}
        </Alert>
      ) : null}

      {identitiesQuery.isSuccess ? (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label="Identities">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>ID</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {identities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2}>
                    <Typography color="text.secondary">No identities found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                identities.map((identity) => {
                  const identityId = identity.id;
                  const displayName = identity.displayName?.trim();

                  return (
                    <TableRow
                      key={identityId ?? displayName ?? undefined}
                      hover
                      sx={identityId ? { cursor: "pointer" } : undefined}
                      onClick={() => {
                        if (!identityId) {
                          return;
                        }
                        openIdentity(identityId);
                      }}
                    >
                      <TableCell>{displayName || identityId || "—"}</TableCell>
                      <TableCell sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                        {identityId}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
    </Container>
  );
};
