import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { Fragment } from "react";
import { formatConsentScope } from "@features/consent/utils";

type ConsentScopeListProps = {
  scopes: string[];
};

export const ConsentScopeList = ({ scopes }: ConsentScopeListProps) => (
  <Paper
    variant="outlined"
    sx={{
      borderRadius: 3,
      overflow: "hidden",
    }}
  >
    <Box sx={{ px: 3, pt: 2.5, pb: 1.5 }}>
      <Typography variant="body1" sx={{ fontWeight: 500 }}>
        Permissions
      </Typography>
      <Typography variant="body2" color="text.secondary">
        This app will be able to
      </Typography>
    </Box>
    {scopes.map((scope, index) => {
      const copy = formatConsentScope(scope);
      return (
        <Fragment key={scope}>
          {index > 0 ? <Divider /> : null}
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 3,
              px: 3,
              py: 2.5,
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {copy.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {copy.description}
              </Typography>
            </Box>
          </Box>
        </Fragment>
      );
    })}
  </Paper>
);
