import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { Fragment } from "react";

type ConsentScopeItem = {
  scope: string;
  title: string;
  description: string;
};

type ConsentScopeListProps = {
  scopes: ConsentScopeItem[];
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
    {scopes.map((scopeItem, index) => (
      <Fragment key={scopeItem.scope}>
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
              {scopeItem.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {scopeItem.description}
            </Typography>
          </Box>
        </Box>
      </Fragment>
    ))}
  </Paper>
);
