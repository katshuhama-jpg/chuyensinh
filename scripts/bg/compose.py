# Ghép nền nhìn từ trên xuống từ LPC Revised + LPC Tile Atlas + LPC Streets, cỡ 200x144 (hiện gấp đôi)
# Cần thư mục elz/ cạnh script: bản clone https://github.com/ElizaWy/LPC (thêm terrain/base_out từ LPC Tile Atlas, street_*.png từ LPC Streets). Chạy: python3 compose.py public/bg
import os, sys
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from blobs import blobs

R = os.path.join(os.path.dirname(__file__), 'elz') + '/'
OUT = sys.argv[1] if len(sys.argv) > 1 else 'out'
os.makedirs(OUT, exist_ok=True)
W, H = 200, 144
_c = {}
_b = {}


def sheet(p):
    if p not in _c:
        _c[p] = Image.open(R + p).convert('RGBA')
    return _c[p]


def rect(p, x, y, w, h):
    return sheet(p).crop((x, y, x + w, y + h))


def tile(p, c, r, w=1, h=1, t=32):
    return rect(p, c * t, r * t, w * t, h * t)


def blob(p, i):
    if p not in _b:
        _b[p] = blobs(p)[1]
    x, y, w, h = _b[p][i]
    return rect(p, x, y, w, h)


def sub(img, x, y, w, h):
    return img.crop((x, y, x + w, y + h))


class Scene:
    def __init__(self):
        self.im = Image.new('RGBA', (W, H), (0, 0, 0, 255))

    def fill(self, t, x=0, y=0, w=W, h=H):
        for yy in range(y, y + h, t.height):
            for xx in range(x, x + w, t.width):
                c = t.crop((0, 0, min(t.width, x + w - xx), min(t.height, y + h - yy)))
                self.im.alpha_composite(c, (xx, yy))

    def put(self, img, x, y, anchor='tl'):
        """anchor 'b': x là tâm, y là đáy"""
        if anchor == 'b':
            x, y = x - img.width // 2, y - img.height
        x, y = int(x), int(y)
        # cắt phần ngoài khung
        sx, sy = max(0, -x), max(0, -y)
        c = img.crop((sx, sy, img.width, img.height))
        self.im.alpha_composite(c, (max(0, x), max(0, y)))

    def save(self, name):
        self.im.convert('RGB').save(f'{OUT}/{name}.png')


PW = 'Structure/Walls/Painted Walls.png'


def wall(s, col, row=0, h=64):
    """dải tường sơn: khối 96x128 (cột, hàng màu), lấy phần dưới cao h"""
    b = rect(PW, col * 32, row * 128, 96, 128)
    b = sub(b, 0, 128 - h - 0, 96, h)
    s.fill(b, 0, 0, W, h)


def floor(s, t, y):
    s.fill(t, 0, y, W, H - y)


BEDS = 'Objects/Furniture/Beds/Beds, Single  A.png'
DESK = 'Objects/Furniture/Desk, Office.png'
CHAIR = 'Objects/Furniture/Seating/Chair, Office.png'
LAP = 'Objects/Small Items/Laptop.png'
POST = 'Objects/Wall Items/Posters.png'
RUG = 'Objects/Furniture/Rugs/Rainbow Rug.png'
LAMP = 'Objects/Small Items/Lighting, Table.png'
ENDT = 'Objects/Furniture/End Table.png'
PLANT = 'Objects/Furniture/Planter.png'
DRESS = 'Objects/Furniture/Dresser.png'
TV = 'Objects/Furniture/TV, Widescreen.png'
SOFA = 'Objects/Furniture/Seating/Sofa Set, Casual A.png'
PAINT = 'Objects/Wall Items/Paintings, Landscape.png'
CUR = 'Objects/Wall Items/Curtains.png'
COOL = 'Objects/Furniture/Water Cooler.png'
COPY = 'Objects/Furniture/Copy Machine.png'
VEND = 'Objects/Furniture/Vending Machine.png'
BIN = 'Objects/Furniture/Bin.png'
STOOL = 'Objects/Furniture/Seating/Bar Stools.png'
DINE = 'Objects/Furniture/Seating/Chair, Dining A.png'
COUNTER = 'Objects/Furniture/Countertop.png'
COFFEE = 'Objects/Small Items/Coffee Maker.png'
MEALS = 'Objects/Small Items/Food/Meals.png'
CARD = 'Objects/Furniture/Table, Card.png'
WOOD = 'Structure/Floor/Wood Floor A.png'
TILEB = 'Structure/Floor/Tile B.png'
TILEC = 'Structure/Floor/Tile C.png'
HERR = 'Structure/Floor/Herringbone A.png'
LIGHT_OUT = 'Objects/Furniture/Lighting, Outdoors.png'
HOUSE_A = 'Structure/Structures/Brick House A.png'
HOUSE_B = 'Structure/Structures/Brick House B.png'
AWN = 'Structure/Windows/Window Awnings A.png'
FENCE = 'Structure/Fences/Plain Fence A.png'
FOUNT = 'Structure/Misc/Fountain A.png'
FLOW = 'Terrain/flowers.png'


def px_img(w, h, rects):
    im = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    from PIL import ImageDraw
    d = ImageDraw.Draw(im)
    for x, y, ww, hh, c in rects:
        d.rectangle([x, y, x + ww - 1, y + hh - 1], fill=c)
    return im


OUTL = '#2b1d1a'
BOARD = px_img(120, 54, [
    (0, 0, 120, 54, OUTL), (1, 1, 118, 52, '#7a4a2a'), (2, 2, 116, 2, '#a8703e'), (5, 5, 110, 42, OUTL),
    (6, 6, 108, 40, '#2f5a3c'), (6, 6, 108, 2, '#3d6e4a'), (12, 12, 40, 2, '#d8e0d0'), (12, 18, 56, 2, '#d8e0d0'),
    (12, 24, 30, 2, '#d8e0d0'), (70, 12, 30, 20, '#3d6e4a'), (74, 16, 20, 1, '#d8e0d0'), (74, 22, 14, 1, '#d8e0d0'),
    (10, 47, 100, 4, '#5a3a24'), (20, 46, 8, 2, '#f0f0e8'), (34, 46, 6, 2, '#e8c070'),
])
CRT = px_img(26, 24, [
    (0, 0, 26, 20, OUTL), (1, 1, 24, 18, '#c8c0a8'), (1, 1, 24, 2, '#e0d8c0'), (3, 3, 20, 13, OUTL), (4, 4, 18, 11, '#3a6a8a'),
    (5, 5, 8, 2, '#7ab0d0'), (6, 20, 14, 4, OUTL), (7, 20, 12, 3, '#a8a090'), (20, 17, 3, 1, '#7fd17f'),
])
TVBOX = px_img(36, 30, [
    (0, 0, 36, 28, OUTL), (1, 1, 34, 26, '#7a4a2a'), (1, 1, 34, 2, '#a8703e'), (3, 3, 24, 20, OUTL), (4, 4, 22, 18, '#3f5f6f'),
    (6, 6, 8, 3, '#7aa0b0'), (29, 5, 4, 4, '#2a2a30'), (29, 12, 4, 4, '#2a2a30'), (29, 20, 4, 2, '#c8b878'), (6, 28, 4, 2, OUTL), (26, 28, 4, 2, OUTL),
])
RADIO = px_img(20, 12, [
    (0, 0, 20, 12, OUTL), (1, 1, 18, 10, '#4a4a58'), (1, 1, 18, 2, '#6a6a78'), (3, 4, 5, 5, '#2a2a30'), (12, 4, 5, 5, '#2a2a30'),
    (4, 5, 3, 3, '#8a8a9a'), (13, 5, 3, 3, '#8a8a9a'), (8, 5, 4, 2, '#c4573a'),
])
BOOKS = px_img(16, 12, [
    (0, 0, 16, 12, OUTL), (1, 1, 14, 3, '#c4573a'), (2, 4, 13, 3, '#4a7ab8'), (1, 7, 14, 4, '#e0b54a'), (1, 1, 14, 1, '#e8789f'),
])


def bed(s, x, y, color=2):
    """giường đơn nhìn thẳng: đầu giường + nệm"""
    head = blob(BEDS, 21 + color)
    mat = blob(BEDS, 14 + color)
    s.put(head, x, y)
    s.put(mat, x, y + head.height - 10)


# ---------- phòng ngủ ----------
def phong(old=False):
    s = Scene()
    wall(s, 3, 0, 70)  # hồng nhạt
    floor(s, tile(WOOD, 2, 0), 70)
    s.put(blob(RUG, 3), 66, 92)
    s.put(sub(blob(PAINT, 1), 0, 0, 34, 28), 128, 12)
    s.put(blob(POST, 7), 70, 10)
    bed(s, 4, 26, 2)
    s.put(blob(DESK, 3), 120, 50)
    if not old: s.put(blob(LAP, 3), 140, 46)
    else: s.put(RADIO, 138, 42); s.put(BOOKS, 158, 44)
    s.put(blob(ENDT, 10), 60, 52)
    l = blob(LAMP, 9); s.put(sub(l, 0, 0, l.width, l.height // 2), 62, 36)
    s.put(sub(blob(PLANT, 0), 230 - 0, 0, 0, 0) if False else tile(PLANT, 4, 1, 1, 2), 176, 54)
    s.save('phong' + ('_old' if old else ''))


# ---------- phòng khách ----------
def nha(old=False):
    s = Scene()
    wall(s, 27, 0, 70)  # xanh lá
    floor(s, tile(HERR, 2, 0), 70)
    s.put(blob(PAINT, 2), 20, 14)
    s.put(blob(DRESS, 10), 124, 44)
    if old: s.put(TVBOX, 138, 16)
    else: s.put(blob(TV, 3), 120, 6)
    s.put(blob(SOFA, 6), 0, 50)
    s.put(tile(PLANT, 2, 0, 1, 3), 176, 36)
    s.put(blob(LAMP, 0), 104, 46)
    s.save('nha' + ('_old' if old else ''))


# ---------- văn phòng ----------
def vanphong(old=False):
    s = Scene()
    wall(s, 9, 0, 66)  # xám
    floor(s, tile(TILEB, 2, 1), 66)
    s.put(blob(PAINT, 3), 70, 10)
    for x in (6, 104):
        s.put(blob(DESK, 5), x, 54)
        if not old: s.put(blob(LAP, 1), x + 20, 50)
        else: s.put(CRT, x + 22, 38)
        s.put(sub(blob(CHAIR, 0), 0, 0, 24, 26), x + 30, 76)
    s.put(blob(COOL, 1), 182, 18)
    s.put(blob(COPY, 0), 4, 22)
    s.put(blob(BIN, 3), 92, 118)
    s.save('vanphong' + ('_old' if old else ''))


# ---------- quán cà phê ----------
def quan():
    s = Scene()
    wall(s, 36, 0, 66)  # cam đất
    floor(s, tile(WOOD, 0, 0), 66)
    s.put(sub(blob(PAINT, 0), 0, 0, 40, 34), 12, 10)
    cnt = blob(COUNTER, 3)
    s.put(cnt, 60, 40)
    s.put(blob(COFFEE, 0), 96, 30)
    for i, x in enumerate((70, 96, 122)):
        s.put(blob(STOOL, i), x, 72)
    s.put(tile(PLANT, 3, 0, 1, 2), 176, 34)
    s.put(tile(PLANT, 0, 1, 1, 2), 4, 50)
    s.save('quan')


# ---------- lớp học ----------
def lop(old=False):
    s = Scene()
    wall(s, 21, 0, 70)  # xanh ngọc
    floor(s, tile(WOOD, 3, 0), 70)
    board = BOARD if old else blob(TV, 0)
    s.put(board, (W - board.width) // 2, 4 if old else 2)
    for row, y in enumerate((62, 98)):
        for x in (8, 150):
            s.put(blob(DESK, 4), x, y)
    s.save('lop' + ('_old' if old else ''))


# ---------- quán net ----------
def net(old=False):
    s = Scene()
    wall(s, 12, 0, 66)  # tím than
    floor(s, tile(TILEB, 3, 2), 66)
    s.put(blob(POST, 5), 20, 8)
    s.put(blob(POST, 9), 60, 10)
    for y in (46, 92):
        for x in (6, 150):
            s.put(blob(DESK, 2), x, y)
            s.put(CRT if old else blob(LAP, 1), x + 14, y - (16 if old else 4))
    s.put(blob(VEND, 1), 100, 0)
    s.save('net' + ('_old' if old else ''))


# ---------- phố ----------
def pho():
    s = Scene()
    s.fill(tile('street_dark.png', 1, 1), 0, 0, W, H)
    s.fill(tile(TILEC, 0, 0), 0, 0, W, 116)
    ha = blob(HOUSE_A, 0) if False else sheet(HOUSE_A)
    hb = sheet(HOUSE_B)
    s.put(hb, -30, -110)
    s.put(ha, 72, -126)
    s.put(blob(LIGHT_OUT, 0), 150, 110, 'b')
    s.put(blob(LIGHT_OUT, 0), 40, 110, 'b')
    for x in range(0, W, 48):
        s.put(rect('road_markings_white.png', 0, 0, 1, 1) if False else Image.new('RGBA', (24, 2), (220, 220, 210, 255)), x + 8, 132)
    s.put(Image.new('RGBA', (W, 2), (90, 90, 100, 255)), 0, 116)
    s.save('pho')


# ---------- công viên theo mùa ----------
def congvien(season):
    s = Scene()
    T = f'Terrain/terrain_{season}.png'
    TR = f'Terrain/trees_{season}.png'
    s.fill(tile(T, 4, 1), 0, 0, W, H)
    s.fill(tile(T, 4, 4), 0, 100, W, 44)  # lối đất
    s.put(tile(T, 3, 3, 3, 1), 0, 96) if False else None
    s.put(tile(TR, 1, 1, 2, 2), 2, 30)  # bóng
    s.put(tile(TR, 4, 0, 3, 4), -20, -48)
    s.put(tile(TR, 13, 0, 3, 4), 136, -52)
    s.put(sheet(FOUNT), 84, 10)
    for i, x in enumerate((60, 120, 150)):
        s.put(tile(FLOW, (i * 3) % 9, 1), x, 66)
    s.save(f'congvien_{season}')


# ---------- nhà ở quê ----------
def que(season='summer'):
    s = Scene()
    T = f'Terrain/terrain_{season}.png'
    s.fill(tile(T, 4, 1), 0, 0, W, H)
    s.fill(tile(T, 4, 4), 0, 96, W, 48)
    s.put(sheet(HOUSE_B), -36, -84)
    s.put(sheet('Terrain/tilled_soil.png').crop((0, 0, 96, 96)), 120, 0)
    P = f'Terrain/plants_{season}.png'
    for x in (126, 158):
        for y in (8, 40):
            s.put(tile(P, 9, 0, 1, 2), x, y - 10)
    s.put(sheet(FENCE).crop((0, 0, 96, 32)), 112, 74)
    s.save(f'que_{season}')


BRICK = 'Structure/Walls/Brick Wall A.png'
PILLAR = 'Structure/Pillars/Stone Pillar A.png'
IRON = 'Structure/Fences/Ornamental Fence B.png'


def cong(season='summer'):
    """cổng trường: tường vàng nhạt, hai trụ, cổng sắt, cây hai bên, sân lát gạch"""
    s = Scene()
    T = f'Terrain/terrain_{season}.png'
    TR = f'Terrain/trees_{season}.png'
    s.fill(tile(T, 4, 1), 0, 0, W, 40)
    s.fill(tile(TILEC, 0, 0), 0, 70, W, H - 70)
    wallb = rect(BRICK, 0, 0, 96, 96)
    s.fill(sub(wallb, 0, 32, 96, 64), 0, 8, 68, 64)
    s.fill(sub(wallb, 0, 32, 96, 64), 132, 8, 68, 64)
    s.fill(tile(T, 4, 4), 68, 8, 64, 64)
    s.fill(sub(sheet(IRON), 32, 32, 64, 64), 68, 16, 64, 56)
    pil = rect(PILLAR, 0, 0, 32, 96)
    s.put(pil, 52, -22)
    s.put(pil, 116, -22)
    s.put(Image.new('RGBA', (52, 12), (47, 90, 140, 255)), 74, 2)
    s.put(Image.new('RGBA', (44, 2), (255, 210, 74, 255)), 78, 7)
    s.put(tile(TR, 4, 0, 3, 4), -44, -80)
    s.put(tile(TR, 13, 0, 3, 4), 150, -84)
    s.save(f'cong_{season}')


def ngo(season='summer'):
    """ngõ nhà: hai nhà gạch, chậu cây, thùng rác, cây theo mùa, đường lát gạch"""
    s = Scene()
    TR = f'Terrain/trees_{season}.png'
    s.fill(tile(TILEC, 2, 0), 0, 0, W, H)
    s.put(sheet(HOUSE_A), -60, -120)
    s.put(sheet(HOUSE_B), 110, -100)
    s.put(tile(TR, 4, 0, 3, 4), 64, -78)
    s.put(tile(PLANT, 4, 1, 1, 2), 84, 46)
    s.put(blob(BIN, 3), 102, 60)
    s.put(blob(LIGHT_OUT, 0), 190, 104, 'b')
    s.save(f'ngo_{season}')


if __name__ == '__main__':
    for o in (False, True):
        phong(o); nha(o); vanphong(o); lop(o); net(o)
    quan(); pho()
    for se in ('spring', 'summer', 'autumn'):
        congvien(se); que(se); cong(se); ngo(se)
    print('ok')
