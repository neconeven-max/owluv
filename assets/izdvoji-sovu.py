# -*- coding: utf-8 -*-
"""Izdvaja glavu sove iz assets/sovaweb_logo.svg u assets/sovaweb_owl.png.
   Logotip je SVG s ugradenom PNG slikom u base64. Ovdje se ta slika dekodira
   rucno (bez vanjskih knjiznica), izreze se pravokutnik u kojem je samo glava
   sove - bez natpisa i bez mreze ispod nje - i zapise kao novi PNG."""
import base64, re, struct, zlib, os

SVG = 'assets/sovaweb_logo.svg'
OUT = 'assets/sovaweb_owl.png'
BOX = (22, 22, 112, 111)   # x0, y0, x1, y1 u izvornoj slici 500x194

s = open(SVG, encoding='utf-8').read()
m = re.search(r'base64,([A-Za-z0-9+/=]+)', s)
data = base64.b64decode(m.group(1))

pos = 8; idat = b''
while pos < len(data):
    ln = struct.unpack('>I', data[pos:pos+4])[0]
    typ = data[pos+4:pos+8]
    ch = data[pos+8:pos+8+ln]
    if typ == b'IHDR':
        W, H, bitd, colt = struct.unpack('>IIBB', ch[:10])
    elif typ == b'IDAT':
        idat += ch
    pos += 12 + ln
assert bitd == 8 and colt == 6, 'ocekujem 8-bitni RGBA PNG'
bpp = 4; stride = W * bpp
raw = zlib.decompress(idat)

# skidanje filtera po redovima
out = bytearray(); prev = bytearray(stride); i = 0
for y in range(H):
    f = raw[i]; i += 1
    line = bytearray(raw[i:i+stride]); i += stride
    for x in range(stride):
        a = line[x-bpp] if x >= bpp else 0
        b = prev[x]
        c = prev[x-bpp] if x >= bpp else 0
        if f == 1: line[x] = (line[x] + a) & 255
        elif f == 2: line[x] = (line[x] + b) & 255
        elif f == 3: line[x] = (line[x] + ((a + b) >> 1)) & 255
        elif f == 4:
            p = a + b - c; pa = abs(p-a); pb = abs(p-b); pc = abs(p-c)
            pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
            line[x] = (line[x] + pr) & 255
    out += line; prev = line

x0, y0, x1, y1 = BOX
w = x1 - x0; h = y1 - y0
crop = bytearray()
for y in range(y0, y1):
    crop.append(0)                      # filter 0
    o = y * stride + x0 * bpp
    crop += out[o:o + w * bpp]

def chunk(t, d):
    c = t + d
    return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c) & 0xffffffff)

png = b'\x89PNG\r\n\x1a\n'
png += chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))
png += chunk(b'IDAT', zlib.compress(bytes(crop), 9))
png += chunk(b'IEND', b'')
open(OUT, 'wb').write(png)
print(OUT, w, 'x', h, os.path.getsize(OUT), 'B')
