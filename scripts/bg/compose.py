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


def bed(s, x, y, color=2):
    """giường đơn nhìn thẳng: đầu giường + nệm"""
    head = blob(BEDS, 21 + color)
    mat = blob(BEDS, 14 + color)
    s.put(head, x, y)
    s.put(mat, x, y + head.height - 10)


# ---------- phòng ngủ ----------
def phong():
    s = Scene()
    wall(s, 3, 0, 70)  # hồng nhạt
    floor(s, tile(WOOD, 2, 0), 70)
    s.put(blob(RUG, 3), 66, 92)
    s.put(sub(blob(PAINT, 1), 0, 0, 34, 28), 128, 12)
    s.put(blob(POST, 7), 70, 10)
    bed(s, 4, 26, 2)
    s.put(blob(DESK, 3), 120, 50)
    s.put(blob(LAP, 3), 140, 46)
    s.put(blob(ENDT, 10), 60, 52)
    l = blob(LAMP, 9); s.put(sub(l, 0, 0, l.width, l.height // 2), 62, 36)
    s.put(sub(blob(PLANT, 0), 230 - 0, 0, 0, 0) if False else tile(PLANT, 4, 1, 1, 2), 176, 54)
    s.save('phong')


# ---------- phòng khách ----------
def nha():
    s = Scene()
    wall(s, 27, 0, 70)  # xanh lá
    floor(s, tile(HERR, 2, 0), 70)
    s.put(blob(PAINT, 2), 20, 14)
    s.put(blob(DRESS, 10), 124, 44)
    s.put(blob(TV, 3), 120, 6)
    s.put(blob(SOFA, 6), 0, 50)
    s.put(tile(PLANT, 2, 0, 1, 3), 176, 36)
    s.put(blob(LAMP, 0), 104, 46)
    s.save('nha')


# ---------- văn phòng ----------
def vanphong():
    s = Scene()
    wall(s, 9, 0, 66)  # xám
    floor(s, tile(TILEB, 2, 1), 66)
    s.put(blob(PAINT, 3), 70, 10)
    for x in (6, 104):
        s.put(blob(DESK, 5), x, 54)
        s.put(blob(LAP, 1), x + 20, 50)
        s.put(sub(blob(CHAIR, 0), 0, 0, 24, 26), x + 30, 76)
    s.put(blob(COOL, 1), 182, 18)
    s.put(blob(COPY, 0), 4, 22)
    s.put(blob(BIN, 3), 92, 118)
    s.save('vanphong')


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
def lop():
    s = Scene()
    wall(s, 21, 0, 70)  # xanh ngọc
    floor(s, tile(WOOD, 3, 0), 70)
    board = blob(TV, 0)
    s.put(board, (W - board.width) // 2, 2)
    for row, y in enumerate((62, 98)):
        for x in (8, 150):
            s.put(blob(DESK, 4), x, y)
    s.save('lop')


# ---------- quán net ----------
def net():
    s = Scene()
    wall(s, 12, 0, 66)  # tím than
    floor(s, tile(TILEB, 3, 2), 66)
    s.put(blob(POST, 5), 20, 8)
    s.put(blob(POST, 9), 60, 10)
    for y in (46, 92):
        for x in (6, 150):
            s.put(blob(DESK, 2), x, y)
            s.put(blob(LAP, 1), x + 14, y - 4)
    s.put(blob(VEND, 1), 100, 0)
    s.save('net')


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
def que():
    s = Scene()
    T = 'Terrain/terrain_summer.png'
    s.fill(tile(T, 4, 1), 0, 0, W, H)
    s.fill(tile(T, 4, 4), 0, 96, W, 48)
    s.put(sheet(HOUSE_B), -36, -84)
    s.put(sheet('Terrain/tilled_soil.png').crop((0, 0, 96, 96)), 120, 0)
    P = 'Terrain/plants_summer.png'
    for x in (126, 158):
        for y in (8, 40):
            s.put(tile(P, 9, 0, 1, 2), x, y - 10)
    s.put(sheet(FENCE).crop((0, 0, 96, 32)), 112, 74)
    s.save('que')


if __name__ == '__main__':
    phong(); nha(); vanphong(); quan(); lop(); net(); pho(); que()
    for se in ('spring', 'summer', 'autumn', 'winter'):
        congvien(se)
    print('ok')
