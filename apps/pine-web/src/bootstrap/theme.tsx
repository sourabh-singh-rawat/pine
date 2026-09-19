import type { PropsWithChildren } from "react";
import { ThemeProvider as EmotionThemeProvider } from "@emotion/react";
import { CssBaseline, type ThemeOptions } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { md3Space, md3TypeRoles, pineShape } from "@pine/ui";
import { SnackbarProvider } from "notistack";

import { SnackbarContent } from "@shared/components/Snackbar";

declare module "@mui/system" {
  interface Shape {
    borderWidthDefault: string;
    borderWidthInput: string;
    borderWidthInputOverlayUnfocused: string;
    borderWidthMarked: string;
    borderWidthSpinner: string;
    borderWidthTag: string;
  }
}

declare module "@mui/material/styles" {
  interface Shape {
    borderWidthDefault: string;
    borderWidthInput: string;
    borderWidthInputOverlayUnfocused: string;
    borderWidthMarked: string;
    borderWidthSpinner: string;
    borderWidthTag: string;
  }
}

type ThemeMode = "dark" | "light";

const mode: ThemeMode = "dark";

const borderWidths = {
  borderWidthDefault: "1px",
  borderWidthInput: "2px",
  borderWidthInputOverlayUnfocused: "1px",
  borderWidthMarked: "3px",
  borderWidthSpinner: "2px",
  borderWidthTag: "2px",
};

const shape = {
  ...pineShape,
  ...borderWidths,
};

const typography: ThemeOptions["typography"] = {
  fontFamily: "inter",
  fontSize: 14,
  h1: { fontWeight: 600, fontSize: "2rem" },
  h2: { fontSize: "2rem" },
  h3: { fontSize: "1.75rem" },
  h4: { fontSize: "1.5rem" },
  h5: { fontSize: "1.25rem" },
  h6: { fontSize: "1rem" },
  body1: { fontSize: "0.875rem" },
  body2: { fontSize: "0.8125rem" },
  ...md3TypeRoles,
};

const lightPalette = {
  primary: {
    main: "#9147ff",
  },
  secondary: {
    main: "#f7f7f8",
  },
  error: {
    main: "#bb1411",
    dark: "#530a09",
    light: "#eb0400",
  },
  success: { main: "#4df498" },
  warning: {
    main: "#7c570e",
    dark: "#372706",
    light: "#9e6900",
  },
  grey: {
    100: "#f7f7f8",
    200: "#e6e6ea",
    300: "#d3d3d9",
    400: "#dedee3",
    500: "#adadb8",
    600: "#53535f",
    700: "#323239",
    800: "#1f1f23",
    900: "#0e0e10",
  },
  text: { primary: "#191919", secondary: "#686868" },
  divider: "#d3d3d9",
  background: { default: "#ffffff", paper: "#f9fafb" },
};

const darkPalette = {
  primary: { main: "#9147ff" },
  text: { primary: "#adbac7", secondary: "#9898a2" },
  background: { default: "#18181b", paper: "#1f1f23" },
  divider: "#444c56",
  success: { main: "#4df498" },
};

const paletteByMode: Record<ThemeMode, typeof lightPalette | typeof darkPalette> = {
  light: lightPalette,
  dark: darkPalette,
};

const theme = createTheme({
  spacing: 8,
  md3: {
    space: md3Space,
  },
  palette: {
    mode,
    ...paletteByMode[mode],
  },
  shape,
  shadows: [
    "none",
    "rgba(0, 0, 0, 0.12) 0px 1px 3px, rgba(0, 0, 0, 0.24) 0px 1px 2px",
    "0 4px 8px rgba(0,0,0,.16), 0 0px 4px rgba(0,0,0,.05)",
    "0 4px 8px rgba(0,0,0,.16), 0 0px 4px rgba(0,0,0,.05)",
    "0 6px 16px rgba(0,0,0,.16), 0 0px 4px rgba(0,0,0,.05)",
    "0 12px 32px rgba(0,0,0,.16), 0 0px 8px rgba(0,0,0,.05)",
    "0 32px 64px rgba(0,0,0,.16), 0 0px 16px rgba(0,0,0,.05)",
    "0 1px 2px rgba(0,0,0,.05), 0 0px 1px rgba(0,0,0,.03)",
    "0 2px 4px rgba(0,0,0,.07), 0 0px 2px rgba(0,0,0,.05)",
    "0 3px 6px rgba(0,0,0,.08), 0 0px 3px rgba(0,0,0,.06)",
    "0 8px 16px rgba(0,0,0,.16), 0 0px 6px rgba(0,0,0,.05)",
    "0 16px 32px rgba(0,0,0,.16), 0 0px 12px rgba(0,0,0,.05)",
    "0 1px 3px rgba(0,0,0,.06), 0 0px 1px rgba(0,0,0,.03)",
    "0 2px 4px rgba(0,0,0,.08), 0 0px 2px rgba(0,0,0,.05)",
    "0 4px 8px rgba(0,0,0,.12), 0 0px 4px rgba(0,0,0,.08)",
    "0 6px 12px rgba(0,0,0,.12), 0 0px 6px rgba(0,0,0,.08)",
    "0 8px 16px rgba(0,0,0,.12), 0 0px 8px rgba(0,0,0,.08)",
    "0 12px 24px rgba(0,0,0,.12), 0 0px 12px rgba(0,0,0,.08)",
    "0 18px 36px rgba(0,0,0,.12), 0 0px 16px rgba(0,0,0,.08)",
    "0 24px 48px rgba(0,0,0,.12), 0 0px 20px rgba(0,0,0,.08)",
    "0 32px 64px rgba(0,0,0,.12), 0 0px 24px rgba(0,0,0,.08)",
    "0 1px 2px rgba(0,0,0,.16), 0 0px 1px rgba(0,0,0,.08)",
    "0 2px 4px rgba(0,0,0,.16), 0 0px 2px rgba(0,0,0,.08)",
    "0 4px 8px rgba(0,0,0,.16), 0 0px 4px rgba(0,0,0,.08)",
    "0 4px 8px rgba(0,0,0,.16), 0 0px 4px rgba(0,0,0,.08)",
  ],
  typography,
  components: {
    MuiMenu: {
      defaultProps: {
        sx: { borderRadius: shape.borderRadiusExtraExtraLarge },
      },
    },
    MuiListItem: {
      defaultProps: {
        disablePadding: true,
        disableGutters: true,
      },
    },
    MuiListItemButton: {
      defaultProps: { disableRipple: true },
    },
    MuiListItemIcon: {
      defaultProps: {
        sx: {
          color: "inherit",
        },
      },
    },
    MuiAlert: {
      defaultProps: {
        sx: { borderRadius: shape.borderRadiusMedium },
      },
    },
  },
});

export const AppThemeProvider = ({ children }: Readonly<PropsWithChildren>) => (
  <EmotionThemeProvider theme={theme}>
    <ThemeProvider theme={theme}>
      <SnackbarProvider
        Components={{ success: SnackbarContent, error: SnackbarContent }}
        iconVariant={{ error: "❌", success: "✅" }}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        maxSnack={4}
        autoHideDuration={2000}
      >
        <CssBaseline />
        {children}
      </SnackbarProvider>
    </ThemeProvider>
  </EmotionThemeProvider>
);
