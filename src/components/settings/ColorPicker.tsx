import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Palette, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const PRESET_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#14B8A6", // Teal
  "#6366F1", // Indigo
  "#84CC16", // Lime
  "#A855F7", // Violet
];

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value || "#3B82F6");

  const handleColorSelect = (color: string) => {
    onChange(color);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          title="Escolher cor"
        >
          <div
            className="h-5 w-5 rounded-full border-2 border-border shadow-sm"
            style={{ backgroundColor: value || "#3B82F6" }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Palette className="h-4 w-4" />
            <span>Escolher Cor</span>
          </div>
          
          {/* Preset Colors */}
          <div className="grid grid-cols-6 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handleColorSelect(color)}
                className={cn(
                  "h-7 w-7 rounded-full border-2 transition-all hover:scale-110",
                  value === color
                    ? "border-foreground ring-2 ring-offset-2 ring-primary"
                    : "border-transparent"
                )}
                style={{ backgroundColor: color }}
              >
                {value === color && (
                  <Check className="h-4 w-4 text-white mx-auto" />
                )}
              </button>
            ))}
          </div>

          {/* Custom Color */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="h-8 w-12 p-0.5 cursor-pointer"
            />
            <Input
              type="text"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              placeholder="#000000"
              className="h-8 flex-1 font-mono text-xs"
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleColorSelect(customColor)}
              className="h-8"
            >
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
