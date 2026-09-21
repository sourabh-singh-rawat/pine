import { Grid2 } from "@mui/material";
import { useState } from "react";
import { CustomTab } from "../../../../shared/components/CustomTab";
import { CustomTabs } from "../../../../shared/components/CustomTabs";
import { AddItemButton } from "../../../item/components/AddItemButton";

interface ViewProps {
  projectId: string;
}

export const ViewSwitcher = ({ projectId }: ViewProps) => {
  const [selectedTab, setSelectedTab] = useState(0);

  const handleChange = (_e: unknown, newValue: number) => {
    setSelectedTab(newValue);
  };

  return (
    <Grid2 container sx={{ alignItems: "center" }}>
      <Grid2>
        <CustomTabs handleChange={handleChange} value={selectedTab}>
          <CustomTab index={0} label="List" />
          <CustomTab index={1} label="Board" />
        </CustomTabs>
      </Grid2>
      <Grid2 flexGrow={1}></Grid2>
      <Grid2>
        <AddItemButton projectId={projectId} />
      </Grid2>
    </Grid2>
  );
};
