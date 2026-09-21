/* eslint-disable react/prop-types */

import { FormControl, FormHelperText, Grid2, Skeleton, Typography } from "@mui/material";
import { Controller, FieldValues, Path, UseControllerProps, UseFormReturn } from "react-hook-form";
import Select from "../../../../shared/components/Select";
import { Label } from "../../../../shared/components/forms";

interface ItemPrioritySelectorProps<T extends FieldValues> {
  name: Path<T>;
  form: UseFormReturn<T>;
  onSubmit?: (value: string) => void;
  title?: string;
  options?: string[];
  helperText?: string;
  rules?: UseControllerProps<T>["rules"];
}

export const ItemPrioritySelector = <T extends FieldValues>({
  name,
  form,
  rules,
  onSubmit,
  title,
  options = [],
  helperText,
}: ItemPrioritySelectorProps<T>) => {
  const isLoading = false;

  return (
    <Grid2 container>
      {title && (
        <Grid2 size={12} paddingBottom={1}>
          <Label id={title} title={title} isLoading={isLoading} />
        </Grid2>
      )}
      <FormControl fullWidth>
        {isLoading ? (
          <Skeleton />
        ) : (
          <Controller
            name={name}
            control={form.control}
            rules={rules}
            render={({ field }) => {
              return (
                <Select
                  name={field.name}
                  value={field.value}
                  options={options.map((option) => ({
                    id: option,
                    name: option,
                  }))}
                  onChange={(e) => {
                    if (!e.target.value) return;

                    if (onSubmit) onSubmit(e.target.value as string);
                    field.onChange(e.target.value);
                  }}
                />
              );
            }}
          />
        )}
      </FormControl>
      {isLoading ? (
        <Skeleton width="200px" />
      ) : (
        helperText && (
          <FormHelperText>
            <Typography component="span" sx={{ fontSize: "13px" }}>
              {helperText}
            </Typography>
          </FormHelperText>
        )
      )}
    </Grid2>
  );
};
