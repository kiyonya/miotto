export function rgb2Hsl(rgb:number[]) {
  if (rgb.length !== 3 || rgb.some((value) => value < 0 || value > 255)) {
    throw new Error('Invalid RGB value')
  }
  const r = rgb[0] / 255
  const g = rgb[1] / 255
  const b = rgb[2] / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  let l = (max + min) / 2
  let s = 0
  if (max !== min) {
    s = l <= 0.5 ? delta / (max + min) : delta / (2 - max - min)
  }
  let h = 0
  if (delta !== 0) {
    if (r === max) {
      h = ((g - b) / delta) % 6
    } else if (g === max) {
      h = (b - r) / delta + 2
    } else if (b === max) {
      h = (r - g) / delta + 4
    }
    h = Math.round(h * 60)
    if (h < 0) {
      h += 360
    }
  }
  return [h,s,l]
}