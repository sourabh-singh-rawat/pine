import { ClickAwayListener } from "@mui/base";
import CloseIcon from "@mui/icons-material/Close";
import DoneIcon from "@mui/icons-material/Done";
import { IconButton, Stack, TextField, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
import { useUpdateItemMutation } from "@generated/gql";
import { md3TypeRoles } from "@pine/ui";
import { useSnackbar } from "@shared";

type ItemNameFormValues = {
  name: string;
};

interface ItemNameProps {
  itemId: string;
  initialValue?: string;
}

export const ItemName = ({ itemId, initialValue = "" }: ItemNameProps) => {
  const theme = useTheme();
  const snackbar = useSnackbar();
  const form = useForm<ItemNameFormValues>({
    defaultValues: { name: initialValue },
  });
  const [defaultValue, setDefaultValue] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const updateItemMutation = useUpdateItemMutation();

  const handleClick = () => {
    setIsFocused(true);
  };

  const handleCancel = () => {
    if (updateItemMutation.isPending) return;

    setIsFocused(false);
    form.setValue("name", defaultValue);
  };

  const onSubmit: SubmitHandler<ItemNameFormValues> = async ({ name }) => {
    if (updateItemMutation.isPending) return;

    try {
      await updateItemMutation.mutateAsync({ input: { itemId, name } });
      snackbar.success("Name updated successfully");
      setDefaultValue(name);
      setIsFocused(false);
    } catch (error) {
      snackbar.error(error instanceof Error ? error.message : "Failed to update name");
    }
  };

  useEffect(() => {
    form.setValue("name", initialValue);
    setDefaultValue(initialValue);
  }, [form, initialValue]);

  return (
    <ClickAwayListener onClickAway={handleCancel}>
      <Stack
        component="form"
        direction="row"
        alignItems="center"
        spacing={0.5}
        onSubmit={form.handleSubmit(onSubmit)}
        sx={{ width: "100%", minWidth: 0 }}
      >
        {isFocused ? (
          <Controller
            name="name"
            control={form.control}
            render={({ field }) => (
              <TextField
                {...field}
                autoFocus
                size="small"
                fullWidth
                variant="outlined"
                sx={{
                  flex: 1,
                  minWidth: 0,
                  "& .MuiInputBase-root": {
                    backgroundColor: "transparent",
                    ...md3TypeRoles.titleLarge,
                    lineHeight: 1.5,
                  },
                  "& .MuiInputBase-input": {
                    px: theme.spacing(1),
                    py: theme.spacing(0.5),
                    ...md3TypeRoles.titleLarge,
                    lineHeight: 1.5,
                  },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: theme.shape.borderRadiusSmall,
                    "& fieldset": { borderColor: "transparent" },
                    "&:hover": {
                      backgroundColor: theme.palette.action.hover,
                      "& fieldset": { borderColor: theme.palette.grey[200] },
                    },
                    "&.Mui-focused": {
                      boxShadow: `${alpha(theme.palette.primary.main, 0.25)} 0 0 0 0.2rem`,
                      "& fieldset": { borderColor: theme.palette.primary.main },
                    },
                  },
                }}
              />
            )}
          />
        ) : (
          <Typography
            component="h1"
            variant="titleLarge"
            onClick={handleClick}
            sx={{
              ...md3TypeRoles.titleLarge,
              lineHeight: 1.5,
              flex: 1,
              minWidth: 0,
              px: theme.spacing(1),
              py: theme.spacing(0.5),
              borderRadius: theme.shape.borderRadiusSmall,
              color: "text.primary",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              cursor: "text",
              "&:hover": { backgroundColor: theme.palette.action.hover },
            }}
          >
            {form.watch("name") || "Untitled"}
          </Typography>
        )}

        {isFocused ? (
          <>
            <IconButton
              size="small"
              type="submit"
              aria-label="Save title"
              disabled={updateItemMutation.isPending}
              sx={{ borderRadius: theme.shape.borderRadiusMedium, flexShrink: 0 }}
            >
              <DoneIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              type="button"
              aria-label="Cancel title edit"
              onClick={handleCancel}
              disabled={updateItemMutation.isPending}
              sx={{ borderRadius: theme.shape.borderRadiusMedium, flexShrink: 0 }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </>
        ) : null}
      </Stack>
    </ClickAwayListener>
  );
};
