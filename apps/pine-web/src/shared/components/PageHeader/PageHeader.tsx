import React from "react";
import MuiGrid from "@mui/material/Grid";
import MuiTypography from "@mui/material/Typography";
import PrimaryButton from "../buttons/PrimaryButton";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "@tanstack/react-router";

interface Props {
  title: string;
  showButton?: React.ReactNode;
}

export default function PageHeader({ title, showButton = true }: Props) {
  const navigate = useNavigate();

  return (
    <MuiGrid container>
      <MuiGrid item flexGrow={1}>
        <MuiTypography variant="h4" fontWeight="bold">
          {title}
        </MuiTypography>
      </MuiGrid>

      {showButton && (
        <MuiGrid item>
          <PrimaryButton
            label="Create List"
            type="button"
            startIcon={<AddIcon />}
            onClick={() => navigate({ to: "./new" as "/me" })}
          />
        </MuiGrid>
      )}
    </MuiGrid>
  );
}
