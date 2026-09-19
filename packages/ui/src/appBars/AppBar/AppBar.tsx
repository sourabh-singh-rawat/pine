import {
  AppBar as MuiAppBar,
  type AppBarProps as MuiAppBarProps,
  Box,
  Stack,
  Toolbar,
  Typography,
  useTheme,
} from "@mui/material";
import type { ReactNode } from "react";
import { md3TypeRoles } from "../../theme";

export type AppBarSize = "small";

export type AppBarProps = {
  size?: AppBarSize;
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  align?: "start" | "center";
  sx?: MuiAppBarProps["sx"];
  className?: string;
};

const TOOLBAR_MIN_HEIGHT_PX = 64;
const LEADING_EDGE_PADDING_PX = 4;
const TITLE_INSET_PX = 16;
const TRAILING_GAP_PX = 8;

export const AppBar = ({
  size = "small",
  title,
  subtitle,
  leading,
  trailing,
  align = "start",
  sx,
  className,
}: AppBarProps) => {
  const theme = useTheme();

  const hasSubtitle = subtitle != null && subtitle !== "";
  const isPlainTitle = typeof title === "string" || typeof title === "number";

  const titleContent = isPlainTitle ? (
    <Typography
      component="h1"
      variant="titleLarge"
      color="text.primary"
      sx={{
        ...md3TypeRoles.titleLarge,
        lineHeight: 1.5,
        pt: "0.15em",
        pb: "0.1em",
        width: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {title}
    </Typography>
  ) : (
    <Box sx={{ width: "100%", minWidth: 0 }}>{title}</Box>
  );

  const titleBlock = (
    <Stack
      sx={{
        minWidth: 0,
        flex: 1,
        overflow: "visible",
        alignItems: align === "center" ? "center" : "flex-start",
        textAlign: align === "center" ? "center" : "start",
      }}
    >
      {titleContent}
      {hasSubtitle ? (
        <Typography
          component="p"
          variant="labelMedium"
          color="text.secondary"
          sx={{
            ...md3TypeRoles.labelMedium,
            lineHeight: 1.5,
            pt: "0.1em",
            pb: "0.05em",
            width: "100%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            mt: 0.25,
          }}
        >
          {subtitle}
        </Typography>
      ) : null}
    </Stack>
  );

  return (
    <MuiAppBar
      position="static"
      color="transparent"
      elevation={0}
      className={className}
      data-size={size}
      sx={{
        bgcolor: "transparent",
        color: "inherit",
        boxShadow: "none",
        borderRadius: 0,
        backgroundImage: "none",
        overflow: "visible",
        ...sx,
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          minHeight: TOOLBAR_MIN_HEIGHT_PX,
          py: hasSubtitle ? 1 : 0,
          pl: leading ? `${LEADING_EDGE_PADDING_PX}px` : `${TITLE_INSET_PX}px`,
          pr: trailing ? `${LEADING_EDGE_PADDING_PX}px` : `${TITLE_INSET_PX}px`,
          gap: 0,
          alignItems: "center",
          width: "100%",
          overflow: "visible",
        }}
      >
        {leading ? (
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              "& .MuiIconButton-root": {
                width: 48,
                height: 48,
                padding: theme.spacing(1.5),
                "& .MuiSvgIcon-root": {
                  fontSize: 24,
                },
              },
            }}
          >
            {leading}
          </Box>
        ) : null}

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: align === "center" ? "center" : "flex-start",
            pl: leading ? `${TITLE_INSET_PX}px` : 0,
            pr: trailing ? `${TITLE_INSET_PX}px` : 0,
            overflow: "visible",
          }}
        >
          {titleBlock}
        </Box>

        {trailing ? (
          <Stack
            direction="row"
            sx={{
              flexShrink: 0,
              alignItems: "center",
              gap: `${TRAILING_GAP_PX}px`,
            }}
          >
            {trailing}
          </Stack>
        ) : null}
      </Toolbar>
    </MuiAppBar>
  );
};
