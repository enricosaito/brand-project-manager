/**
 * Mock imagery. Every image here is a real Unsplash photo so previews feel
 * like content rather than placeholders. Replace with uploaded files later.
 */
export function unsplash(id: string, width = 1600) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=80`
}

/** Curated covers offered in the project creation form. */
export const COVER_OPTIONS: { id: string; label: string; url: string }[] = [
  { id: "swatches", label: "Swatches", url: unsplash("1561070791-2526d30994b5") },
  { id: "ink", label: "Ink", url: unsplash("1541701494587-cb58502866ab") },
  { id: "gradient", label: "Gradient", url: unsplash("1557683316-973673baf926") },
  { id: "kraft", label: "Kraft", url: unsplash("1595246140625-573b715d11dc") },
  { id: "studio", label: "Studio", url: unsplash("1559136555-9303baea8ebd") },
  { id: "press", label: "Press", url: unsplash("1503694978374-8a2fa686963a") },
  { id: "summer", label: "Summer", url: unsplash("1515886657613-9f3515b0c78f") },
  { id: "pink", label: "Pink wall", url: unsplash("1503342217505-b0a15ec3261c") },
  { id: "wave", label: "Wave", url: unsplash("1618005182384-a83a8bd57fbe") },
  { id: "smoke", label: "Smoke", url: unsplash("1574169208507-84376144848b") },
  { id: "product", label: "Product", url: unsplash("1608528577891-eb055944f2e7") },
  { id: "desk", label: "Desk", url: unsplash("1524758631624-e2822e304c36") },
]

/** Sample images used by the mock upload flow. */
export const UPLOAD_SAMPLES: {
  name: string
  url: string
  width: number
  height: number
}[] = [
  { name: "Studio — Teal Wall.jpg", url: unsplash("1494438639946-1ebd1d20bf85"), width: 5184, height: 3456 },
  { name: "Texture — Blush Paper.jpg", url: unsplash("1554755229-ca4470e07232"), width: 4000, height: 6000 },
  { name: "Product Detail — Ring.jpg", url: unsplash("1605100804763-247f67b3557e"), width: 5472, height: 3648 },
  { name: "Workshop — Sticky Notes.jpg", url: unsplash("1552664730-d307ca884978"), width: 6000, height: 4000 },
  { name: "Mood — Lakeside.jpg", url: unsplash("1470770841072-f978cf4d019e"), width: 5760, height: 3840 },
  { name: "Mood — Alpine.jpg", url: unsplash("1506905925346-21bda4d32df4"), width: 6000, height: 4000 },
]
