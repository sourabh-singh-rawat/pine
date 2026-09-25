import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useCreateWorkspaceMutation, useGetWorkspacesQuery } from "@generated/gql";
import { PrimaryButton, SecondaryButton, TextField } from "@pine/ui";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { getErrorMessage, useSnackbar } from "@shared/ui";

export type CreateWorkspaceFormValues = {
  name: string;
  slug: string;
  description: string;
  parentWorkspaceId: string;
};

export type CreateWorkspaceFormProps = {
  tenantId: string;
  onSuccess?: (workspaceId: string | null | undefined) => void;
  onCancel?: () => void;
};

const defaultValues: CreateWorkspaceFormValues = {
  name: "",
  slug: "",
  description: "",
  parentWorkspaceId: "",
};

const requiredString = (value: string, label: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) {
    return `${label} is required`;
  }
  return undefined;
};

export const CreateWorkspaceForm = ({
  tenantId,
  onSuccess,
  onCancel,
}: CreateWorkspaceFormProps) => {
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();
  const createWorkspaceMutation = useCreateWorkspaceMutation();
  const workspacesQuery = useGetWorkspacesQuery(
    { tenantId },
    {
      select: (data) => data.getWorkspaces ?? [],
      enabled: Boolean(tenantId),
    },
  );

  const parentOptions = workspacesQuery.data ?? [];

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        const parentWorkspaceId = value.parentWorkspaceId.trim();
        const result = await createWorkspaceMutation.mutateAsync({
          input: {
            tenantId,
            name: value.name.trim(),
            slug: value.slug.trim(),
            description: value.description.trim() || undefined,
            parentWorkspaceId: parentWorkspaceId || undefined,
          },
        });

        await queryClient.invalidateQueries({ queryKey: ["GetWorkspaces"] });
        snackbar.success("Workspace created successfully");
        form.reset();
        onSuccess?.(result.createWorkspace?.id);
      } catch (error) {
        snackbar.error(getErrorMessage(error, "Failed to create workspace"));
      }
    },
  });

  return (
    <Box
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void form.handleSubmit();
      }}
    >
      <Stack spacing={2}>
        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) => requiredString(value, "Name"),
          }}
        >
          {(field) => (
            <TextField field={field} label="Name" placeholder="e.g. Engineering" autoFocus />
          )}
        </form.Field>

        <form.Field
          name="slug"
          validators={{
            onChange: ({ value }) => {
              const missing = requiredString(value, "Slug");
              if (missing) {
                return missing;
              }
              if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.trim())) {
                return "Use lowercase letters, numbers, and hyphens";
              }
              return undefined;
            },
          }}
        >
          {(field) => (
            <TextField
              field={field}
              label="Slug"
              placeholder="e.g. engineering"
              description="URL-safe identifier unique within this tenant."
            />
          )}
        </form.Field>

        <form.Field name="parentWorkspaceId">
          {(field) => (
            <Box>
              <Typography variant="body2" sx={{ pb: 1, fontWeight: 500 }}>
                Parent workspace
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  displayEmpty
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    field.handleChange(event.target.value);
                  }}
                  disabled={workspacesQuery.isPending}
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {parentOptions.map((workspace) => {
                    const id = workspace.id;
                    if (!id) {
                      return null;
                    }
                    return (
                      <MenuItem key={id} value={id}>
                        {workspace.name ?? workspace.slug ?? id}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                Optional. Nest this workspace under another workspace in this tenant.
              </Typography>
            </Box>
          )}
        </form.Field>

        <form.Field name="description">
          {(field) => (
            <TextField
              field={field}
              label="Description"
              placeholder="Optional short description"
              rows={3}
            />
          )}
        </form.Field>

        <Stack direction="row-reverse" spacing={1} sx={{ pt: 1, alignItems: "center" }}>
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
            {([canSubmit, isSubmitting]) => (
              <PrimaryButton
                type="submit"
                label="Create"
                loading={isSubmitting || createWorkspaceMutation.isPending}
                isDisabled={!canSubmit || isSubmitting || createWorkspaceMutation.isPending}
              />
            )}
          </form.Subscribe>
          {onCancel ? (
            <SecondaryButton
              type="button"
              label="Cancel"
              onClick={() => {
                onCancel();
              }}
            />
          ) : null}
        </Stack>
      </Stack>
    </Box>
  );
};
