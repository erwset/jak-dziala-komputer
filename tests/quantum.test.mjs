import test from 'node:test';
import assert from 'node:assert/strict';
import { zero, apply, cnot, probs, sample, bloch } from '../js/core/quantum.js';

const close = (a, b) => a.forEach((x, i) => assert.ok(Math.abs(x - b[i]) < 1e-9, `${a} != ${b}`));

test('jeden kubit: X odwraca, H daje pol na pol', () => {
  close(probs(apply(zero(1), 'X')), [0, 1]);
  close(probs(apply(zero(1), 'H')), [0.5, 0.5]);
});

test('interferencja: H dwa razy wraca do zera, a H Z H daje jedynke', () => {
  close(probs(apply(apply(zero(1), 'H'), 'H')), [1, 0]);
  close(probs(apply(apply(apply(zero(1), 'H'), 'Z'), 'H')), [0, 1]);
});

test('strzalka na kuli', () => {
  close(bloch(zero(1)), [0, 0, 1]);
  close(bloch(apply(zero(1), 'X')), [0, 0, -1]);
  close(bloch(apply(zero(1), 'H')), [1, 0, 0]);
  close(bloch(apply(apply(zero(1), 'H'), 'Z')), [-1, 0, 0]);
});

test('splatanie: H i CNOT daja tylko 00 albo 11', () => {
  const bell = cnot(apply(zero(2), 'H', 0), 0, 1);
  close(probs(bell), [0.5, 0, 0, 0.5]);
  for (let i = 0; i < 200; i++) assert.ok([0, 3].includes(sample(bell)));
});

test('dwie niezalezne monety: cztery wyniki po rowno', () => {
  close(probs(apply(apply(zero(2), 'H', 0), 'H', 1)), [0.25, 0.25, 0.25, 0.25]);
});

test('CNOT nie rusza celu, gdy kubit sterujacy to 0, i odwraca, gdy to 1', () => {
  close(probs(cnot(zero(2), 0, 1)), [1, 0, 0, 0]);
  close(probs(cnot(apply(zero(2), 'X', 0), 0, 1)), [0, 0, 0, 1]);
});
