import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useCreateTenantMemberMutation, useFindIdentitiesQuery } from "@generated/gql";
import { PrimaryButton, SecondaryButton } from "@pine/ui";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { getErrorMessage, useSnackbar } from "@shared/ui";

const tenantMemberRoles = ["owners", "admins", "members"];

export type CreateTenantMemberFormValues = {
  identityId: string;
  role: string;
};

export type CreateTenantMemberFormProps = {
  tenantId: string;
  onSuccess?: (memberId: string | null | undefined) => void;
  onCancel?: () => void;
};

const defaultValues: CreateTenantMemberFormValues = {
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

export const CreateTenantMemberForm = ({
  tenantId,
  onSuccess,
  onCancel,
}: CreateTenantMemberFormProps) => {
  const snackbar = useSnackbar();
  const queryClient = useQueryClient();
  const createTenantMemberMutation = useCreateTenantMemberMutation();
  const identitiesQuery = useFindIdentitiesQuery(undefined, {
    select: (data) => data.findIdentities ?? [],
  });

  const identities = identitiesQuery.data ?? [];

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        const result = await createTenantMemberMutation.mutateAsync({
          input: {
            tenantId,
            identityId: value.identityId.trim(),
            role: value.role.trim(),
          },
        });

        await queryClient.invalidateQueries({ queryKey: ["GetTenantMembers"] });
        snackbar.success("Tenant member added successfully");
        form.reset();
        onSuccess?.(result.createTenantMember?.id);
      } catch (error) {
        snackbar.error(getErrorMessage(error, "Failed to add tenant member"));
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
                  Choose the identity to add as a tenant member.
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
                  {tenantMemberRoles.map((role) => (
                    <MenuItem key={role} value={role}>
                      {role}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                Choose the role for this tenant member.
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
                loading={isSubmitting || createTenantMemberMutation.isPending}
                isDisabled={!canSubmit || isSubmitting || createTenantMemberMutation.isPending}
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
