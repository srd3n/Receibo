interface ReceiptEdgeProps {
  position: 'top' | 'bottom';
  className?: string;
  fill?: string;
}

export default function ReceiptEdge({
  position,
  className = '',
  fill = '#FCFAF7',
}: ReceiptEdgeProps) {
  // Generates 20 sharp triangular zigzag teeth across 100% width
  const toothCount = 28;
  const teeth = Array.from({ length: toothCount });

  return (
    <div
      className={`w-full overflow-hidden leading-none select-none ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox={`0 0 ${toothCount * 12} 8`}
        preserveAspectRatio="none"
        className={`w-full h-2 block ${position === 'top' ? 'rotate-180' : ''}`}
        fill={fill}
      >
        <path
          d={`M 0,0 ${teeth
            .map((_, i) => {
              const x1 = i * 12 + 6;
              const x2 = (i + 1) * 12;
              return `L ${x1},8 L ${x2},0`;
            })
            .join(' ')} L ${toothCount * 12},0 Z`}
        />
      </svg>
    </div>
  );
}
