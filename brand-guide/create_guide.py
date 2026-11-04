from io import BytesIO
from pathlib import Path
from PIL import Image
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from themes import THEMES, MOTION

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'output/pdf/Idunuoluwa-Miracle-Brand-Guide.pdf'
ALBUM = ROOT / 'brand-guide/assets/album'
for n, f in [('Display', 'BOD_R.TTF'), ('DisplayI', 'BOD_I.TTF'), ('Sans', 'segoeui.ttf'),
             ('SansSB', 'seguisb.ttf'), ('SansL', 'segoeuil.ttf')]:
    pdfmetrics.registerFont(TTFont(n, 'C:/Windows/Fonts/' + f))

W, H = 960, 540
M, R = 42, 918                      # one margin for header, body and rules
P = '#2D1735'; C = '#F6EFE8'; K = '#2A2129'; F = '#D82C79'; L = '#E7CBD8'; G = '#A85A43'; V = '#6B4FA6'
TRACK = 0.08                        # caps labels get +8% tracking

c = canvas.Canvas(str(OUT), pagesize=(W, H))
c.setTitle('Idunuoluwa Miracle | Brand Identity Guide')
PAGE = [0]

# --- drawing helpers --------------------------------------------------------
def rect(x, y, w, h, col, stroke=None):
    c.setFillColor(HexColor(col))
    if stroke: c.setStrokeColor(HexColor(stroke)); c.setLineWidth(.6)
    c.rect(x, y, w, h, stroke=1 if stroke else 0, fill=1)

def line(x1, y1, x2, y2, col=P, w=.6):
    c.setStrokeColor(HexColor(col)); c.setLineWidth(w); c.line(x1, y1, x2, y2)

def width(s, font, size, cs=0): return pdfmetrics.stringWidth(s, font, size) + cs * len(s)

def t(s, x, y, size=12, font='Sans', color=K, caps=False, align='l'):
    cs = size * TRACK if caps else 0
    if caps: s = s.upper()
    w = width(s, font, size, cs)
    x = x - w / 2 if align == 'c' else x - w if align == 'r' else x
    to = c.beginText(); to.setFont(font, size); to.setCharSpace(cs); to.setFillColor(HexColor(color))
    to.setTextOrigin(x, y); to.textOut(s)
    c.saveState(); c.drawText(to); c.restoreState()   # keep char spacing from leaking into later text
    return w

def para(s, x, top, w, size=12, leading=18, color=K, font='Sans'):
    p = Paragraph(s, ParagraphStyle('p', fontName=font, fontSize=size, leading=leading, textColor=HexColor(color)))
    _, h = p.wrap(w, 500); p.drawOn(c, x, top - h); return h

_cache = {}
def photo(n, x, y, w, h, fx=.5, fy=.5, zoom=1.0):
    """Cover-fit album frame n into the box; fx/fy pick the focal point (0 = left/top)."""
    key = (n, round(w), round(h), fx, fy, zoom)
    if key not in _cache:
        im = Image.open(ALBUM / f'{n:02}.jpg').convert('RGB'); iw, ih = im.size
        s = max(w / iw, h / ih) * zoom; cw, ch = w / s, h / s
        left, top = (iw - cw) * fx, (ih - ch) * fy
        im = im.crop((int(left), int(top), int(left + cw), int(top + ch))).resize((int(w * 3), int(h * 3)), Image.LANCZOS)
        buf = BytesIO(); im.save(buf, 'JPEG', quality=86); buf.seek(0); _cache[key] = ImageReader(buf)
    c.drawImage(_cache[key], x, y, w, h)

def palette_of(frames, k=4):
    strip = Image.new('RGB', (120 * len(frames), 150))
    for i, n in enumerate(frames):
        im = Image.open(ALBUM / f'{n:02}.jpg').convert('RGB'); im.thumbnail((120, 150)); strip.paste(im.resize((120, 150)), (i * 120, 0))
    q = strip.quantize(8, method=Image.Quantize.MEDIANCUT); pal = q.getpalette()
    counts = sorted(q.getcolors(), reverse=True)[:k]
    cols = [tuple(pal[i * 3:i * 3 + 3]) for _, i in counts]
    return ['#%02X%02X%02X' % col for col in sorted(cols, key=lum)]

def lum(rgb):
    ch = [v / 255 for v in rgb]; ch = [v / 12.92 if v <= .03928 else ((v + .055) / 1.055) ** 2.4 for v in ch]
    return .2126 * ch[0] + .7152 * ch[1] + .0722 * ch[2]

def contrast(a, b):
    la, lb = (lum(tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))) for h in (a, b))
    return (max(la, lb) + .05) / (min(la, lb) + .05)

def page(section, dark=False, left=M, right=R):
    PAGE[0] += 1
    rect(0, 0, W, H, P if dark else C); ink = C if dark else P
    t('Idunuoluwa Miracle', left, 510, 8, 'SansSB', ink, caps=True)
    t(section, (left + right) / 2, 510, 8, 'Sans', ink, caps=True, align='c')
    t(f'{PAGE[0]:02}', right, 510, 8, 'SansSB', ink, caps=True, align='r')
    line(left, 498, right, 498, ink, .5)
    return ink

def eyebrow(s, x, y, dark=False):
    rect(x, y + 3, 16, 1.6, F)
    t(s, x + 24, y, 8.5, 'SansSB', C if dark else P, caps=True)

def title(s, x, y, size=38, color=P, font='Display'): t(s, x, y, size, font, color)
def end(): c.showPage()

# --- 01 cover ---------------------------------------------------------------
PAGE[0] += 1
rect(0, 0, W, H, P); photo(49, 500, 0, 460, 540, fy=.9)
t('Brand identity guide', M, 493, 8.5, 'SansSB', L, caps=True)
t('Edition 02', 458, 493, 8.5, 'Sans', L, caps=True, align='r')
t('Idunuoluwa', M, 300, 58, 'Display', C); t('Miracle', M - 2, 228, 76, 'DisplayI', C)
line(M, 196, 458, 196, L, .5)
para('A world of beauty, culture<br/>and confident expression.', M, 178, 400, 17, 24, C, 'DisplayI')
t('Nine collections  /  Creative direction', M, 43, 8.5, 'SansSB', L, caps=True)
end()

# --- 02 contents ------------------------------------------------------------
page('Contents', right=600); photo(62, 640, 0, 320, 540, fy=.4)
eyebrow('Inside', M, 459); title('Everything in its place.', M, 410)
toc = [('The idea', 3), ('The voice', 4), ('The signature', 5), ('The palette', 6), ('Typography', 7),
       ('The collections', 8)] + [(th['name'], 9 + i) for i, th in enumerate(THEMES)] + \
      [('Art direction', 18), ('Applications', 19), ('Before sharing', 20)]
for i, (name, n) in enumerate(toc):
    col, row = divmod(i, 9); x, y = M + col * 290, 350 - row * 30
    t(f'{n:02}', x, y, 9, 'SansSB', P); t(name, x + 30, y, 14, 'Display', P); line(x, y - 11, x + 260, y - 11, L, .5)
end()

# --- 03 foundation ----------------------------------------------------------
page('Brand foundation', right=620); photo(28, 660, 0, 300, 540, fy=.25)
eyebrow('01 / The idea', M, 459); title('Presence with a point of view.', M, 410, 36)
para('Idunuoluwa Miracle brings fashion, beauty and personal storytelling together in imagery that feels expressive, considered and alive.',
     M, 378, 540, 18, 26, P, 'Display')
line(M, 280, 620, 280, P, .5)
for i, (a, b) in enumerate([
        ('Positioning', 'An editorial creative identity for fashion and beauty collaborations, shaped by vibrant self-expression and an appreciation for cultural detail.'),
        ('Audience', 'Fashion and beauty brands, photographers and creative teams drawn to style, confidence and personal expression.'),
        ('Promise', 'Bring intention to the image and personality to the story, from a striking editorial frame to an everyday moment.')]):
    x = M + i * 196; t(a, x, 252, 8.5, 'SansSB', P, caps=True); para(b, x, 236, 176, 10.5, 16)
end()

# --- 04 voice ---------------------------------------------------------------
page('Personality & voice', left=342); photo(52, 0, 0, 300, 540, fx=.55)
eyebrow('02 / The voice', 342, 459); title('Warm. Poised. Expressive.', 342, 410, 36)
para('Speak with the confidence of someone comfortable in her own style. Keep the language human, specific and generous to collaborators.',
     342, 380, 520, 15, 22, P, 'Display')
for i, (a, b) in enumerate([('Confident', 'Make a clear statement without overclaiming.'), ('Warm', 'Invite people in; write as a person, not a press release.'),
                            ('Expressive', 'Use sensory detail and a little rhythm, without excess.'), ('Considered', 'Name the craft and credit the people behind the frame.')]):
    x, y = 342 + (i % 2) * 296, 290 - (i // 2) * 82
    t(f'0{i + 1}', x, y - 6, 30, 'DisplayI', F); t(a, x + 46, y + 6, 9, 'SansSB', P, caps=True); para(b, x + 46, y - 4, 220, 11, 16)
rect(342, 62, 576, 66, P); t('Caption example', 362, 106, 8, 'SansSB', L, caps=True)
t('“A little colour, a lot of confidence. Grateful to the team who brought this story to life.”', 362, 82, 13, 'DisplayI', C)
end()

# --- 05 marks ---------------------------------------------------------------
page('Identity marks'); eyebrow('03 / The signature', M, 459); title('A name worth remembering.', M, 410)
rect(M, 190, 545, 180, C, stroke='#D9CFC6'); t('Idunuoluwa', 82, 290, 44, 'Display', P); t('Miracle', 80, 228, 56, 'DisplayI', P)
rect(618, 190, 300, 180, P); w = width('I', 'Display', 104) + width('M', 'DisplayI', 104) - 6
t('I', 768 - w / 2, 240, 104, 'Display', C); t('M', 768 - w / 2 + width('I', 'Display', 104) - 6, 240, 104, 'DisplayI', C)
t('Primary wordmark', M, 166, 8.5, 'SansSB', P, caps=True); t('Monogram', 618, 166, 8.5, 'SansSB', P, caps=True)
para('Clear space equals the height of the capital I on every side. Minimum width 140 px / 35 mm. Set “Miracle” in italic, one size up, tucked under the first name.', M, 150, 520, 11, 16)
para('Cream on plum or plum on cream, always one colour. Minimum 32 px / 10 mm. Never stretch, rotate, add effects or set over busy detail.', 618, 150, 300, 11, 16)
end()

# --- 06 colour --------------------------------------------------------------
page('Colour system'); eyebrow('04 / The palette', M, 459); title('Depth, warmth and a flash of colour.', M, 410, 34)
colours = [('Midnight Plum', P, 'Core'), ('Paper Cream', C, 'Core'), ('Fuchsia', F, 'Accent'),
           ('Dusted Rose', L, 'Support'), ('Terra', G, 'Accent'), ('Gele Violet', V, 'Photo accent')]
sw = (R - M - 5 * 16) / 6
for i, (name, col, role) in enumerate(colours):
    x = M + i * (sw + 16); rect(x, 250, sw, 120, col, stroke='#D9CFC6' if col == C else None)
    rgb = ', '.join(str(int(col[j:j + 2], 16)) for j in (1, 3, 5))
    t(name, x, 230, 8.5, 'SansSB', P, caps=True); t(col, x, 213, 11, 'Sans', P); t('RGB ' + rgb, x, 199, 8.5, 'Sans', P)
    t(role, x, 185, 8.5, 'Sans', G if col != G else P)
props = [(C, .52), (P, .26), (L, .1), (F, .06), (G, .03), (V, .03)]
x = M; t('Proportion', M, 152, 8.5, 'SansSB', P, caps=True)
for col, p in props: rect(x, 128, (R - M) * p, 14, col, stroke='#D9CFC6' if col == C else None); x += (R - M) * p
para(f'<b>Text on cream:</b> plum {contrast(P, C):.1f}:1 for everything. Fuchsia {contrast(F, C):.1f}:1 and terra {contrast(G, C):.1f}:1 '
     'pass only at 18 pt and above, so keep them for numerals, rules and large display type. Gele Violet lives in photography; '
     'use it to pick props and styling, not for interface text.', M, 108, R - M, 10.5, 16)
end()

# --- 07 typography ----------------------------------------------------------
page('Typography'); eyebrow('05 / Typography', M, 459); title('Editorial character, everyday clarity.', M, 410, 34)
t('Aa', M, 250, 110, 'Display', P); t('Bodoni MT', 230, 330, 28, 'Display', P)
para('<b>DISPLAY  /  REGULAR + ITALIC</b><br/>Names, headlines and short expressive lines. High contrast reads best large: 24 pt and up. Use italic for the second beat of a phrase.', 230, 310, 270, 10.5, 17)
line(530, 370, 530, 160, L); t('Aa', 560, 250, 96, 'SansL', P); t('Segoe UI', 735, 330, 28, 'SansL', P)
para('<b>SUPPORT  /  LIGHT, REGULAR, SEMIBOLD</b><br/>Body, credits and navigation. Left aligned, short lines. Caps labels at 8–9 pt semibold, tracked +8%.', 735, 310, 183, 10.5, 17)
line(M, 135, R, 135, L)
t('Hierarchy', M, 104, 8.5, 'SansSB', P, caps=True); t('Headline  /  32–58 pt', 180, 102, 16, 'Display', P)
t('Body  /  10.5–14 pt', 450, 102, 12, 'Sans', P); t('Label  /  8–9 pt', 690, 103, 8.5, 'SansSB', P, caps=True)
t('On the web: Bodoni Moda + Geist (Google Fonts) are the free equivalents.', M, 70, 9.5, 'Sans', G)
end()

# --- 08 collections overview ------------------------------------------------
page('The collections'); eyebrow('06 / The visual world', M, 459); title('Nine collections, one point of view.', M, 410, 34)
para(f'Every frame in the portfolio album, sorted by shoot and given a name. {sum(len(th["frames"]) for th in THEMES)} photographs, '
     f'{len(THEMES)} collections and {len(MOTION["frames"])} video clips. Each collection has its own page that follows.', M, 380, 560, 12, 18)
tw = (R - M - 8 * 10) / 9
for i, th in enumerate(THEMES):
    x = M + i * (tw + 10); photo(th['hero'], x, 178, tw, 140, fy=.25)
    t(f'{i + 1:02}', x, 160, 8.5, 'SansSB', P)
    para(th['name'], x, 152, tw, 11, 13, P, 'Display'); t(f'{len(th["frames"])} frames', x, 112, 8, 'Sans', G)
line(M, 90, R, 90, L)
t('In motion', M, 68, 8.5, 'SansSB', P, caps=True)
t(f'Frames {", ".join(map(str, MOTION["frames"]))} are video clips. Keep them for reels and stories; their posters stay out of print.', 140, 68, 10, 'Sans', K)
end()

# --- 09–17 one page per collection ------------------------------------------
for i, th in enumerate(THEMES):
    dark = th.get('dark', False); ink = C if dark else P; body = C if dark else K
    hero_left = i % 2 == 0
    hx, cx = (0, 400) if hero_left else (600, M)
    cw = 518
    page(f'Collection {i + 1:02}', dark, left=cx, right=cx + cw)
    photo(th['hero'], hx, 0, 360, 540, fx=.6, fy=.35, zoom=1.07)   # trims corner watermarks
    t(f'{i + 1:02}', cx + cw, 392, 64, 'DisplayI', F, align='r')
    eyebrow(f'Collection {i + 1:02}  /  {th["kicker"]}', cx, 459, dark)
    title(th['name'], cx, 410, 36, ink)
    para(th['line'], cx, 388, 420, 15, 21, ink, 'DisplayI')
    t('  ·  '.join(th['mood']), cx, 322, 9, 'SansSB', F if not dark else L, caps=True)
    t('Best for', cx, 296, 8, 'SansSB', ink, caps=True); para(th['best'], cx + 70, 305, 300, 10.5, 15, body)
    swatch_x = cx + 390
    for j, col in enumerate(palette_of([th['hero']] + th['picks'])):
        rect(swatch_x + j * 32, 290, 26, 18, col, stroke='#8A7D86')
    t('From the frames', swatch_x, 276, 7, 'Sans', ink, caps=True)
    t('Frames  ' + '  '.join(str(n) for n in th['frames']), cx, 256, 8, 'Sans', ink)
    picks = th['picks']; gap = 12; pw = (cw - gap * 2) / 3
    for j, n in enumerate(picks):
        photo(n, cx + j * (pw + gap), 62, pw, 172, fy=.3)
    if len(picks) < 3 and th.get('note'):
        nx = cx + len(picks) * (pw + gap)
        rect(nx, 62, pw, 172, L if not dark else '#3E2648')
        t('Note', nx + 14, 210, 8, 'SansSB', P if not dark else L, caps=True)
        para(th['note'], nx + 14, 196, pw - 28, 10.5, 15, P if not dark else C)
    elif th.get('note'):
        t('Note  ', cx, 40, 8, 'SansSB', F if not dark else L, caps=True)
        t(th['note'], cx + 40, 40, 9, 'Sans', body)
    end()

# --- 18 art direction -------------------------------------------------------
page('Photography & credits'); eyebrow('07 / Art direction', M, 459); title('Let the image breathe.', M, 410)
for i, (a, b) in enumerate([('Selection', 'Lead with one strong frame per story. Pair a full look with a portrait or detail; never run near-duplicates side by side.'),
                            ('Cropping', 'Protect faces, hands, headwear and the silhouette. A gele is never cut by the frame edge.'),
                            ('Colour', 'Keep skin tones natural. Preserve the richness of fabric and light; do not force every shoot into the palette.'),
                            ('Credits', 'Record photographer, styling, makeup, gele, video and brand for every frame. Confirm permissions before publishing.')]):
    x, y = M + (i % 2) * 270, 350 - (i // 2) * 130
    t(f'0{i + 1}', x, y - 8, 26, 'DisplayI', F); t(a, x + 40, y + 2, 9, 'SansSB', P, caps=True); para(b, x + 40, y - 8, 200, 10.5, 16)
    line(x, y - 92, x + 240, y - 92, L, .5)
photo(49, 600, 118, 176, 220, fx=.6, fy=.6, zoom=1.06); photo(49, 790, 118, 128, 128, fy=.35)
t('4:5 portrait', 600, 100, 8, 'SansSB', P, caps=True); t('1:1 square', 790, 100, 8, 'SansSB', P, caps=True)
t('Both crops keep the whole gele inside the frame.', 600, 80, 9.5, 'Sans', K)
end()

# --- 19 applications --------------------------------------------------------
page('Identity in use'); eyebrow('08 / Applications', M, 459); title('A system made to move.', M, 410)
rect(M, 95, 270, 280, P); photo(62, M + 110, 95, 160, 280, fy=.35)
t('Idunuoluwa', M + 14, 330, 17, 'Display', C); t('Miracle', M + 13, 306, 22, 'DisplayI', C); t('Portfolio', M + 14, 112, 7.5, 'SansSB', L, caps=True)
sx = M + 293; rect(sx, 95, 270, 280, L); photo(14, sx + 14, 130, 242, 231, fy=.15)
t('Colour has a voice.', sx + 14, 108, 15, 'DisplayI', P); t('@idunnuoluwam', sx + 256, 109, 7.5, 'SansSB', P, caps=True, align='r')
kx = M + 586; rect(kx, 95, 290, 280, C, stroke='#D9CFC6'); photo(53, kx, 255, 290, 120, fy=.45)
t('Idunuoluwa Miracle', kx + 18, 222, 18, 'Display', P); line(kx + 18, 210, kx + 272, 210, L)
t('Collaboration profile', kx + 18, 192, 8, 'SansSB', P, caps=True)
para('Fashion  /  Beauty  /  Lifestyle', kx + 18, 182, 250, 13, 18, P, 'DisplayI')
para('Editorial imagery and personal stories for thoughtful creative partnerships.', kx + 18, 156, 250, 10, 15)
t('Contact via Instagram', kx + 18, 112, 8, 'SansSB', P, caps=True)
for x, s in [(M, 'Portfolio cover'), (sx, 'Social post'), (kx, 'Media kit / sample')]: t(s, x, 74, 8, 'SansSB', P, caps=True)
end()

# --- 20 before sharing ------------------------------------------------------
page('Before sharing', dark=True, right=600); photo(66, 640, 0, 320, 540, fy=.3)
eyebrow('09 / The next chapter', M, 459, True); title('Make room for expression.', M, 410, 38, C)
para('A consistent signature, a flexible palette and nine collections that give each collaboration room to shine.', M, 380, 520, 15, 22, C, 'DisplayI')
checks = ['Confirm the biography, and the spelling of the handle (@idunnuoluwam) against the name.',
          'Credit photographers. Studio frames carry an “Empire” signature; clips carry “FnT Visuals”.',
          'Get consent from the second model before using Twin Crowns.',
          'Confirm the subject and the makeup credit for Soft Power in Sage.',
          'Clear the event branding in Runway on Campus with the organisers.',
          'Request full-resolution files for Ankara Sunday and Garden Reverie before print.']
for i, s in enumerate(checks):
    y = 300 - i * 36; rect(M, y - 2, 10, 10, P, stroke=L); para(s, M + 24, y + 10, 520, 10.5, 15, C)
t('Idunuoluwa Miracle  /  Brand identity guide', M, 43, 8.5, 'SansSB', L, caps=True)
end()

c.save()
print(OUT, PAGE[0], 'pages')
