import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import { useGetTenantQuery } from "@generated/gql";
import { Link, useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { getErrorMessage } from "@shared/ui";
import type { SyntheticEvent } from "react";
import { TenantOrganizations } from "./TenantOrganizations";
import { TenantRelations } from "./TenantRelations";
import { TenantRoles } from "./TenantRoles";

type TenantDetailTab = "overview" | "relations" | "roles" | "organizations";

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

const isTenantDetailTab = (value: unknown): value is TenantDetailTab =>
  value === "overview" || value === "relations" || value === "roles" || value === "organizations";

const tenantDetailTabs: ReadonlyArray<{ value: TenantDetailTab; label: string }> = [
  { value: "overview", label: "Overview" },
  { value: "relations", label: "Relations" },
  { value: "roles", label: "Roles" },
  { value: "organizations", label: "Organizations" },
];

export const TenantDetail = () => {
  const { tenantId } = useParams({ from: "/_authenticated/tenants_/$tenantId" });
  const { tab } = useSearch({ from: "/_authenticated/tenants_/$tenantId" });
  const navigate = useNavigate();

  const tenantQuery = useGetTenantQuery(
    { id: tenantId },
    {
      select: (data) => data.getTenant ?? null,
      enabled: Boolean(tenantId),
    },
  );

  const tenant = tenantQuery.data;

  const handleTabChange = (_event: SyntheticEvent, value: string) => {
    if (!isTenantDetailTab(value)) {
      return;
    }
    void navigate({
      to: "/tenants/$tenantId",
      params: { tenantId },
      search: { tab: value },
      replace: true,
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button component={Link} to="/tenants" size="small" sx={{ mb: 2, px: 0 }}>
          ← Back to tenants
        </Button>

        {tenantQuery.isPending ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : null}

        {tenantQuery.isError ? (
          <Alert severity="error">
            {getErrorMessage(tenantQuery.error, "Failed to load tenant")}
          </Alert>
        ) : null}

        {tenantQuery.isSuccess && !tenant ? (
          <Alert severity="warning">Tenant not found.</Alert>
        ) : null}

        {tenant ? (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ mb: 1, alignItems: { sm: "center" }, justifyContent: "space-between" }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{ alignItems: { sm: "center" } }}
            >
              <Typography variant="h5" component="h1">
                {tenant.name ?? "Untitled tenant"}
              </Typography>
              <Chip
                size="small"
                label={tenant.isActive ? "Active" : "Inactive"}
                color={tenant.isActive ? "success" : "default"}
                variant={tenant.isActive ? "filled" : "outlined"}
                sx={{ alignSelf: "flex-start" }}
              />
            </Stack>
          </Stack>
        ) : null}
      </Box>

      {tenantId ? (
        <Box>
          <Tabs
            value={tab}
            onChange={handleTabChange}
            aria-label="Tenant detail sections"
            sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
          >
            {tenantDetailTabs.map((item) => (
              <Tab key={item.value} value={item.value} label={item.label} />
            ))}
          </Tabs>

          {tab === "overview" ? (
            tenant ? (
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      ID
                    </Typography>
                    <Typography sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                      {tenant.id ?? "—"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Slug
                    </Typography>
                    <Typography sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                      {tenant.slug ?? "—"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Description
                    </Typography>
                    <Typography>{tenant.description ?? "No description."}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Created
                    </Typography>
                    <Typography>{formatDateTime(tenant.createdAt)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Updated
                    </Typography>
                    <Typography>{formatDateTime(tenant.updatedAt)}</Typography>
                  </Box>
                </Stack>
              </Paper>
            ) : null
          ) : null}

          {tab === "relations" ? <TenantRelations tenantId={tenantId} /> : null}

          {tab === "roles" ? <TenantRoles tenantId={tenantId} /> : null}

          {tab === "organizations" ? <TenantOrganizations tenantId={tenantId} /> : null}
        </Box>
      ) : null}
    </Container>
  );
};
