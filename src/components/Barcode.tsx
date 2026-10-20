interface BarcodeProps {
  value: string;
  className?: string;
  showText?: boolean;
}

export default function Barcode({
  value,
  className = '',
  showText = true,
}: BarcodeProps) {
  // Deterministically generate a pattern of bar widths from the string
  const bars: { width: number; space: number }[] = [];
  const hashString = value || 'RCP-00000';
  
  for (let i = 0; i < hashString.length; i++) {
    const code = hashString.charCodeAt(i);
    const w1 = (code % 3) + 1; // 1 to 3px
    const s1 = ((code >> 1) % 2) + 1; // 1 to 2px
    const w2 = ((code >> 2) % 3) + 1;
    const s2 = 1.5;
    bars.push({ width: w1, space: s1 });
    bars.push({ width: w2, space: s2 });
  }

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="flex items-end justify-center h-8 gap-[1.5px] px-2 py-0.5 max-w-full overflow-hidden">
        {bars.map((bar, idx) => (
          <div
            key={idx}
            className="bg-neutral-800 h-full"
            style={{
              width: `${Math.max(1, bar.width * 1.2)}px`,
              marginRight: `${bar.space}px`,
            }}
          />
        ))}
      </div>
      {showText && (
        <span className="font-mono text-[10px] tracking-widest text-neutral-500 mt-1 select-all">
          *{value}*
        </span>
      )}
    </div>
  );
}
