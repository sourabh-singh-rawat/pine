import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { getCurrentUserQueryKey } from "@generated/api/@tanstack/react-query.gen";
import { useUpdateProfileNameMutation } from "@generated/gql/hooks";
import { Form, FormItem, getErrorMessage, TextInput, useSnackbar } from "@shared/ui";

type UpdateNameFormProps = {
  firstName: string;
  middleName?: string | null;
  lastName?: string | null;
};

export const UpdateNameForm = ({ firstName, middleName, lastName }: UpdateNameFormProps) => {
  const snackbar = useSnackbar();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const updateProfileNameMutation = useUpdateProfileNameMutation();

  const form = useForm({
    defaultValues: {
      firstName,
      middleName: middleName ?? "",
      lastName: lastName ?? "",
    },
    onSubmit: async ({ value }) => {
      try {
        await updateProfileNameMutation.mutateAsync({
          input: {
            firstName: value.firstName.trim(),
            middleName: value.middleName.trim() || undefined,
            lastName: value.lastName.trim() || undefined,
          },
        });
        await queryClient.invalidateQueries({ queryKey: getCurrentUserQueryKey() });
        snackbar.success("Name updated.");
        await navigate({ to: "/name" });
      } catch (error) {
        snackbar.error(getErrorMessage(error, "Could not update your name. Please try again."));
      }
    },
  });

  return (
    <Form form={form}>
      <Grid container spacing={2}>
        <Grid size={12}>
          <FormItem name="firstName">
            <TextInput label="First name" autoComplete="given-name" />
          </FormItem>
        </Grid>
        <Grid size={12}>
          <FormItem name="middleName">
            <TextInput label="Middle name" autoComplete="additional-name" />
          </FormItem>
        </Grid>
        <Grid size={12}>
          <FormItem name="lastName">
            <TextInput label="Last name" autoComplete="family-name" />
          </FormItem>
        </Grid>
        <Grid size={12}>
          <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
            <Button
              type="submit"
              variant="contained"
              disabled={updateProfileNameMutation.isPending}
            >
              {updateProfileNameMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </Stack>
        </Grid>
      </Grid>
    </Form>
  );
};
