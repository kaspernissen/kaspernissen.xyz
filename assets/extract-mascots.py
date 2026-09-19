import cv2, numpy as np, os
from PIL import Image
from scipy import ndimage

SHEETS = {"a": "/Users/kaspernissen/Downloads/Gemini_Generated_Image_h1wnh6h1wnh6h1wn.jpeg",
          "b": "/Users/kaspernissen/Downloads/Gemini_Generated_Image_19n0l019n0l019n0.jpeg"}
NAMES = {"a": ["smirk","panic","hopeful","exasperated","facepalm","arms-crossed","celebrate","deadpan","oops"],
         "b": ["smile","excited","worried","thinking","sad","angry","laughing","shrug","shocked"]}
D, PAD = 10, 6
OUT = "/Users/kaspernissen/kaspernissen/kaspernissen.xyz/assets/mascots"
os.makedirs(OUT, exist_ok=True)
DISK = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))

for key, path in SHEETS.items():
    rgb = np.asarray(Image.open(path).convert("RGB")).astype(np.int16)
    h, w = rgb.shape[:2]
    border = np.concatenate([rgb[:3].reshape(-1,3), rgb[-3:].reshape(-1,3),
                             rgb[:,:3].reshape(-1,3), rgb[:,-3:].reshape(-1,3)])
    bgc = np.median(border, 0)

    # Keyed on colour distance, not brightness. The outline strokes are as dark
    # as the background but a different black - the ground is warm (R>G>B), the
    # strokes are cool (B>R>G). Keying on darkness alone let the fill run along
    # the strokes and slit the jacket open all the way to the collar.
    m = (np.sqrt(((rgb - bgc) ** 2).sum(2)) <= D).astype(np.uint8)
    filled, ff = m.copy(), np.zeros((h + 2, w + 2), np.uint8)
    for x, y in ([(x,0) for x in range(0,w,8)] + [(x,h-1) for x in range(0,w,8)]
                 + [(0,y) for y in range(0,h,8)] + [(w-1,y) for y in range(0,h,8)]):
        if filled[y, x] == 1:
            cv2.floodFill(filled, ff, (x, y), 2)
    bg = filled == 2

    # Background the figure encloses - the gaps between a raised arm and the
    # head - which no border seed can reach. Told from the jacket's dark seams
    # by thickness: a pocket keeps a large core after a 5px erosion.
    lab_p, n_p = ndimage.label((m == 1) & ~bg)
    pockets = 0
    for i, sl in enumerate(ndimage.find_objects(lab_p), 1):
        if sl is None: continue
        ys, xs = sl
        if (ys.stop-ys.start) * (xs.stop-xs.start) < 4000: continue
        comp = (lab_p[ys, xs] == i).astype(np.uint8)
        if cv2.erode(comp, DISK).sum() >= 500:
            bg[ys, xs] |= comp.astype(bool); pockets += 1

    alpha = cv2.morphologyEx((~bg).astype(np.uint8)*255, cv2.MORPH_CLOSE, np.ones((3,3), np.uint8))
    lab, n = ndimage.label(alpha > 0)
    sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n+1))
    keep = [i+1 for i, s in enumerate(sizes) if s > 20000]
    boxes = ndimage.find_objects(lab)
    cells = [((boxes[k-1][0].start+boxes[k-1][0].stop)/2, (boxes[k-1][1].start+boxes[k-1][1].stop)/2, boxes[k-1], k) for k in keep]
    cells.sort(key=lambda c: c[0])
    ordered = [c for r in range(3) for c in sorted(cells[r*3:(r+1)*3], key=lambda c: c[1])]
    assert len(ordered) == 9, f"{key}: expected 9, got {len(ordered)}"
    print(f"sheet {key}: 9 mascots, {pockets} enclosed pockets removed")
    for idx, (cy, cx, (ys, xs), lbl) in enumerate(ordered, 1):
        y0, y1 = max(0, ys.start-PAD), min(h, ys.stop+PAD)
        x0, x1 = max(0, xs.start-PAD), min(w, xs.stop+PAD)
        a = cv2.GaussianBlur(((lab[y0:y1, x0:x1] == lbl).astype(np.uint8))*255, (0,0), 0.8)
        Image.fromarray(np.dstack([rgb[y0:y1, x0:x1].astype(np.uint8), a])).save(
            os.path.join(OUT, f"{NAMES[key][idx-1]}.png"), optimize=True)
print("18 mascots written")
