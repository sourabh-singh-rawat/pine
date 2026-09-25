import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
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
import { useGetWorkspaceRelationsQuery } from "@generated/gql";
import { getErrorMessage } from "@shared/ui";
import { CreateWorkspaceRelationModal } from "../CreateWorkspaceRelationModal";

type WorkspaceRelationsProps = {
  workspaceId: string;
};

export const WorkspaceRelations = ({ workspaceId }: WorkspaceRelationsProps) => {
  const relationsQuery = useGetWorkspaceRelationsQuery(
    { workspaceId },
    {
      enabled: Boolean(workspaceId),
      select: (data) => data.getWorkspaceRelations ?? [],
    },
  );

  const relations = relationsQuery.data ?? [];

  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: "center", justifyContent: "space-between" }}
      >
        <Typography color="text.secondary">
          Graph relations for this workspace. Creating an workspace writes the owner relation for
          the creator.
        </Typography>
        <CreateWorkspaceRelationModal workspaceId={workspaceId} />
      </Stack>

      {relationsQuery.isPending ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : null}

      {relationsQuery.isError ? (
        <Alert severity="error">
          {getErrorMessage(relationsQuery.error, "Failed to load workspace relations")}
        </Alert>
      ) : null}

      {relationsQuery.isSuccess && relations.length === 0 ? (
        <Alert severity="info">No relations found for this workspace.</Alert>
      ) : null}

      {relationsQuery.isSuccess && relations.length > 0 ? (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label="Workspace relations">
            <TableHead>
              <TableRow>
                <TableCell>Identity ID</TableCell>
                <TableCell>Relation</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {relations.map((item) => (
                <TableRow key={item.id}>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                    {item.identityId}
                  </TableCell>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                    {item.relation}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
    </Stack>
  );
};
