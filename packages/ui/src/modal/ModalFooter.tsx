import Stack from "@mui/material/Stack";
import type { ReactNode } from "react";

export interface ModalFooterProps {
  children: ReactNode;
}

export const ModalFooter = ({ children }: ModalFooterProps) => {
  return (
    <Stack
      direction="row"
      spacing="8px"
      justifyContent="flex-end"
      alignItems="center"
      sx={{ flexShrink: 0 }}
    >
      {children}
    </Stack>
  );
};

export default ModalFooter;
