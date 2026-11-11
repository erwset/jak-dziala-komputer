// Te same 32 bity czytane na rozne sposoby. Bez DOM, wiec da sie testowac w Node.
const dv = new DataView(new ArrayBuffer(4));

export const floatToBits = f => { dv.setFloat32(0, f); return dv.getUint32(0); };
export const bitsToFloat = u => { dv.setUint32(0, u >>> 0); return dv.getFloat32(0); };
export const bitsToInt = u => u | 0;          // liczba calkowita ze znakiem
export const bitsToUint = u => u >>> 0;       // liczba calkowita bez znaku
export const bitsToBytes = u => [u >>> 24, (u >>> 16) & 255, (u >>> 8) & 255, u & 255];

export const bitsToColor = u => { const [r, g, b, a] = bitsToBytes(u); return { r, g, b, a }; };
export const colorToBits = (r, g, b, a = 255) => ((r << 24) | (g << 16) | (b << 8) | a) >>> 0;

export const bitsToText = u => bitsToBytes(u).map(c => (c >= 32 && c < 127 ? String.fromCharCode(c) : '·')).join('');
export const textToBits = s => {
  let u = 0;
  for (let i = 0; i < 4; i++) u = (u << 8) | (i < s.length ? s.charCodeAt(i) & 255 : 32);
  return u >>> 0;
};

// Trzy pola liczby z przecinkiem: znak (1 bit), skala (8 bitow), cyfry (23 bity).
export const floatParts = u => ({ sign: u >>> 31, exp: (u >>> 23) & 255, mant: u & 0x7fffff });
