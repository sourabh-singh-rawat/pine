import { styled } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { useLargeScreen } from "../../../hooks/useLargeScreen";

import MuiDivider from "@mui/material/Divider";
import MuiDrawer from "@mui/material/Drawer";
import List from "@mui/material/List";

import { SpaceList } from "@features/space";

const Drawer = styled(MuiDrawer)(({ open, theme }) => {
  const openDrawerWidth = theme.spacing(32);
  const closedDrawerWidth = theme.spacing(8);

  return {
    width: open ? openDrawerWidth : closedDrawerWidth,
    flexShrink: 0,
    [theme.breakpoints.down("sm")]: {
      width: closedDrawerWidth,
    },
    "& .MuiPaper-root": {
      border: "none",
      backgroundColor: theme.palette.background.paper,
      position: "relative",
    },
    "& .MuiDrawer-paper": {
      position: "relative",
      borderRight: `1px solid ${theme.palette.divider}`,
      transition: theme.transitions.create(["width"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      ...(open && {
        width: openDrawerWidth,
        [theme.breakpoints.down("sm")]: {
          boxShadow: theme.shadows[5],
        },
      }),
      ...(!open && {
        width: closedDrawerWidth,
      }),
      overflowX: "hidden",
    },
  };
});

export const Sidebar = () => {
  const isLargeScreen = useLargeScreen();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(isLargeScreen);
  }, [isLargeScreen]);

  return (
    <Drawer open={open} variant="permanent">
      <List disablePadding />
      <MuiDivider />
      <SpaceList />
      <MuiDivider />
    </Drawer>
  );
};
