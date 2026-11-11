// Wspolna konfiguracja scen 3D (three.js): kamera, swiatlo, obracanie mysza, petla rysowania.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export { THREE };

// Podpis w scenie 3D: zawsze zwrocony do kamery, jasny tekst z ciemna obwodka (czytelny w obu motywach).
export function label(text, { size = 0.28, color = '#ffffff' } = {}) {
  const c = document.createElement('canvas'), ctx = c.getContext('2d'), px = 44;
  const font = `600 ${px}px "Segoe UI", system-ui, sans-serif`;
  ctx.font = font;
  c.width = Math.ceil(ctx.measureText(text).width) + 28; c.height = px + 28;
  ctx.font = font; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.lineWidth = 9; ctx.strokeStyle = 'rgba(12,16,24,.9)'; ctx.strokeText(text, 14, c.height / 2);
  ctx.fillStyle = color; ctx.fillText(text, 14, c.height / 2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
  sp.scale.set(size * c.width / c.height, size, 1);
  sp.renderOrder = 20;
  return sp;
}

export function makeScene(container, { cam = [3, 2.5, 4], target = [0, 0.5, 0], fov = 45, orbit = true, zoom = true } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  container.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.01, 500);
  camera.position.set(...cam);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x556070, 1.5));
  const sun = new THREE.DirectionalLight(0xffffff, 2.0);
  sun.position.set(4, 8, 5);
  scene.add(sun);

  let controls = null;
  if (orbit) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(...target);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.enableZoom = zoom;
    controls.update();
    // Na ekranie dotykowym przesuniecie palcem w pionie przewija strone, a w poziomie obraca scene.
    // Bez tego scena "lapalaby" palec i nie daloby sie przewinac strony dalej.
    if (window.matchMedia('(pointer: coarse)').matches) renderer.domElement.style.touchAction = 'pan-y';
  } else camera.lookAt(...target);

  const resize = () => {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    // Waski, pionowy kadr (telefon): poszerz kat widzenia tak, zeby scena miescila sie na szerokosc tak jak na komputerze.
    const REF = 1.4, half = Math.tan(fov * Math.PI / 360);
    camera.fov = camera.aspect >= REF ? fov : Math.min(105, Math.atan(half * REF / camera.aspect) * 360 / Math.PI);
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(container);
  resize();

  const frames = [];
  let visible = false, raf = 0, last = 0;
  const tick = t => {
    if (!visible) { raf = 0; return; }
    const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
    for (const f of frames) f(dt, t / 1000);
    controls && controls.update();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };
  new IntersectionObserver(es => {
    visible = es[0].isIntersecting;
    if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  }).observe(container);

  return { THREE, scene, camera, renderer, controls, sun, onFrame: f => frames.push(f) };
}
