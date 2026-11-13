/** The goalpost mark drawn for `next/og`, scaled to any square size. */
export function IconArt({ size, rounded }: { size: number; rounded: boolean }) {
  const unit = size / 32;
  const stroke = 2.6 * unit;
  const line = {
    position: "absolute" as const,
    background: "#fbfaf5",
    borderRadius: stroke,
  };
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        position: "relative",
        background: "#203a2d",
        borderRadius: rounded ? 9 * unit : 0,
      }}
    >
      <div
        style={{
          ...line,
          left: 8.2 * unit,
          top: 6.2 * unit,
          width: stroke,
          height: 12.1 * unit,
        }}
      />
      <div
        style={{
          ...line,
          left: 21.2 * unit,
          top: 6.2 * unit,
          width: stroke,
          height: 12.1 * unit,
        }}
      />
      <div
        style={{
          ...line,
          left: 8.2 * unit,
          top: 15.7 * unit,
          width: 15.6 * unit,
          height: stroke,
        }}
      />
      <div
        style={{
          ...line,
          left: 14.7 * unit,
          top: 15.7 * unit,
          width: stroke,
          height: 10.6 * unit,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 13.8 * unit,
          top: 8.8 * unit,
          width: 4.4 * unit,
          height: 4.4 * unit,
          borderRadius: 4.4 * unit,
          background: "#c56d4d",
        }}
      />
    </div>
  );
}
