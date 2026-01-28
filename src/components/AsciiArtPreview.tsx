import { useMemo } from 'react';
import { generateAsciiPreview } from '@/lib/ascii-art';

interface AsciiArtPreviewProps {
  text: string;
  color?: string;
}

export default function AsciiArtPreview({ text, color = 'hsl(var(--primary))' }: AsciiArtPreviewProps) {
  const lines = useMemo(() => generateAsciiPreview(text || 'SCRIPT'), [text]);
  
  return (
    <div className="bg-muted/30 rounded-lg p-4 overflow-x-auto">
      <pre 
        className="font-mono text-[6px] leading-[1.1] whitespace-pre"
        style={{ color }}
      >
        {lines.join('\n')}
      </pre>
    </div>
  );
}
