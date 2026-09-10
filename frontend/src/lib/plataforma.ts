/** Detecta macOS/iOS para mostrar ⌘ em vez de Ctrl nos atalhos. O atalho em si aceita os dois. */
export function ehApple() {
  if (typeof navigator === "undefined") return false
  const p = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ?? navigator.platform ?? ""
  return /mac|iphone|ipad|ipod/i.test(p)
}

export const teclaMod = () => (ehApple() ? "⌘" : "Ctrl")
