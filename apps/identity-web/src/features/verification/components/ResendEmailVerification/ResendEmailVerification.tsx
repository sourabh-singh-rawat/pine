import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useResendVerificationEmailMutation } from "@generated/api/@tanstack/react-query.gen";
import { useForm } from "@tanstack/react-form";
import { Form, FormItem, TextInput, useSnackbar } from "@shared/ui";

export const ResendEmailVerification = () => {
  const resendVerificationEmailMutation = useResendVerificationEmailMutation();
  const snackbar = useSnackbar();

  const form = useForm({
    defaultValues: {
      email: "",
    },
    onSubmit: async ({ value }) => {
      try {
        const result = await resendVerificationEmailMutation.mutateAsync({
          body: { email: value.email },
        });
        snackbar.success(
          result.data.message ??
            "If an account exists for that email, a verification email has been sent.",
        );
      } catch {
        snackbar.error("We could not send a verification email right now. Please try again.");
      }
    },
  });

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" component="h1" gutterBottom>
            Resend verification email
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter your email and we will send a new verification link if an account exists for that
            address.
          </Typography>
        </Box>

        <Form form={form}>
          <Grid container spacing={2}>
            <Grid size={12}>
              <FormItem name="email">
                <TextInput label="Email" autoComplete="email" type="email" />
              </FormItem>
            </Grid>
            <Grid size={12}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={resendVerificationEmailMutation.isPending}
              >
                {resendVerificationEmailMutation.isPending
                  ? "Sending…"
                  : "Resend verification email"}
              </Button>
            </Grid>
          </Grid>
        </Form>
      </Stack>
    </Container>
  );
};
