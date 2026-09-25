import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useGetCurrentUserQuery } from "@generated/api/@tanstack/react-query.gen";
import { LocationBreadcrumbs } from "../LocationBreadcrumbs";
import { NameBlock } from "../NameBlock";
import { isMeProfile } from "@features/home/utils";
import { Link } from "@tanstack/react-router";

export const Name = () => {
  const currentUserQuery = useGetCurrentUserQuery();
  const identity = currentUserQuery.data?.identity;
  const rawProfile = currentUserQuery.data?.profile;
  const profile = isMeProfile(rawProfile) ? rawProfile : null;

  if (currentUserQuery.isPending) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Typography color="text.secondary">Loading session…</Typography>
      </Container>
    );
  }

  if (!identity) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Stack spacing={2}>
          <LocationBreadcrumbs items={[{ label: "Personal info", to: "/" }, { label: "Name" }]} />
          <Typography variant="h5" component="h1">
            Name
          </Typography>
          <Typography color="text.secondary">
            Sign in to view your name.{" "}
            <Link to="/signin" search={{ login_challenge: undefined }}>
              Go to sign in
            </Link>
          </Typography>
        </Stack>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Stack spacing={1}>
          <LocationBreadcrumbs items={[{ label: "Personal info", to: "/" }, { label: "Name" }]} />
          <Typography variant="h5" component="h1">
            Name
          </Typography>
          <Typography color="text.secondary">
            No profile yet. <Link to="/">Create your profile</Link>
          </Typography>
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack spacing={4}>
        <Box>
          <LocationBreadcrumbs items={[{ label: "Personal info", to: "/" }, { label: "Name" }]} />
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 400, mt: 1 }}>
            Name
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Changes to your name will appear on your account.
          </Typography>
        </Box>

        <NameBlock fullName={profile.fullName} to="/name/edit" />
      </Stack>
    </Container>
  );
};
