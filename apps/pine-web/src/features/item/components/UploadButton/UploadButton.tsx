import { Button, Input, styled, Typography } from "@mui/material";
import { useRef } from "react";

const VisuallyHiddenInput = styled(Input)({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

interface UploadButtonProps {
  label: string | React.ReactElement;
  onChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
}

export const UploadButton = ({ label, onChange }: UploadButtonProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Button component="label" variant="contained" tabIndex={-1} sx={{ textTransform: "none" }}>
      <Typography>{label}</Typography>
      <VisuallyHiddenInput type="file" inputRef={inputRef} onChange={onChange} />
    </Button>
  );
};
