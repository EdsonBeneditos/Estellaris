import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TipoServico {
  id: string;
  nome: string;
  cor?: string | null;
}

interface TipoServicoMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: TipoServico[];
  disabled?: boolean;
  placeholder?: string;
}

export function TipoServicoMultiSelect({
  value,
  onChange,
  options,
  disabled = false,
  placeholder = "Selecionar serviços...",
}: TipoServicoMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const toggle = (nome: string) => {
    if (value.includes(nome)) {
      onChange(value.filter((v) => v !== nome));
    } else {
      onChange([...value, nome]);
    }
  };

  const remove = (nome: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter((v) => v !== nome));
  };

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          type="button"
          className={cn(
            "w-full justify-between h-auto min-h-9 px-3 py-2 font-normal",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onClick={() => !disabled && setOpen((o) => !o)}
        >
          <div className="flex flex-wrap gap-1 flex-1 text-left">
            {value.length === 0 ? (
              <span className="text-muted-foreground text-sm">{placeholder}</span>
            ) : (
              value.map((nome) => (
                <Badge
                  key={nome}
                  variant="secondary"
                  className="text-xs font-normal gap-1 pr-1"
                >
                  {nome}
                  {!disabled && (
                    <span
                      role="button"
                      tabIndex={0}
                      className="ml-0.5 hover:text-destructive cursor-pointer"
                      onMouseDown={(e) => remove(nome, e)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") remove(nome, e as any);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  )}
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start" style={{ minWidth: "var(--radix-popover-trigger-width)" }}>
        <Command>
          <CommandInput placeholder="Buscar serviço..." />
          <CommandList>
            <CommandEmpty>Nenhum serviço encontrado.</CommandEmpty>
            <CommandGroup>
              {options.map((t) => (
                <CommandItem
                  key={t.id}
                  value={t.nome}
                  onSelect={() => toggle(t.nome)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value.includes(t.nome) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {t.nome}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
