import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useCreateOfficeTypeMutation, useGetOfficeTypesQuery } from "@generated/gql";
import { PrimaryButton, SecondaryButton, TextField } from "@pine/ui";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { getErrorMessage, useSnackbar } from "@shared/ui";

export type CreateOfficeTypeFormValues = {
  name: string;
  slug: string;
  parentOfficeTypeId: string;
  description: string;
};

export type CreateOfficeTypeFormProps = {
  tenantId: string;
  onSuccess?: (officeTypeId: string | null | undefined) => void;
  onCancel?: () => void;
};

const defaultValues: CreateOfficeTypeFormValues = {
  name: "",
  slug: "",
  parentOfficeTypeId: "",
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

export const CreateOfficeTypeForm = ({
  tenantId,
  onSuccess,
  onCancel,
}: CreateOfficeTypeFormProps) => {
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();
  const createOfficeTypeMutation = useCreateOfficeTypeMutation();
  const officeTypesQuery = useGetOfficeTypesQuery(
    { tenantId },
    {
      select: (data) => data.getOfficeTypes ?? [],
      enabled: Boolean(tenantId),
    },
  );

  const officeTypes = officeTypesQuery.data ?? [];

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        const parentOfficeTypeId = value.parentOfficeTypeId.trim();
        const result = await createOfficeTypeMutation.mutateAsync({
          input: {
            tenantId,
            parentOfficeTypeId: parentOfficeTypeId || undefined,
            name: value.name.trim(),
            slug: value.slug.trim(),
            description: value.description.trim() || undefined,
            isActive: true,
          },
        });

        await queryClient.invalidateQueries({ queryKey: ["GetOfficeTypes"] });
        snackbar.success("Office type created");
        form.reset();
        onSuccess?.(result.createOfficeType?.id);
      } catch (error) {
        snackbar.error(getErrorMessage(error, "Failed to create office type"));
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

        <form.Field name="parentOfficeTypeId">
          {(field) => (
            <Box>
              <Typography variant="body2" sx={{ pb: 1, fontWeight: 500 }}>
                Parent office type
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
                  disabled={officeTypesQuery.isPending}
                >
                  <MenuItem value="">
                    <em>None (root type)</em>
                  </MenuItem>
                  {officeTypes.map((officeType) => {
                    const id = officeType.id;
                    if (!id) {
                      return null;
                    }
                    return (
                      <MenuItem key={id} value={id}>
                        {officeType.name ?? officeType.slug ?? id}
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
                loading={state.isSubmitting || createOfficeTypeMutation.isPending}
                isDisabled={
                  !state.canSubmit || state.isSubmitting || createOfficeTypeMutation.isPending
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
