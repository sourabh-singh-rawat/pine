import Close from "@mui/icons-material/Close";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { pinePaletteDark, pinePaletteLight } from "../theme/color";

export interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
}

export const ModalHeader = ({ title, subtitle, onClose }: ModalHeaderProps) => {
  const theme = useTheme();
  const m3 = theme.palette.mode === "dark" ? pinePaletteDark : pinePaletteLight;

  return (
    <Box sx={{ flexShrink: 0 }}>
      <Stack spacing="16px">
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
          <Typography
            variant="headlineSmall"
            component="h2"
            sx={{ color: m3.onSurface, pr: 1, textAlign: "start" }}
          >
            {title}
          </Typography>
          <IconButton
            onClick={() => {
              onClose();
            }}
            aria-label="Close"
            size="small"
            sx={{
              width: 40,
              height: 40,
              color: m3.onSurfaceVariant,
              "&:hover": { backgroundColor: theme.palette.action.hover },
            }}
          >
            <Close sx={{ fontSize: 24 }} />
          </IconButton>
        </Stack>
        {subtitle ? (
          <Typography variant="bodyMedium" sx={{ color: m3.onSurfaceVariant, textAlign: "start" }}>
            {subtitle}
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
};

export default ModalHeader;
