import {
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup as MuiRadioGroup,
  SxProps,
  FormControl,
} from "@mui/material";
import React, { useCallback } from "react";

export type RadioGroupOption = {
  key: string;
  label: React.ReactNode;
};

export type RadioGroupProps = {
  multiple?: boolean;
  value: string[];
  onChange: (value: string[]) => void;
  options: RadioGroupOption[];
  sx: SxProps;
};

export default function RadioGroup({
  multiple,
  value,
  onChange,
  options,
  sx,
}: RadioGroupProps) {
  const onCheckboxChanged = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const key = event.target.name;
      if (event.target.checked && !value.includes(key))
        onChange([...value, key]);
      else if (!event.target.checked) onChange(value.filter((v) => v !== key));
    },
    [onChange, value]
  );

  const controls = options.map(({ key, label }) => (
    <FormControlLabel
      key={key}
      value={key}
      label={label}
      control={
        multiple ? (
          <Checkbox
            checked={value.includes(key)}
            name={key}
            onChange={onCheckboxChanged}
          />
        ) : (
          <Radio name={key} />
        )
      }
      sx={{ marginBottom: 1 }}
    />
  ));

  if (!multiple)
    return (
      <MuiRadioGroup
        value={value[0] ?? ""}
        onChange={(e) => onChange([e.target.name])}
        sx={sx}
      >
        {controls}
      </MuiRadioGroup>
    );

  return (
    <FormControl component="fieldset" variant="standard" sx={sx}>
      {controls}
    </FormControl>
  );
}
