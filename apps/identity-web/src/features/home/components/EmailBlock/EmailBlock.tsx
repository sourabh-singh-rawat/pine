import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import MarkEmailUnreadOutlinedIcon from "@mui/icons-material/MarkEmailUnreadOutlined";
import VerifiedIcon from "@mui/icons-material/Verified";
import { useResendVerificationEmailMutation } from "@generated/api/@tanstack/react-query.gen";
import { getErrorMessage, useSnackbar } from "@shared/ui";

type EmailBlockProps = {
  email: string;
  emailVerified?: boolean;
};

export const EmailBlock = ({ email, emailVerified }: EmailBlockProps) => {
  const isVerified = emailVerified === true;
  const resendVerificationEmailMutation = useResendVerificationEmailMutation();
  const snackbar = useSnackbar();

  const handleVerify = async () => {
    try {
      const result = await resendVerificationEmailMutation.mutateAsync({
        body: { email },
      });
      snackbar.success(
        result.message ??
          "If an account exists for that email, a verification email has been sent.",
      );
    } catch (error) {
      snackbar.error(
        getErrorMessage(
          error,
          "We could not send a verification email right now. Please try again.",
        ),
      );
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 3,
          px: 3,
          py: 2.5,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body1" sx={{ fontWeight: 500 }}>
            Email
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {email}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexShrink: 0 }}>
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
            {isVerified ? (
              <VerifiedIcon color="success" fontSize="small" aria-hidden />
            ) : (
              <MarkEmailUnreadOutlinedIcon color="warning" fontSize="small" aria-hidden />
            )}
            <Typography variant="body2" color={isVerified ? "success.main" : "warning.main"}>
              {isVerified ? "Verified" : "Not verified"}
            </Typography>
          </Stack>
          {!isVerified ? (
            <Button
              variant="outlined"
              size="small"
              disabled={resendVerificationEmailMutation.isPending}
              onClick={() => {
                void handleVerify();
              }}
            >
              {resendVerificationEmailMutation.isPending ? "Sending…" : "Verify"}
            </Button>
          ) : null}
        </Stack>
      </Box>
    </Paper>
  );
};
