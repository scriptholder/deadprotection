import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export interface ThemeColors {
  r: number;
  g: number;
  b: number;
}

interface ThemeColorPickerProps {
  value: ThemeColors;
  onChange: (colors: ThemeColors) => void;
}

export default function ThemeColorPicker({ value, onChange }: ThemeColorPickerProps) {
  const [colors, setColors] = useState<ThemeColors>(value);

  useEffect(() => {
    setColors(value);
  }, [value]);

  const handleChange = (channel: keyof ThemeColors, newValue: number[]) => {
    const updated = { ...colors, [channel]: newValue[0] };
    setColors(updated);
    onChange(updated);
  };

  const colorStyle = `rgb(${colors.r}, ${colors.g}, ${colors.b})`;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Label>Theme Color</Label>
        <div
          className="w-8 h-8 rounded-md border border-border"
          style={{ backgroundColor: colorStyle }}
        />
        <span className="text-sm font-mono text-muted-foreground">
          RGB({colors.r}, {colors.g}, {colors.b})
        </span>
      </div>
      
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-red-400">Red</Label>
            <span className="text-xs font-mono">{colors.r}</span>
          </div>
          <Slider
            value={[colors.r]}
            min={0}
            max={255}
            step={1}
            onValueChange={(v) => handleChange('r', v)}
            className="[&_[role=slider]]:bg-red-500"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-green-400">Green</Label>
            <span className="text-xs font-mono">{colors.g}</span>
          </div>
          <Slider
            value={[colors.g]}
            min={0}
            max={255}
            step={1}
            onValueChange={(v) => handleChange('g', v)}
            className="[&_[role=slider]]:bg-green-500"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-blue-400">Blue</Label>
            <span className="text-xs font-mono">{colors.b}</span>
          </div>
          <Slider
            value={[colors.b]}
            min={0}
            max={255}
            step={1}
            onValueChange={(v) => handleChange('b', v)}
            className="[&_[role=slider]]:bg-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
