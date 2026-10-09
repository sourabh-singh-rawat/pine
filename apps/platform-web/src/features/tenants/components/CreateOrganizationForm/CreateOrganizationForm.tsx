import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useCreateOrganizationMutation, useGetOrganizationsQuery } from "@generated/gql";
import { PrimaryButton, SecondaryButton, TextField } from "@pine/ui";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { getErrorMessage, useSnackbar } from "@shared/ui";

export type CreateOrganizationFormValues = {
  name: string;
  slug: string;
  description: string;
  parentOrganizationId: string;
};

export type CreateOrganizationFormProps = {
  tenantId: string;
  onSuccess?: (organizationId: string | null | undefined) => void;
  onCancel?: () => void;
};

const defaultValues: CreateOrganizationFormValues = {
  name: "",
  slug: "",
  description: "",
  parentOrganizationId: "",
};

const requiredString = (value: string, label: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) {
    return `${label} is required`;
  }
  return undefined;
};

export const CreateOrganizationForm = ({
  tenantId,
  onSuccess,
  onCancel,
}: CreateOrganizationFormProps) => {
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();
  const createOrganizationMutation = useCreateOrganizationMutation();
  const organizationsQuery = useGetOrganizationsQuery(
    { tenantId },
    {
      select: (data) => data.getOrganizations ?? [],
      enabled: Boolean(tenantId),
    },
  );

  const parentOptions = organizationsQuery.data ?? [];

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        const parentOrganizationId = value.parentOrganizationId.trim();
        const result = await createOrganizationMutation.mutateAsync({
          input: {
            tenantId,
            name: value.name.trim(),
            slug: value.slug.trim(),
            description: value.description.trim() || undefined,
            parentOrganizationId: parentOrganizationId || undefined,
          },
        });

        await queryClient.invalidateQueries({ queryKey: ["GetOrganizations"] });
        snackbar.success("Organization created successfully");
        form.reset();
        onSuccess?.(result.createOrganization?.id);
      } catch (error) {
        snackbar.error(getErrorMessage(error, "Failed to create organization"));
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

        <form.Field name="parentOrganizationId">
          {(field) => (
            <Box>
              <Typography variant="body2" sx={{ pb: 1, fontWeight: 500 }}>
                Parent organization
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
                  disabled={organizationsQuery.isPending}
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
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                Optional. Nest this organization under another organization in this tenant.
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
                loading={isSubmitting || createOrganizationMutation.isPending}
                isDisabled={!canSubmit || isSubmitting || createOrganizationMutation.isPending}
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
