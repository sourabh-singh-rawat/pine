import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useCreateOrganizationTypeMutation, useGetOrganizationTypesQuery } from "@generated/gql";
import { PrimaryButton, SecondaryButton, TextField } from "@pine/ui";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { getErrorMessage, useSnackbar } from "@shared/ui";

export type CreateOrganizationTypeFormValues = {
  name: string;
  slug: string;
  parentOrganizationTypeId: string;
  description: string;
};

export type CreateOrganizationTypeFormProps = {
  tenantId: string;
  onSuccess?: (organizationTypeId: string | null | undefined) => void;
  onCancel?: () => void;
};

const defaultValues: CreateOrganizationTypeFormValues = {
  name: "",
  slug: "",
  parentOrganizationTypeId: "",
  description: "",
};

const requiredString = (value: string, label: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) {
    return `${label} is required`;
  }
  return undefined;
};

const slugError = (value: string): string | undefined => {
  const missing = requiredString(value, "Slug");
  if (missing) {
    return missing;
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.trim())) {
    return "Use lowercase letters, numbers, and hyphens";
  }
  return undefined;
};

export const CreateOrganizationTypeForm = ({
  tenantId,
  onSuccess,
  onCancel,
}: CreateOrganizationTypeFormProps) => {
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();
  const createOrganizationTypeMutation = useCreateOrganizationTypeMutation();
  const organizationTypesQuery = useGetOrganizationTypesQuery(
    { tenantId },
    {
      select: (data) => data.getOrganizationTypes ?? [],
      enabled: Boolean(tenantId),
    },
  );

  const organizationTypes = organizationTypesQuery.data ?? [];

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        const parentOrganizationTypeId = value.parentOrganizationTypeId.trim();
        const result = await createOrganizationTypeMutation.mutateAsync({
          input: {
            tenantId,
            parentOrganizationTypeId: parentOrganizationTypeId || undefined,
            name: value.name.trim(),
            slug: value.slug.trim(),
            description: value.description.trim() || undefined,
            isActive: true,
          },
        });

        await queryClient.invalidateQueries({ queryKey: ["GetOrganizationTypes"] });
        snackbar.success("Organization type created");
        form.reset();
        onSuccess?.(result.createOrganizationType?.id);
      } catch (error) {
        snackbar.error(getErrorMessage(error, "Failed to create organization type"));
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
            <TextField field={field} label="Name" placeholder="e.g. Zonal office" autoFocus />
          )}
        </form.Field>

        <form.Field
          name="slug"
          validators={{
            onChange: ({ value }) => slugError(value),
          }}
        >
          {(field) => (
            <TextField
              field={field}
              label="Slug"
              placeholder="e.g. zonal-office"
              description="URL-safe identifier unique within this tenant."
            />
          )}
        </form.Field>

        <form.Field name="parentOrganizationTypeId">
          {(field) => (
            <Box>
              <Typography variant="body2" sx={{ pb: 1, fontWeight: 500 }}>
                Parent organization type
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
                  disabled={organizationTypesQuery.isPending}
                >
                  <MenuItem value="">
                    <em>None (root type)</em>
                  </MenuItem>
                  {organizationTypes.map((organizationType) => {
                    const id = organizationType.id;
                    if (!id) {
                      return null;
                    }
                    return (
                      <MenuItem key={id} value={id}>
                        {organizationType.name ?? organizationType.slug ?? id}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                A child organization of this type must sit under an office of the parent type.
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
          <form.Subscribe
            selector={(state) => ({
              canSubmit: state.canSubmit,
              isSubmitting: state.isSubmitting,
            })}
          >
            {(state) => (
              <PrimaryButton
                type="submit"
                label="Create"
                loading={state.isSubmitting || createOrganizationTypeMutation.isPending}
                isDisabled={
                  !state.canSubmit || state.isSubmitting || createOrganizationTypeMutation.isPending
                }
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
