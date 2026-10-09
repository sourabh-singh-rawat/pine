import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ADMIN, ALL_ORGANIZATION_ROLES, MEMBER, OWNER } from "@pine/authorization";
import { useCreateOrganizationRelationMutation, useFindIdentitiesQuery } from "@generated/gql";
import { PrimaryButton, SecondaryButton } from "@pine/ui";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { getErrorMessage, useSnackbar } from "@shared/ui";

const organizationRelations = [OWNER, ADMIN, MEMBER];

const relationLabel = (relation: string): string => {
  const definition = ALL_ORGANIZATION_ROLES.find((role) => role.relation === relation);
  return definition?.name ?? relation;
};

export type CreateOrganizationRelationFormValues = {
  identityId: string;
  relation: string;
};

export type CreateOrganizationRelationFormProps = {
  organizationId: string;
  onSuccess?: (relationId: string | null | undefined) => void;
  onCancel?: () => void;
};

const defaultValues: CreateOrganizationRelationFormValues = {
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

export const CreateOrganizationRelationForm = ({
  organizationId,
  onSuccess,
  onCancel,
}: CreateOrganizationRelationFormProps) => {
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();
  const createOrganizationRelationMutation = useCreateOrganizationRelationMutation();
  const identitiesQuery = useFindIdentitiesQuery(undefined, {
    select: (data) => data.findIdentities ?? [],
  });

  const identities = identitiesQuery.data ?? [];

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        const result = await createOrganizationRelationMutation.mutateAsync({
          input: {
            organizationId,
            identityId: value.identityId.trim(),
            relation: value.relation.trim(),
          },
        });

        await queryClient.invalidateQueries({ queryKey: ["GetOrganizationRelations"] });
        snackbar.success("Organization relation created successfully");
        form.reset();
        onSuccess?.(result.createOrganizationRelation?.id);
      } catch (error) {
        snackbar.error(getErrorMessage(error, "Failed to create organization relation"));
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
                        {id}
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
                  Choose the identity to assign on this organization graph.
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
                  {organizationRelations.map((relation) => (
                    <MenuItem key={relation} value={relation}>
                      {relationLabel(relation)}
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
                loading={isSubmitting || createOrganizationRelationMutation.isPending}
                isDisabled={
                  !canSubmit || isSubmitting || createOrganizationRelationMutation.isPending
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
