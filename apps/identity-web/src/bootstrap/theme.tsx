import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { md3FontFamily, md3Space, md3TypeRoles, pineShape } from "@pine/ui";
import { SnackbarProvider } from "notistack";
import type { PropsWithChildren } from "react";
import { SnackbarContent } from "@shared/ui/snackbar";

/** Served from `apps/identity-web/public/noto-sans-regular.ttf`. */
const NOTO_SANS_URL = "/noto-sans-regular.ttf";

const APP_FONT_SIZE = "14px";

const theme = createTheme({
  spacing: 8,
  md3: {
    space: md3Space,
  },
  palette: {
    mode: "light",
    background: {
      default: "#ffffff",
      paper: "#ffffff",
    },
    text: {
      primary: "#1a1a1a",
      secondary: "#65676e",
    },
    divider: "#c9cace",
    grey: {
      400: "#c9cace",
      500: "#8c8c94",
      600: "#5c5c66",
      700: "#8b8b96",
    },
  },
  shape: {
    borderRadius: 4,
    ...pineShape,
  },
  typography: {
    fontFamily: md3FontFamily,
    // MUI rem scale base (px number). App UI text is locked to 14px below.
    fontSize: 14,
    htmlFontSize: 16,
    body1: { fontSize: APP_FONT_SIZE },
    body2: { fontSize: APP_FONT_SIZE },
    button: { fontSize: APP_FONT_SIZE },
    subtitle1: { fontSize: APP_FONT_SIZE },
    subtitle2: { fontSize: APP_FONT_SIZE },
    ...md3TypeRoles,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          fontSize: APP_FONT_SIZE,
        },
        body: {
          fontSize: APP_FONT_SIZE,
        },
      },
    },
    // Keep native input type metrics stable (incl. browser autofill + size="small").
    MuiInputBase: {
      styleOverrides: {
        root: {
          fontSize: APP_FONT_SIZE,
        },
        input: ({ theme: t }) => ({
          fontSize: APP_FONT_SIZE,
          fontFamily: "inherit",
          lineHeight: 1.5,
          // Chrome/Safari autofill replaces MUI styles until the field is focused.
          "&:-webkit-autofill": {
            WebkitBoxShadow: `0 0 0 1000px ${t.palette.background.paper} inset`,
            WebkitTextFillColor: t.palette.text.primary,
            caretColor: t.palette.text.primary,
            fontSize: APP_FONT_SIZE,
            fontFamily: "inherit",
            lineHeight: 1.5,
            // Prevent autofill from flashing its default background on paint.
            transition: "background-color 99999s ease-in-out 0s",
          },
          "&:-webkit-autofill:hover": {
            WebkitBoxShadow: `0 0 0 1000px ${t.palette.background.paper} inset`,
            WebkitTextFillColor: t.palette.text.primary,
            fontSize: APP_FONT_SIZE,
            fontFamily: "inherit",
          },
          "&:-webkit-autofill:focus": {
            WebkitBoxShadow: `0 0 0 1000px ${t.palette.background.paper} inset`,
            WebkitTextFillColor: t.palette.text.primary,
            fontSize: APP_FONT_SIZE,
            fontFamily: "inherit",
          },
          "&:-webkit-autofill:active": {
            WebkitBoxShadow: `0 0 0 1000px ${t.palette.background.paper} inset`,
            WebkitTextFillColor: t.palette.text.primary,
            fontSize: APP_FONT_SIZE,
            fontFamily: "inherit",
          },
        }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          fontSize: APP_FONT_SIZE,
        },
        input: {
          fontSize: APP_FONT_SIZE,
        },
      },
    },
    MuiInput: {
      styleOverrides: {
        root: {
          fontSize: APP_FONT_SIZE,
        },
        input: {
          fontSize: APP_FONT_SIZE,
        },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          fontSize: APP_FONT_SIZE,
        },
        input: {
          fontSize: APP_FONT_SIZE,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: APP_FONT_SIZE,
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          fontSize: APP_FONT_SIZE,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: APP_FONT_SIZE,
        },
      },
    },
  },
});

export const AppThemeProvider = ({ children }: Readonly<PropsWithChildren>) => (
  <ThemeProvider theme={theme}>
    <GlobalStyles
      styles={{
        "@font-face": {
          fontFamily: "Noto Sans",
          fontStyle: "normal",
          fontDisplay: "swap",
          fontWeight: 400,
          src: `url(${NOTO_SANS_URL}) format("truetype")`,
        },
      }}
    />
    <CssBaseline />
    <SnackbarProvider
      Components={{
        success: SnackbarContent,
        error: SnackbarContent,
        warning: SnackbarContent,
        info: SnackbarContent,
        default: SnackbarContent,
      }}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      maxSnack={4}
      autoHideDuration={4000}
      dense
      preventDuplicate
    >
      {children}
    </SnackbarProvider>
  </ThemeProvider>
);
