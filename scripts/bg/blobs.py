# Tách từng đồ vật trong sheet theo vùng không trong suốt, đánh số, in montage
import sys, json, numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage
ROOT = 'elz/'
def blobs(path, gap=2, minpx=40):
    im = Image.open(ROOT + path).convert('RGBA')
    a = np.array(im)[:, :, 3] > 0
    m = ndimage.binary_dilation(a, iterations=gap)
    lab, n = ndimage.label(m)
    out = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
        sub = a[y0:y1, x0:x1] & (lab[y0:y1, x0:x1] == i + 1)
        if sub.sum() < minpx: continue
        ys, xs = np.where(sub)
        out.append([int(x0 + xs.min()), int(y0 + ys.min()), int(xs.max() - xs.min() + 1), int(ys.max() - ys.min() + 1)])
    return im, out
if __name__ == '__main__':
    sheets = sys.argv[2:]
    W = 1400; x = y = rh = 0; tiles = []; db = {}
    for s in sheets:
        im, bs = blobs(s)
        db[s] = bs
        for k, (bx, by, bw, bh) in enumerate(bs):
            c = im.crop((bx, by, bx + bw, by + bh)); c = c.resize((bw * 2, bh * 2), Image.NEAREST)
            w, h = max(c.width, 60), c.height + 14
            if x + w > W: x = 0; y += rh + 6; rh = 0
            tiles.append((f'{s.split("/")[-1][:12]}#{k}', c, x, y)); x += w + 6; rh = max(rh, h)
    o = Image.new('RGBA', (W, y + rh + 10), (70, 60, 95, 255)); d = ImageDraw.Draw(o)
    for n, c, x, y in tiles:
        o.alpha_composite(c, (x, y + 14)); d.text((x, y), n, fill=(255, 240, 120))
    o.convert('RGB').save(sys.argv[1])
    json.dump(db, open(sys.argv[1] + '.json', 'w'))
    print(o.size, {k: len(v) for k, v in db.items()})
