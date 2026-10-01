import Container from "@mui/material/Container";
import type { ReactNode } from "react";

export const ConsentCardShell = ({ children }: { children: ReactNode }) => (
  <Container maxWidth="md" sx={{ py: 6 }}>
    {children}
  </Container>
);
