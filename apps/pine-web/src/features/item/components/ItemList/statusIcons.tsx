import CancelOutlined from "@mui/icons-material/CancelOutlined";
import CheckCircleOutline from "@mui/icons-material/CheckCircleOutline";
import CircleOutlined from "@mui/icons-material/CircleOutlined";
import RadioButtonUnchecked from "@mui/icons-material/RadioButtonUnchecked";
import Timelapse from "@mui/icons-material/Timelapse";
import type { SvgIconProps } from "@mui/material/SvgIcon";
import type { ReactElement } from "react";

export const getStatusIcon = (
  statusName: string,
  fontSize: SvgIconProps["fontSize"] = "small",
): ReactElement => {
  switch (statusName) {
    case "To Do":
      return <RadioButtonUnchecked fontSize={fontSize} />;
    case "In Progress":
      return <Timelapse fontSize={fontSize} />;
    case "Done":
      return <CheckCircleOutline fontSize={fontSize} />;
    case "Cancelled":
      return <CancelOutlined fontSize={fontSize} />;
    default:
      return <CircleOutlined fontSize={fontSize} />;
  }
};
