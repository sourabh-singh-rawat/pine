import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PLATFORM_OBJECT_ID } from "@pine/authorization";
import { useCreatePlatformRelationMutation, useGetIdentitiesQuery } from "@generated/gql";
import { PrimaryButton, SecondaryButton } from "@pine/ui";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { getErrorMessage, useSnackbar } from "@shared/ui";

const platformRelations = ["owners", "admins", "members"];

export type CreatePlatformRelationFormValues = {
  identityId: string;
  relation: string;
};

export type CreatePlatformRelationFormProps = {
  onSuccess?: (relationId: string | null | undefined) => void;
  onCancel?: () => void;
};

const defaultValues: CreatePlatformRelationFormValues = {
  identityId: "",
  relation: "",
};

const requiredString = (value: string, label: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) {
    return `${label} is required`;
  }
  return undefined;
};

export const CreatePlatformRelationForm = ({
  onSuccess,
  onCancel,
}: CreatePlatformRelationFormProps) => {
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();
  const createPlatformRelationMutation = useCreatePlatformRelationMutation();
  const identitiesQuery = useGetIdentitiesQuery(
    { platformId: PLATFORM_OBJECT_ID },
    {
      select: (data) => data.getIdentities ?? [],
    },
  );

  const identities = identitiesQuery.data ?? [];

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        const result = await createPlatformRelationMutation.mutateAsync({
          input: {
            identityId: value.identityId.trim(),
            relation: value.relation.trim(),
          },
        });

        await queryClient.invalidateQueries({ queryKey: ["GetPlatformRelations"] });
        snackbar.success("Platform relation created successfully");
        form.reset();
        onSuccess?.(result.createPlatformRelation?.id);
      } catch (error) {
        snackbar.error(getErrorMessage(error, "Failed to create platform relation"));
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
          name="identityId"
          validators={{
            onChange: ({ value }) => requiredString(value, "Identity"),
          }}
        >
          {(field) => (
            <Box>
              <Typography variant="body2" sx={{ pb: 1, fontWeight: 500 }}>
                Identity
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  displayEmpty
                  autoFocus
                  onBlur={field.handleBlur}
                  onChange={(event) => {
                    field.handleChange(event.target.value);
                  }}
                  disabled={identitiesQuery.isPending}
                >
                  <MenuItem value="">
                    <em>Select an identity</em>
                  </MenuItem>
                  {identities.map((identity) => {
                    const id = identity.id;
                    if (!id) {
                      return null;
                    }
                    return (
                      <MenuItem key={id} value={id}>
                        {identity.displayName ?? id}
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
              {identitiesQuery.isError ? (
                <Typography variant="body1" color="error" sx={{ mt: 1 }}>
                  {getErrorMessage(identitiesQuery.error, "Failed to load identities")}
                </Typography>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                  Choose the identity to assign on the platform graph.
                </Typography>
              )}
            </Box>
          )}
        </form.Field>

        <form.Field
          name="relation"
          validators={{
            onChange: ({ value }) => requiredString(value, "Relation"),
          }}
        >
          {(field) => (
            <Box>
              <Typography variant="body2" sx={{ pb: 1, fontWeight: 500 }}>
                Relation
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
                >
                  <MenuItem value="">
                    <em>Select a relation</em>
                  </MenuItem>
                  {platformRelations.map((relation) => (
                    <MenuItem key={relation} value={relation}>
                      {relation}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                Choose the graph relation for this identity.
              </Typography>
            </Box>
          )}
        </form.Field>

        <Stack direction="row-reverse" spacing={1} sx={{ pt: 1, alignItems: "center" }}>
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <PrimaryButton
                type="submit"
                label="Create"
                loading={isSubmitting || createPlatformRelationMutation.isPending}
                isDisabled={!canSubmit || isSubmitting || createPlatformRelationMutation.isPending}
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
