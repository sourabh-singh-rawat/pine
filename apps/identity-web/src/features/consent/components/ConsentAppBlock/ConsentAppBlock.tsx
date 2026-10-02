import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { getClientInitials } from "@features/consent/utils";

type ConsentAppBlockProps = {
  clientName: string;
  clientId: string;
  subject?: string;
};

export const ConsentAppBlock = ({ clientName, clientId, subject }: ConsentAppBlockProps) => (
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
      <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, minWidth: 0 }}>
        <Avatar
          alt={clientName}
          sx={{
            width: 56,
            height: 56,
            fontSize: "1.25rem",
            fontWeight: 500,
            bgcolor: "primary.main",
          }}
        >
          {getClientInitials(clientName)}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body1" sx={{ fontWeight: 500 }} noWrap>
            {clientName}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {clientId}
          </Typography>
          {subject ? (
            <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.5 }}>
              Signed in as {subject}
            </Typography>
          ) : null}
        </Box>
      </Box>
    </Box>
  </Paper>
);
