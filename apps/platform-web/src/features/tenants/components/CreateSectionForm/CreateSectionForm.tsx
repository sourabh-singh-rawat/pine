import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { useCreateSectionMutation } from "@generated/gql";
import { PrimaryButton, SecondaryButton, TextField } from "@pine/ui";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { getErrorMessage, useSnackbar } from "@shared/ui";

export type CreateSectionFormValues = {
  name: string;
  slug: string;
  description: string;
};

export type CreateSectionFormProps = {
  tenantId: string;
  organizationId: string;
  onSuccess?: (sectionId: string | null | undefined) => void;
  onCancel?: () => void;
};

const defaultValues: CreateSectionFormValues = {
  name: "",
  slug: "",
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

export const CreateSectionForm = ({
  tenantId,
  organizationId,
  onSuccess,
  onCancel,
}: CreateSectionFormProps) => {
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();
  const createSectionMutation = useCreateSectionMutation();

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        const result = await createSectionMutation.mutateAsync({
          input: {
            tenantId,
            organizationId,
            name: value.name.trim(),
            slug: value.slug.trim(),
            description: value.description.trim() || undefined,
            isActive: true,
          },
        });

        await queryClient.invalidateQueries({ queryKey: ["GetSections"] });
        snackbar.success("Section created");
        form.reset();
        onSuccess?.(result.createSection?.id);
      } catch (error) {
        snackbar.error(getErrorMessage(error, "Failed to create section"));
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
            <TextField field={field} label="Name" placeholder="e.g. Property" autoFocus />
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
              placeholder="e.g. property"
              description="URL-safe identifier unique within this organization."
            />
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
                loading={state.isSubmitting || createSectionMutation.isPending}
                isDisabled={
                  !state.canSubmit || state.isSubmitting || createSectionMutation.isPending
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
