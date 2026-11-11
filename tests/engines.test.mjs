// Uruchom:  node --test tests
import test from 'node:test';
import assert from 'node:assert/strict';
import * as bits from '../js/core/bits.js';
import { Circuit, makeAdder } from '../js/core/logic-sim.js';
import { Cpu, OP, enc, dec, SAND_PROGRAM } from '../js/core/cpu-sim.js';

test('float <-> bity zgadza sie z Float32Array', () => {
  const f = new Float32Array(1), u = new Uint32Array(f.buffer);
  for (const x of [0, 1, -1, 1.5, 0.1, -273.15, 3.4e38, 1e-40, Infinity]) {
    f[0] = x;
    assert.equal(bits.floatToBits(x), u[0]);
    assert.equal(bits.bitsToFloat(u[0]), f[0]);
  }
  assert.deepEqual(bits.floatParts(bits.floatToBits(1.5)), { sign: 0, exp: 127, mant: 0x400000 });
});

test('inne odczytania tych samych bitow', () => {
  assert.equal(bits.bitsToInt(0xffffffff), -1);
  assert.equal(bits.bitsToUint(0xffffffff), 4294967295);
  assert.equal(bits.bitsToText(bits.textToBits('PIAS')), 'PIAS');
  assert.deepEqual(bits.bitsToColor(bits.colorToBits(214, 164, 85)), { r: 214, g: 164, b: 85, a: 255 });
});

test('sumator z bramek: wszystkie pary liczb 8-bitowych', () => {
  const adder = makeAdder(8);
  assert.equal(adder.gateCount, 40);
  for (let a = 0; a < 256; a++) for (let b = 0; b < 256; b++) {
    const r = adder.add(a, b);
    assert.equal(r.sum, (a + b) & 255);
    assert.equal(r.carry, a + b > 255 ? 1 : 0);
  }
});

test('zatrzask z dwoch bramek pamieta bit', () => {
  const c = new Circuit();
  c.input('S'); c.input('R');
  c.gate('Q', 'NOR', 'R', 'Qn');
  c.gate('Qn', 'NOR', 'S', 'Q');
  c.set('S', 1).settle(); c.set('S', 0).settle();
  assert.equal(c.get('Q'), 1, 'po ustawieniu pamieta 1');
  c.set('R', 1).settle(); c.set('R', 0).settle();
  assert.equal(c.get('Q'), 0, 'po skasowaniu pamieta 0');
});

test('procesor: kodowanie polecen', () => {
  assert.equal(enc(OP.WEZ, 12), 0b00011100);
  assert.deepEqual(dec(0b00101101), { op: 2, addr: 13, name: 'DODAJ' });
});

test('procesor: program z piaskiem przesuwa oba ziarnka w kazdym obiegu', () => {
  const cpu = new Cpu(SAND_PROGRAM);
  for (let i = 0; i < 7; i++) cpu.step();           // jeden pelny obieg petli
  assert.equal(cpu.mem[12], 13); assert.equal(cpu.mem[14], 45);
  assert.equal(cpu.pc, 0); assert.equal(cpu.ticks, 21);
  for (let i = 0; i < 7; i++) cpu.step();
  assert.equal(cpu.mem[12], 16); assert.equal(cpu.mem[14], 50);
});

test('procesor: odejmowanie, skok warunkowy i stop', () => {
  // odliczaj od 3 do 0, potem stop
  const cpu = new Cpu([enc(OP.WEZ, 14), enc(OP.ODEJMIJ, 15), enc(OP.ZAPISZ, 14), enc(OP.SKOCZ_GDY_ZERO, 5), enc(OP.SKOCZ, 0), enc(OP.STOP),
    0, 0, 0, 0, 0, 0, 0, 0, 3, 1]);
  let guard = 0;
  while (!cpu.halted && guard++ < 200) cpu.step();
  assert.ok(cpu.halted);
  assert.equal(cpu.mem[14], 0);
});
