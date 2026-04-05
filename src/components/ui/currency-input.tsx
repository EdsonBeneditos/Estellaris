import { forwardRef, useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> {
  value: number | null | undefined;
  onChange: (value: number) => void;
}

function numberToDisplay(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value as number)) return "";
  return (value as number).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function displayToNumber(raw: string): number {
  // Remove tudo exceto dígitos e vírgula/ponto
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return 0;
  // Últimos 2 dígitos são centavos
  const intPart = digits.slice(0, -2) || "0";
  const decPart = digits.slice(-2).padStart(2, "0");
  return parseFloat(`${intPart}.${decPart}`);
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, className, onBlur, ...props }, _ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [display, setDisplay] = useState<string>(numberToDisplay(value));

    useEffect(() => {
      // Only sync from prop if input is not focused
      if (document.activeElement !== inputRef.current) {
        setDisplay(numberToDisplay(value));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Keep only digits
      const digits = raw.replace(/[^\d]/g, "");
      const numeric = displayToNumber(digits.padStart(3, "0"));

      // Format for display
      const formatted = numeric === 0 ? "" : numberToDisplay(numeric);
      setDisplay(formatted);
      onChange(numeric);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Re-format on blur
      const numeric = displayToNumber(display.replace(/[^\d]/g, ""));
      setDisplay(numeric === 0 ? "" : numberToDisplay(numeric));
      onBlur?.(e);
    };

    const handleFocus = () => {
      // Move cursor to end on focus
      setTimeout(() => {
        if (inputRef.current) {
          const len = inputRef.current.value.length;
          inputRef.current.setSelectionRange(len, len);
        }
      }, 0);
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none select-none">
          R$
        </span>
        <Input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={display}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          className={cn("pl-9", className)}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
