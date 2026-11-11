import { initPage } from '../core/layout.js';
import { $, el } from '../core/util.js';
import { makeScene, THREE, label } from '../core/scene3d.js';
import { buildLattice, buildMosfet } from '../core/models3d.js';
import { LAYERS } from '../core/chapters.js';

initPage();

const S = makeScene($('#fly'), { orbit: false, fov: 42 });
const { scene, camera } = S;

// ---------- pomocniki do budowania modeli z pudelek ----------
let seed = 7;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;     // powtarzalna losowosc
const box = (g, w, h, d, color, pos, opts = {}) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color, roughness: 0.6, ...opts }));
  m.position.set(...pos); g.add(m); return m;
};
const tag = (g, text, pos, size = 0.16) => { const l = label(text, { size }); l.position.set(...pos); g.add(l); };

function sandTexture() {
  const c = document.createElement('canvas'); c.width = 640; c.height = 360;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1b2230'; ctx.fillRect(0, 0, 640, 360);
  ctx.fillStyle = '#566173'; ctx.fillRect(60, 316, 520, 8);
  for (let i = 0; i < 1500; i++) {
    const x = (rand() + rand() + rand()) / 3 * 420 + 110, peak = 316 - (1 - Math.abs(x - 320) / 210) * 190;
    const y = peak + rand() * (316 - peak);
    ctx.fillStyle = `hsl(${34 + rand() * 8}, ${55 + rand() * 15}%, ${52 + rand() * 16}%)`;
    ctx.beginPath(); ctx.arc(x, y, 3.2, 0, 7); ctx.fill();
  }
  for (let i = 0; i < 40; i++) { ctx.fillStyle = '#d9a95b'; ctx.beginPath(); ctx.arc(320 + (rand() - 0.5) * 12, 20 + rand() * 110, 3, 0, 7); ctx.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---------- osiem przystankow ----------
const STAGES = [
  {
    name: 'Biurko', scale: '2 metry', layer: 0, cam: [0.9, 1.35, 3.3], look: [0, 0.55, 0], focus: [-0.2, 0.62, -0.31],
    text: 'Tu zaczęliśmy: na ekranie sypie się piasek. To, co naprawdę do Ciebie dociera, to światło z milionów maleńkich punktów. Zbliżmy się do ekranu. <i>(Rozdział „To, co widzisz")</i>',
    build(g) {
      box(g, 3.4, 0.08, 1.7, 0x8b6b4c, [0, -0.04, 0]);
      box(g, 1.7, 1.0, 0.06, 0x20262f, [-0.35, 0.78, -0.35]);
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.58, 0.88), new THREE.MeshBasicMaterial({ map: sandTexture() }));
      scr.position.set(-0.35, 0.78, -0.315); g.add(scr);
      box(g, 0.1, 0.3, 0.1, 0x20262f, [-0.35, 0.15, -0.4]); box(g, 0.55, 0.03, 0.3, 0x20262f, [-0.35, 0.015, -0.4]);
      box(g, 0.45, 0.95, 0.95, 0x2b323d, [1.2, 0.475, -0.2]);
      box(g, 0.04, 0.04, 0.01, 0x35c46b, [1.05, 0.85, 0.28], { emissive: 0x35c46b });
      box(g, 0.95, 0.03, 0.32, 0x2b323d, [-0.35, 0.015, 0.42]); box(g, 0.14, 0.04, 0.22, 0x2b323d, [0.45, 0.02, 0.42]);
    },
  },
  {
    name: 'Piksele', scale: '5 milimetrów', layer: 0, cam: [0, 0, 5.4], look: [0, 0, 0], focus: [0.45, -0.45, 0],
    text: 'Ekran z bardzo bliska. Każdy piksel to trzy lampki: czerwona, zielona i niebieska. Jasne piksele to piasek, ciemne to tło. O jasności każdej lampki decydują trzy liczby z bufora obrazu. Żeby zobaczyć, skąd się te liczby biorą, zajrzyjmy do obudowy komputera. <i>(Rozdział „Z powrotem na ekran")</i>',
    build(g) {
      const cols = 16, rows = 9, pitch = 0.32;
      const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.075, 0.27, 0.02), new THREE.MeshBasicMaterial(), cols * rows * 3);
      const m = new THREE.Matrix4(), col = new THREE.Color();
      let i = 0;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const sand = r > 7.5 - Math.max(0, 6 - Math.abs(c - 8)) * 1.1, b = 0.82 + rand() * 0.18;
        const rgb = sand ? [0.84 * b, 0.64 * b, 0.33 * b] : [0.1, 0.13, 0.19];
        for (let k = 0; k < 3; k++) {
          m.setPosition((c - cols / 2 + 0.5) * pitch + (k - 1) * 0.095, (rows / 2 - 0.5 - r) * pitch, 0);
          mesh.setMatrixAt(i, m);
          mesh.setColorAt(i++, col.setRGB(k === 0 ? rgb[0] : 0, k === 1 ? rgb[1] : 0, k === 2 ? rgb[2] : 0));
        }
      }
      g.add(mesh);
    },
  },
  {
    name: 'Płyta główna', scale: '40 centymetrów', layer: 3, cam: [1.6, 2.7, 3.3], look: [0, 0, 0], focus: [-0.4, 0.16, -0.1],
    text: 'Wnętrze komputera. Na zielonej płycie siedzą: procesor (pod srebrną osłoną), kości pamięci RAM i karta graficzna, połączone setkami cienkich ścieżek. W pamięci leżą liczby wszystkich ziaren i program, który je zmienia. <i>(Rozdziały „Ziarnko jako dane" i „Pamięć jako adresy")</i>',
    build(g) {
      box(g, 3.2, 0.06, 2.5, 0x1e6a48, [0, 0, 0]);
      box(g, 0.8, 0.06, 0.8, 0x9099a6, [-0.4, 0.06, -0.1]);
      box(g, 0.56, 0.05, 0.56, 0xc9cfd8, [-0.4, 0.115, -0.1], { metalness: 0.7, roughness: 0.3 });
      for (let i = 0; i < 4; i++) box(g, 0.05, 0.32, 1.3, 0x2d3440, [0.55 + i * 0.14, 0.19, -0.1]);
      box(g, 2.0, 0.55, 0.1, 0x2b323d, [-0.3, 0.3, 0.95]);
      box(g, 0.5, 0.35, 0.3, 0x8a94a3, [-1.3, 0.2, -1.0], { metalness: 0.5 });
      for (let i = 0; i < 9; i++) {
        const c = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 12), new THREE.MeshStandardMaterial({ color: 0x3a4250 }));
        c.position.set(-1.35 + (i % 3) * 0.16, 0.1, -0.4 + Math.floor(i / 3) * 0.2); g.add(c);
      }
      tag(g, 'procesor', [-0.4, 0.5, -0.1]); tag(g, 'pamięć RAM', [0.78, 0.65, -0.1]); tag(g, 'karta graficzna', [-0.3, 0.85, 0.95]);
    },
  },
  {
    name: 'Procesor', scale: '2 centymetry', layer: 4, cam: [0, 2.3, 2.3], look: [0, 0, 0.1], focus: [-0.54, 0.1, -0.5],
    text: 'Pod metalową osłoną jest płytka krzemu wielkości paznokcia. Duży pomarańczowy obszar to pamięć podręczna. Turkusowe prostokąty to rdzenie: każdy z nich to osobny „pracownik", który w kółko pobiera, odczytuje i wykonuje polecenia. Wlećmy do jednego z nich. <i>(Rozdział „Procesor")</i>',
    build(g) {
      box(g, 2.4, 0.06, 2.4, 0x2a6b52, [0, 0, 0]);
      box(g, 1.6, 0.05, 1.6, 0x39465c, [0, 0.055, 0]);
      const y = 0.087;
      for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) box(g, 0.3, 0.012, 0.26, 0x2fb6c9, [-0.54 + i * 0.36, y, -0.5 + j * 0.32]);
      box(g, 1.42, 0.012, 0.3, 0xe08a2c, [0, y, 0.17]);
      box(g, 0.9, 0.012, 0.34, 0x9a55d6, [-0.26, y, 0.55]); box(g, 0.44, 0.012, 0.34, 0x8a94a3, [0.49, y, 0.55]);
      tag(g, 'rdzenie', [0.2, 0.3, -0.4], 0.13); tag(g, 'pamięć podręczna', [0, 0.26, 0.17], 0.13); tag(g, 'grafika', [-0.26, 0.24, 0.6], 0.13);
    },
  },
  {
    name: 'Fragment rdzenia', scale: '5 tysięcznych milimetra', layer: 5, cam: [1.9, 2.3, 2.9], look: [0, 0, 0], focus: [0.08, 0.07, 0.02],
    text: 'Rdzeń z bliska przypomina miasto. Na dole rzędy bramek, nad nimi kilkanaście pięter metalowych połączeń (tu widać dwa). Gdzieś w tym tłumie jest sumator: czterdzieści kilka bramek, przez które przechodzą liczby każdego ziarnka. <i>(Rozdział „Liczenie z bramek")</i>',
    build(g) {
      box(g, 3.3, 0.05, 2.5, 0x39465c, [0, 0, 0]);
      const cols = [0x2fb6c9, 0x3d9df2, 0x2fa67c, 0x4f86c9];
      for (let j = 0; j < 7; j++) {
        let x = -1.55;
        while (x < 1.45) {
          const w = 0.12 + rand() * 0.3;
          box(g, w, 0.06, 0.24, cols[Math.floor(rand() * 4)], [x + w / 2, 0.055, -1.0 + j * 0.33]);
          x += w + 0.03;
        }
      }
      for (let i = 0; i < 18; i++) { const len = 0.6 + rand() * 2; box(g, len, 0.025, 0.035, 0xd9903d, [(rand() - 0.5) * (3 - len), 0.13, -1.1 + rand() * 2.2], { metalness: 0.6 }); }
      for (let i = 0; i < 16; i++) { const len = 0.5 + rand() * 1.6; box(g, 0.035, 0.025, len, 0xe8b25c, [-1.5 + rand() * 3, 0.175, (rand() - 0.5) * (2.3 - len)], { metalness: 0.6 }); }
    },
  },
  {
    name: 'Jedna bramka', scale: '300 nanometrów', layer: 6, cam: [1.7, 2.5, 3.0], look: [0, 0.05, 0], focus: [-0.45, 0.12, 0.6],
    text: 'Jedna bramka NIE-I. Dwa srebrne paski to przewody wejściowe: każdy przechodzi nad dwoma tranzystorami naraz, jednym typu P (różowy obszar) i jednym typu N (niebieski). Razem cztery tranzystory, dokładnie jak na schemacie. <i>(Rozdziały „Bramki logiczne" i „Tranzystory")</i>',
    build(g) {
      box(g, 3.2, 0.12, 2.5, 0x5d4a70, [0, 0, 0]);
      box(g, 2.3, 0.02, 0.8, 0xd06a92, [0, 0.07, -0.6]); box(g, 2.3, 0.02, 0.8, 0x2f86e0, [0, 0.07, 0.6]);
      for (const x of [-0.45, 0.45]) box(g, 0.14, 0.1, 2.15, 0xc9cfd8, [x, 0.13, 0], { metalness: 0.6, roughness: 0.35 });
      box(g, 3.0, 0.05, 0.14, 0xd9903d, [0, 0.26, -1.12], { metalness: 0.6 }); box(g, 3.0, 0.05, 0.14, 0xd9903d, [0, 0.26, 1.12], { metalness: 0.6 });
      box(g, 0.12, 0.05, 1.5, 0xe8b25c, [1.05, 0.26, -0.15], { metalness: 0.6 });
      tag(g, 'plus', [-1.3, 0.5, -1.12]); tag(g, 'minus', [-1.3, 0.5, 1.12]); tag(g, 'wyjście', [1.35, 0.5, -0.1]);
      tag(g, 'wejście A', [-0.45, 0.55, 0]); tag(g, 'wejście B', [0.45, 0.55, 0]);
      tag(g, 'typ P', [-0.95, 0.22, -0.6], 0.14); tag(g, 'typ N', [-0.95, 0.22, 0.6], 0.14);
    },
  },
  {
    name: 'Tranzystor', scale: '100 nanometrów', layer: 7, cam: [0.5, 1.2, 4.7], look: [0, -0.3, 0], focus: [0, -0.06, 0.75],
    text: 'Jeden tranzystor w przekroju. Patrz na bramkę: gdy rozjaśnia się na pomarańczowo, rośnie na niej napięcie. Pod izolatorem zbierają się wtedy elektrony i tworzą most między źródłem a drenem. Most jest: jedynka. Mostu nie ma: zero. <i>(Rozdział „Krzem i elektrony")</i>',
    build(g) {
      const mos = buildMosfet(); g.add(mos.group);
      return (dt, t) => mos.update(dt, t, Math.min(1, Math.max(0, 0.5 + 0.8 * Math.sin(t * 0.9))));
    },
  },
  {
    name: 'Atomy', scale: '1 nanometr', layer: 8, cam: [2.4, 1.7, 2.9], look: [0, 0, 0], focus: [0, 0, 0],
    text: 'Dno. Kryształ krzemu: każdy atom trzyma czterech sąsiadów, a między nimi przemykają pojedyncze wolne elektrony (niebieskie). Niżej nie ma już nic, co miałoby znaczenie dla komputera. Wszystko, co widziałeś po drodze, jest zbudowane z tego.',
    build(g) {
      const lat = buildLattice(2); g.add(lat.group);
      const es = Array.from({ length: 6 }, () => {
        const e = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), new THREE.MeshBasicMaterial({ color: 0x3aa0ff }));
        e.position.set(rand() * 2.4 - 1.2, rand() * 2 - 1, rand() * 2 - 1); e.userData.v = 0.5 + rand() * 0.6; g.add(e); return e;
      });
      return (dt, t) => {
        g.rotation.y = t * 0.15;
        for (const e of es) { e.position.x += e.userData.v * dt; e.position.y += Math.sin(t * 3 + e.userData.v * 9) * dt * 0.2; if (e.position.x > 1.3) e.position.x = -1.3; }
      };
    },
  },
];

const groups = STAGES.map(st => {
  const g = new THREE.Group();
  st.update = st.build(g);
  g.visible = false; scene.add(g); return g;
});

// ---------- sterowanie ----------
const slider = $('#depth'), fade = $('#fade');
let current = -1, goal = null, speed = 0.45;
const stops = STAGES.map((st, i) => {
  const b = el('button', { onclick: () => { goal = null; slider.value = i; } }, `${i + 1}. ${st.name}`);
  b.style.setProperty('--c', LAYERS[st.layer].color);
  $('#stops').append(b); return b;
});

function enter(i) {
  if (current >= 0) {                       // krotkie zaciemnienie maskuje przeskok miedzy scenami
    fade.style.transition = 'none'; fade.style.opacity = 1; void fade.offsetWidth;
    fade.style.transition = ''; fade.style.opacity = 0;
  }
  current = i;
  groups.forEach((g, k) => { g.visible = k === i; });
  stops.forEach((b, k) => b.classList.toggle('on', k === i));
  $('#hudN').textContent = i + 1; $('#hudName').textContent = STAGES[i].name; $('#hudScale').textContent = STAGES[i].scale;
  $('#say').innerHTML = `<b>${i + 1}. ${STAGES[i].name}.</b> ${STAGES[i].text}`;
}

enter(0);

const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
S.onFrame((dt, t) => {
  let s = Number(slider.value);
  if (goal != null) {
    const step = speed * dt * Math.sign(goal - s);
    s = Math.abs(goal - s) <= Math.abs(step) ? goal : s + step;
    slider.value = s;
    if (s === goal) goal = null;
  }
  const i = Math.min(7, Math.floor(s)), f = i === 7 ? 0 : s - i;
  if (i !== current) enter(i);
  const st = STAGES[i], e = Math.pow(f, 2.2);
  a.set(...st.cam); b.set(...st.focus);
  c.subVectors(a, b).normalize().multiplyScalar(0.16).add(b);          // punkt tuz przed celem
  camera.position.lerpVectors(a, c, e);
  camera.position.x += Math.sin(t * 0.4) * 0.05 * (1 - e);              // lekkie kolysanie, zeby scena zyla
  a.set(...st.look).lerp(b, Math.min(1, e * 1.6));
  camera.lookAt(a);
  st.update && st.update(dt, t);
});

$('#down').onclick = () => { speed = 0.45; goal = Math.min(7, Math.floor(Number(slider.value)) + 1); };
$('#up').onclick = () => { speed = 1.2; goal = Math.max(0, Math.ceil(Number(slider.value)) - 1); };
$('#tour').onclick = () => { slider.value = 0; speed = 0.3; goal = 7; };
slider.addEventListener('input', () => { goal = null; });
