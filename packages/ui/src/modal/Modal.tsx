import Backdrop from "@mui/material/Backdrop";
import Box from "@mui/material/Box";
import Fade from "@mui/material/Fade";
import MuiModal from "@mui/material/Modal";
import { alpha, useTheme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { pinePaletteDark, pinePaletteLight } from "../theme/color";
import { pineMotion } from "../theme/motion";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

const enterMs = pineMotion.duration.medium4;
const exitMs = pineMotion.duration.medium2;
const enterEasing = pineMotion.easing.emphasizedDecelerate;
const exitEasing = pineMotion.easing.emphasizedAccelerate;

const dialogCornerRadius = "28px";
const dialogMinWidth = 280;
const dialogMaxWidth = 560;

export const Modal = ({ children, open, onClose }: ModalProps) => {
  const theme = useTheme();
  const m3 = theme.palette.mode === "dark" ? pinePaletteDark : pinePaletteLight;

  return (
    <MuiModal
      open={open}
      onClose={() => {
        onClose();
      }}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: { enter: enterMs, exit: exitMs },
          sx: {
            backgroundColor: alpha(m3.scrim, 0.32),
          },
        },
      }}
      sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <Fade
        in={open}
        timeout={{ enter: enterMs, exit: exitMs }}
        easing={{
          enter: enterEasing,
          exit: exitEasing,
        }}
      >
        <Box
          tabIndex={-1}
          sx={{
            outline: "none",
            mx: 2,
            width: "100%",
            maxWidth: dialogMaxWidth,
            minWidth: dialogMinWidth,
          }}
        >
          <Box
            sx={{
              bgcolor: m3.surfaceContainerHigh,
              color: m3.onSurface,
              p: "24px",
              width: "100%",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              borderRadius: dialogCornerRadius,
              boxShadow: "none",
              transform: open ? "scale(1)" : "scale(0.94)",
              transition: `transform ${open ? enterMs : exitMs}ms ${open ? enterEasing : exitEasing}`,
              "@media (prefers-reduced-motion: reduce)": {
                transform: "none",
                transition: "none",
              },
            }}
          >
            {children}
          </Box>
        </Box>
      </Fade>
    </MuiModal>
  );
};

export default Modal;
