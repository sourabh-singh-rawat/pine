import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useCreateOrganizationMemberMutation, useFindIdentitiesQuery } from "@generated/gql";
import { PrimaryButton, SecondaryButton } from "@pine/ui";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { getErrorMessage, useSnackbar } from "@shared/ui";

const organizationMemberRoles = ["owners", "admins", "members"];

export type CreateOrganizationMemberFormValues = {
  identityId: string;
  role: string;
};

export type CreateOrganizationMemberFormProps = {
  organizationId: string;
  onSuccess?: (memberId: string | null | undefined) => void;
  onCancel?: () => void;
};

const defaultValues: CreateOrganizationMemberFormValues = {
  identityId: "",
  role: "members",
};

const requiredString = (value: string, label: string): string | undefined => {
  const trimmed = value.trim();
  if (!trimmed) {
    return `${label} is required`;
  }
  return undefined;
};

export const CreateOrganizationMemberForm = ({
  organizationId,
  onSuccess,
  onCancel,
}: CreateOrganizationMemberFormProps) => {
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();
  const createOrganizationMemberMutation = useCreateOrganizationMemberMutation();
  const identitiesQuery = useFindIdentitiesQuery(undefined, {
    select: (data) => data.findIdentities ?? [],
  });

  const identities = identitiesQuery.data ?? [];

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        const result = await createOrganizationMemberMutation.mutateAsync({
          input: {
            organizationId,
            identityId: value.identityId.trim(),
            role: value.role.trim(),
          },
        });

        await queryClient.invalidateQueries({ queryKey: ["GetOrganizationMembers"] });
        snackbar.success("Organization member added successfully");
        form.reset();
        onSuccess?.(result.createOrganizationMember?.id);
      } catch (error) {
        snackbar.error(getErrorMessage(error, "Failed to add organization member"));
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
                  Choose the identity to add as an organization member.
                </Typography>
              )}
            </Box>
          )}
        </form.Field>

        <form.Field
          name="role"
          validators={{
            onChange: ({ value }) => requiredString(value, "Role"),
          }}
        >
          {(field) => (
            <Box>
              <Typography variant="body2" sx={{ pb: 1, fontWeight: 500 }}>
                Role
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
                  {organizationMemberRoles.map((role) => (
                    <MenuItem key={role} value={role}>
                      {role}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                Choose the role for this organization member.
              </Typography>
            </Box>
          )}
        </form.Field>

        <Stack direction="row-reverse" spacing={1} sx={{ pt: 1, alignItems: "center" }}>
          <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <PrimaryButton
                type="submit"
                label="Add member"
                loading={isSubmitting || createOrganizationMemberMutation.isPending}
                isDisabled={
                  !canSubmit || isSubmitting || createOrganizationMemberMutation.isPending
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
