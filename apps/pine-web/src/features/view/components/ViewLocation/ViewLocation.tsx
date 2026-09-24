import FolderOutlined from "@mui/icons-material/FolderOutlined";
import { Box, Grid2, IconButton } from "@mui/material";
import { CustomBreadcrumbs } from "../CustomBreadcrumbs";

interface LocationProps {
  list: {
    id: string;
    name: string;
  };
}

export const ViewLocation = ({ list }: LocationProps) => {
  return (
    <Box>
      <Grid2 container>
        <Grid2>
          <IconButton>
            <FolderOutlined fontSize="small" />
          </IconButton>
        </Grid2>
        <Grid2 sx={{ alignContent: "center" }}>
          <CustomBreadcrumbs isLoading={false} items={[{ text: list.name, onClick() {} }]} />
        </Grid2>
      </Grid2>
    </Box>
  );
};
