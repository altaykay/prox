// Affiche un texte saisi dans l'administration avec une mise en forme minimale et sûre (pas de HTML) :
// « ## Titre », « # Titre », « - puce », lignes vides = paragraphes.
export function RichText({ text }: { text: string }) {
  const blocks = text.replace(/\r/g, "").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <>
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        if (/^#{1,3}\s/.test(lines[0]) && lines.length === 1) {
          const t = lines[0].replace(/^#+\s*/, "");
          return lines[0].startsWith("# ") ? <h1 key={i}>{t}</h1> : <h2 key={i}>{t}</h2>;
        }
        if (lines.every((l) => /^[-•*]\s/.test(l))) {
          return <ul key={i}>{lines.map((l, j) => <li key={j}>{l.replace(/^[-•*]\s*/, "")}</li>)}</ul>;
        }
        if (/^#{1,3}\s/.test(lines[0])) {
          return <div key={i}><h2>{lines[0].replace(/^#+\s*/, "")}</h2><p style={{ whiteSpace: "pre-line" }}>{lines.slice(1).join("\n")}</p></div>;
        }
        return <p key={i} style={{ whiteSpace: "pre-line" }}>{b}</p>;
      })}
    </>
  );
}
