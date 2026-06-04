// components/ui/datetime-input.tsx
import { useState, useEffect } from "react";
import { format } from "date-fns";

interface DateTimeInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function DateTimeInput({
  value,
  onChange,
  className,
}: DateTimeInputProps) {
  const [localValue, setLocalValue] = useState("");

  useEffect(() => {
    if (value) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          setLocalValue(format(date, "yyyy-MM-dd'T'HH:mm"));
        }
      } catch (e) {
        setLocalValue("");
      }
    } else {
      setLocalValue("");
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    console.log("New value:", newValue);

    if (newValue) {
      try {
        const date = new Date(newValue);
        if (!isNaN(date.getTime())) {
          onChange(date.toISOString());
          return;
        }
      } catch (e) {
        // Invalid date
      }
    }
    onChange("");
  };

  return (
    <input
      type="datetime-local"
      value={localValue}
      onChange={handleChange}
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    />
  );
}
