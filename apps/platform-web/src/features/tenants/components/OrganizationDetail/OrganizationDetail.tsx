import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import {
  useGetOrganizationQuery,
  useGetOrganizationsQuery,
  useUpdateOrganizationMutation,
} from "@generated/gql";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { getErrorMessage, useSnackbar } from "@shared/ui";
import type { SyntheticEvent } from "react";
import { OrganizationRelations } from "./OrganizationRelations";
import { OrganizationRoles } from "./OrganizationRoles";

type OrganizationDetailTab = "overview" | "relations" | "roles";

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

const isOrganizationDetailTab = (value: unknown): value is OrganizationDetailTab =>
  value === "overview" || value === "relations" || value === "roles";

const organizationDetailTabs: ReadonlyArray<{ value: OrganizationDetailTab; label: string }> = [
  { value: "overview", label: "Overview" },
  { value: "relations", label: "Relations" },
  { value: "roles", label: "Roles" },
];

type ParentOrganizationFieldProps = {
  organizationId: string;
  tenantId: string;
  parentOrganizationId: string | null;
};

const ParentOrganizationField = ({
  organizationId,
  tenantId,
  parentOrganizationId,
}: ParentOrganizationFieldProps) => {
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();
  const updateOrganizationMutation = useUpdateOrganizationMutation();
  const organizationsQuery = useGetOrganizationsQuery(
    { tenantId },
    {
      select: (data) => data.getOrganizations ?? [],
      enabled: Boolean(tenantId),
    },
  );

  const parentOptions = (organizationsQuery.data ?? []).filter(
    (organization) => organization.id && organization.id !== organizationId,
  );
  const currentParentOrganizationId = parentOrganizationId ?? "";

  const handleParentChange = async (nextParentOrganizationId: string) => {
    if (nextParentOrganizationId === currentParentOrganizationId) {
      return;
    }

    try {
      await updateOrganizationMutation.mutateAsync({
        id: organizationId,
        input: {
          parentOrganizationId: nextParentOrganizationId || null,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["GetOrganization"] });
      await queryClient.invalidateQueries({ queryKey: ["GetOrganizations"] });
      snackbar.success("Parent organization updated");
    } catch (error) {
      snackbar.error(getErrorMessage(error, "Failed to update parent organization"));
    }
  };

  return (
    <Box>
      <Typography variant="overline" color="text.secondary">
        Parent organization
      </Typography>
      <FormControl fullWidth size="small" sx={{ mt: 0.5 }}>
        <Select
          id="parentOrganizationId"
          name="parentOrganizationId"
          value={currentParentOrganizationId}
          displayEmpty
          onChange={(event) => {
            void handleParentChange(event.target.value);
          }}
          disabled={organizationsQuery.isPending || updateOrganizationMutation.isPending}
        >
          <MenuItem value="">
            <em>None</em>
          </MenuItem>
          {parentOptions.map((organization) => {
            const id = organization.id;
            if (!id) {
              return null;
            }
            return (
              <MenuItem key={id} value={id}>
                {organization.name ?? organization.slug ?? id}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Box>
  );
};

export const OrganizationDetail = () => {
  const { tenantId, organizationId } = useParams({
    from: "/_authenticated/tenants_/$tenantId_/organizations/$organizationId",
  });
  const { tab } = useSearch({
    from: "/_authenticated/tenants_/$tenantId_/organizations/$organizationId",
  });
  const navigate = useNavigate();

  const organizationQuery = useGetOrganizationQuery(
    { id: organizationId },
    {
      select: (data) => data.getOrganization ?? null,
      enabled: Boolean(organizationId),
    },
  );

  const organization = organizationQuery.data;

  const handleTabChange = (_event: SyntheticEvent, value: string) => {
    if (!isOrganizationDetailTab(value)) {
      return;
    }
    void navigate({
      to: "/tenants/$tenantId/organizations/$organizationId",
      params: { tenantId, organizationId },
      search: { tab: value },
      replace: true,
    });
  };

  const handleBack = () => {
    void navigate({
      to: "/tenants/$tenantId",
      params: { tenantId },
      search: { tab: "organizations" },
    });
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button size="small" onClick={handleBack} sx={{ mb: 2, px: 0 }}>
          ← Back to organizations
        </Button>

        {organizationQuery.isPending ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : null}

        {organizationQuery.isError ? (
          <Alert severity="error">
            {getErrorMessage(organizationQuery.error, "Failed to load organization")}
          </Alert>
        ) : null}

        {organizationQuery.isSuccess && !organization ? (
          <Alert severity="warning">Organization not found.</Alert>
        ) : null}

        {organization ? (
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
                {organization.name ?? "Untitled organization"}
              </Typography>
              <Chip
                size="small"
                label={organization.isActive ? "Active" : "Inactive"}
                color={organization.isActive ? "success" : "default"}
                variant={organization.isActive ? "filled" : "outlined"}
                sx={{ alignSelf: "flex-start" }}
              />
            </Stack>
          </Stack>
        ) : null}
      </Box>

      {organizationId ? (
        <Box>
          <Tabs
            value={tab}
            onChange={handleTabChange}
            aria-label="Organization detail sections"
            sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
          >
            {organizationDetailTabs.map((item) => (
              <Tab key={item.value} value={item.value} label={item.label} />
            ))}
          </Tabs>

          {tab === "overview" ? (
            organization ? (
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      ID
                    </Typography>
                    <Typography sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                      {organization.id ?? "—"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Tenant ID
                    </Typography>
                    <Typography sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                      {organization.tenantId ?? "—"}
                    </Typography>
                  </Box>
                  {organization.id && organization.tenantId ? (
                    <ParentOrganizationField
                      key={`${organization.id}:${organization.parentOrganizationId ?? ""}`}
                      organizationId={organization.id}
                      tenantId={organization.tenantId}
                      parentOrganizationId={organization.parentOrganizationId ?? null}
                    />
                  ) : null}
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Slug
                    </Typography>
                    <Typography sx={{ fontFamily: "monospace", fontSize: "0.875rem" }}>
                      {organization.slug ?? "—"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Description
                    </Typography>
                    <Typography>{organization.description ?? "No description."}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Created
                    </Typography>
                    <Typography>{formatDateTime(organization.createdAt)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Updated
                    </Typography>
                    <Typography>{formatDateTime(organization.updatedAt)}</Typography>
                  </Box>
                </Stack>
              </Paper>
            ) : null
          ) : null}

          {tab === "relations" ? <OrganizationRelations organizationId={organizationId} /> : null}

          {tab === "roles" ? <OrganizationRoles organizationId={organizationId} /> : null}
        </Box>
      ) : null}
    </Container>
  );
};
