/** Drawing-sheet registration marks in the four corners of a positioned parent. */
export function Marks({ note }: { note?: string }) {
  return (
    <span className="marks" aria-hidden="true">
      <span className="reg reg--tl">+</span>
      <span className="reg reg--tr">+</span>
      <span className="reg reg--bl">+</span>
      <span className="reg reg--br">+</span>
      {note && <span className="marks__note t-mono">{note}</span>}
    </span>
  );
}
