import Box from "@mui/material/Box";
import type { ReactNode } from "react";

export interface ModalBodyProps {
  children: ReactNode;
}

export const ModalBody = ({ children }: ModalBodyProps) => {
  return (
    <Box
      sx={{
        flex: "1 1 auto",
        minHeight: 0,
        overflowY: "auto",
        pt: "16px",
        pb: "24px",
      }}
    >
      {children}
    </Box>
  );
};

export default ModalBody;
