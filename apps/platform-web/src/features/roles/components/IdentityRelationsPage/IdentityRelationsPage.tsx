import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
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
import { useGetIdentitiesQuery, useGetIdentityRelationsQuery } from "@generated/gql";
import { Link, useParams } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { getErrorMessage } from "@shared/ui";
import { IdentityRelationsGraph } from "../IdentityRelationsGraph";

export const IdentityRelationsPage = () => {
  const { identityId } = useParams({
    from: "/_authenticated/identities_/$identityId",
  });

  const identitiesQuery = useGetIdentitiesQuery(
    { platformId: PLATFORM_OBJECT_ID },
    {
      select: (data) => data.getIdentities ?? [],
    },
  );

  const relationsQuery = useGetIdentityRelationsQuery(
    { identityId },
    {
      enabled: Boolean(identityId),
      select: (data) => data.getIdentityRelations ?? null,
    },
  );

  const identities = identitiesQuery.data ?? [];
  const displayName =
    identities.find((identity) => identity.id === identityId)?.displayName ?? null;
  const relations = relationsQuery.data;
  const platform = relations?.platform ?? [];
  const tenants = relations?.tenants ?? [];
  const organizations = relations?.organizations ?? [];
  const hasAnyRelation = platform.length > 0 || tenants.length > 0 || organizations.length > 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button component={Link} to="/identities" size="small" sx={{ mb: 2, px: 0 }}>
          ← Back to identities
        </Button>

        <Stack spacing={0.5}>
          <Typography variant="h5" component="h1">
            {displayName?.trim() ? displayName : "Identity relations"}
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ fontFamily: "monospace", fontSize: "0.875rem", wordBreak: "break-all" }}
          >
            {identityId}
          </Typography>
        </Stack>
      </Box>

      {relationsQuery.isPending ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : null}

      {relationsQuery.isError ? (
        <Alert severity="error">
          {getErrorMessage(relationsQuery.error, "Failed to load identity relations")}
        </Alert>
      ) : null}

      {relationsQuery.isSuccess && !hasAnyRelation ? (
        <Alert severity="info">No platform, tenant, or organization relations found.</Alert>
      ) : null}

      {relationsQuery.isSuccess && hasAnyRelation ? (
        <Stack spacing={3}>
          <IdentityRelationsGraph
            identityId={identityId}
            displayName={displayName}
            platform={platform}
            tenants={tenants}
            organizations={organizations}
            height={480}
          />

          <Divider />

          <RelationSection title="Platform" emptyLabel="No platform relations.">
            {platform.length > 0 ? (
              <RelationTable
                columns={["Relation"]}
                rows={platform.map((item) => ({
                  key: item.id ?? `${item.relation}`,
                  cells: [item.relation],
                }))}
              />
            ) : null}
          </RelationSection>

          <RelationSection title="Tenants" emptyLabel="No tenant relations.">
            {tenants.length > 0 ? (
              <RelationTable
                columns={["Tenant ID", "Relation"]}
                rows={tenants.map((item) => ({
                  key: item.id ?? `${item.tenantId}:${item.relation}`,
                  cells: [item.tenantId, item.relation],
                }))}
              />
            ) : null}
          </RelationSection>

          <RelationSection title="Organizations" emptyLabel="No organization relations.">
            {organizations.length > 0 ? (
              <RelationTable
                columns={["Organization ID", "Relation"]}
                rows={organizations.map((item) => ({
                  key: item.id ?? `${item.organizationId}:${item.relation}`,
                  cells: [item.organizationId, item.relation],
                }))}
              />
            ) : null}
          </RelationSection>
        </Stack>
      ) : null}
    </Container>
  );
};

type RelationSectionProps = {
  title: string;
  emptyLabel: string;
  children: ReactNode;
};

const RelationSection = ({ title, emptyLabel, children }: RelationSectionProps) => (
  <Stack spacing={1}>
    <Typography variant="subtitle1">{title}</Typography>
    {children ?? <Typography color="text.secondary">{emptyLabel}</Typography>}
  </Stack>
);

type RelationTableProps = {
  columns: string[];
  rows: Array<{ key: string; cells: Array<string | null | undefined> }>;
};

const RelationTable = ({ columns, rows }: RelationTableProps) => (
  <TableContainer component={Paper} variant="outlined">
    <Table size="small" aria-label="Identity relations">
      <TableHead>
        <TableRow>
          {columns.map((column) => (
            <TableCell key={column}>{column}</TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.key}>
            {row.cells.map((cell, index) => (
              <TableCell
                key={`${row.key}-${columns[index] ?? index}`}
                sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}
              >
                {cell}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);
