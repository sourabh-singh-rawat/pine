import Backdrop from "@mui/material/Backdrop";
import Box from "@mui/material/Box";
import Fade from "@mui/material/Fade";
import MuiModal from "@mui/material/Modal";
import { alpha, useTheme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { pinePaletteDark, pinePaletteLight } from "../theme/color";
import { pineMotion } from "../theme/motion";
import { pineShape } from "../theme/shape";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

const enterMs = pineMotion.duration.medium4;
const exitMs = pineMotion.duration.short4;

export const Modal = ({ children, open, onClose }: ModalProps) => {
  const theme = useTheme();
  const m3 = theme.palette.mode === "dark" ? pinePaletteDark : pinePaletteLight;
  const paperRadius =
    theme.shape.borderRadiusExtraLargeIncreased ?? pineShape.borderRadiusExtraLargeIncreased;

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
          enter: pineMotion.easing.emphasizedDecelerate,
          exit: pineMotion.easing.emphasizedAccelerate,
        }}
      >
        <Box
          tabIndex={-1}
          sx={{
            bgcolor: m3.surfaceContainerHigh,
            color: m3.onSurface,
            p: 3,
            minWidth: theme.spacing(35),
            maxWidth: theme.spacing(70),
            width: "100%",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            mx: 2,
            borderRadius: paperRadius,
            boxShadow: "none",
            outline: "none",
            transform: open ? "scale(1)" : "scale(0.94)",
            transition: theme.transitions.create("transform", {
              duration: open ? enterMs : exitMs,
              easing: open
                ? pineMotion.easing.emphasizedDecelerate
                : pineMotion.easing.emphasizedAccelerate,
            }),
            "@media (prefers-reduced-motion: reduce)": {
              transform: "none",
              transition: "none",
            },
          }}
        >
          {children}
        </Box>
      </Fade>
    </MuiModal>
  );
};

export default Modal;
