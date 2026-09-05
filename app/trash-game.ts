import * as T from 'three';
export type GameAPI = {
  dispose: () => void;
  reset: () => void;
  nextLevel: () => void;
  mute: (v: boolean) => void;
};
type Update = Partial<{
  level: number;
  score: number;
  shots: number;
  made: number;
  power: number;
  message: string;
  transition: boolean;
  ready: boolean;
}>;
export function createGame(
  host: HTMLDivElement,
  onChange: (s: Update) => void,
): GameAPI {
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.setClearColor('#536b60');
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  host.appendChild(renderer.domElement);
  const scene = new T.Scene(),
    camera = new T.PerspectiveCamera(58, 1, 0.1, 150);
  camera.position.set(0, 2.25, 7.6);
  camera.lookAt(0, 1.35, -3);
  let room = new T.Group();
  scene.add(room);
  let level = 1,
    score = 0,
    shots = 0,
    made = 0,
    power = 42,
    yaw = 0,
    locked = false,
    muted = false,
    disposed = false;
  const bin = new T.Vector3(0, 0, -2.2),
    origin = new T.Vector3(0, 1.55, 5.8),
    gravity = 9.81;
  const radius = 0.13,
    binR = 0.49,
    binH = 0.88;
  const materials: T.Material[] = [];
  const mat = (c: T.ColorRepresentation, roughness = 0.75, metalness = 0) => {
    const m = new T.MeshStandardMaterial({ color: c, roughness, metalness });
    materials.push(m);
    return m;
  };
  const cream = mat('#d4d8cb'),
    dark = mat('#19382f'),
    metal = mat('#83928b', 0.3, 0.65),
    wood = mat('#815537'),
    black = mat('#172321');
  function mesh(
    g: T.BufferGeometry,
    m: T.Material,
    x = 0,
    y = 0,
    z = 0,
    parent: T.Object3D = room,
  ) {
    const o = new T.Mesh(g, m);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  }
  function box(
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    m: T.Material,
    parent: T.Object3D = room,
  ) {
    return mesh(new T.BoxGeometry(w, h, d), m, x, y, z, parent);
  }
  function cyl(
    x: number,
    y: number,
    z: number,
    rt: number,
    rb: number,
    h: number,
    m: T.Material,
    parent: T.Object3D = room,
  ) {
    return mesh(new T.CylinderGeometry(rt, rb, h, 32), m, x, y, z, parent);
  }
  function label(
    text: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    color = '#18372e',
    bg = '#d5d9cd',
  ) {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 256;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1024, 256);
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '50px Georgia';
    ctx.fillText(text, 512, 128);
    const tex = new T.CanvasTexture(c);
    const m = new T.MeshBasicMaterial({ map: tex });
    materials.push(m);
    return mesh(new T.PlaneGeometry(w, h), m, x, y, z);
  }
  function desk(x: number, z: number, rot = 0) {
    const g = new T.Group();
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    room.add(g);
    box(0, 0.88, 0, 2.4, 0.1, 1.25, cream, g);
    for (const a of [-1.06, 1.06])
      for (const b of [-0.46, 0.46])
        box(a, 0.43, b, 0.055, 0.86, 0.055, metal, g);
    box(0.65, 0.48, 0.06, 0.65, 0.75, 0.92, dark, g);
    for (let i = 0; i < 3; i++)
      box(0.65, 0.25 + i * 0.22, 0.526, 0.22, 0.018, 0.02, metal, g);
    box(-0.3, 1.07, -0.14, 0.5, 0.28, 0.4, cream, g);
    box(-0.3, 1.37, -0.25, 0.71, 0.52, 0.42, cream, g);
    box(-0.3, 1.38, -0.028, 0.58, 0.39, 0.02, black, g);
    const screen = mat('#358d78');
    screen.emissive = new T.Color('#2c9a78');
    screen.emissiveIntensity = 0.5;
    box(-0.3, 1.38, -0.012, 0.49, 0.3, 0.01, screen, g);
    for (let i = 0; i < 4; i++)
      box(
        -0.45 + (i % 2) * 0.22,
        1.3 + Math.floor(i / 2) * 0.13,
        -0.001,
        0.1,
        0.013,
        0.003,
        cream,
        g,
      );
    box(-0.3, 0.957, 0.35, 0.7, 0.04, 0.25, cream, g);
    for (let i = 0; i < 9; i++)
      box(-0.58 + i * 0.069, 0.982, 0.33, 0.04, 0.015, 0.16, dark, g);
    box(0.55, 0.95, 0.29, 0.36, 0.018, 0.43, mat('#edece0'), g);
    cyl(0.87, 1.03, -0.29, 0.085, 0.08, 0.22, cream, g);
    box(0, 0.53, 1.05, 0.6, 0.13, 0.6, dark, g);
    box(0, 0.87, 1.31, 0.64, 0.65, 0.1, dark, g);
    cyl(0, 0.25, 1.05, 0.045, 0.045, 0.5, metal, g);
    for (let i = 0; i < 5; i++) {
      const leg = box(0, 0.08, 1.05, 0.68, 0.04, 0.04, black, g);
      leg.rotation.y = (i * Math.PI) / 5;
    }
  }
  function buildRoom() {
    scene.remove(room);
    room.traverse((o) => {
      if (o instanceof T.Mesh) o.geometry.dispose();
    });
    room = new T.Group();
    scene.add(room);
    scene.fog = new T.Fog(level === 1 ? '#5b7064' : '#c9d5c8', 24, 75);
    const hemi = new T.HemisphereLight(
      level === 1 ? '#deeee3' : '#fff3d3',
      level === 1 ? '#526750' : '#729685',
      2,
    );
    room.add(hemi);
    const sun = new T.DirectionalLight(
      level === 1 ? '#eef4dc' : '#ffe5b1',
      level === 1 ? 2 : 3.3,
    );
    sun.position.set(-6, 10, level === 1 ? 4 : -9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, {
      left: -15,
      right: 15,
      top: 15,
      bottom: -15,
    });
    sun.shadow.bias = -0.001;
    room.add(sun);
    if (level === 1) {
      box(0, -0.12, -5, 30, 0.2, 40, mat('#365b49'));
      box(0, 3, -14, 30, 6, 0.25, cream);
      box(-12, 3, -4, 0.25, 6, 21, cream);
      box(12, 3, -4, 0.25, 6, 21, cream);
      box(0, 6, -4, 24, 0.12, 25, mat('#b8c8ba'));
      for (let x = -11; x < 12; x += 2) {
        box(x, 5.9, -4, 0.025, 0.035, 24, mat('#899f92'));
        for (let z = -14; z < 8; z += 2) {
          box(0, 5.9, z, 24, 0.035, 0.025, metal);
          if ((x + 11) % 4 === 0) {
            const light = mat('#f2ffe9');
            light.emissive = new T.Color('#e3f5dc');
            light.emissiveIntensity = 2;
            box(x, 5.87, z, 1.35, 0.04, 0.7, light);
          }
        }
      }
      for (let x = -10; x <= 10; x += 2)
        box(x, 0.01, -5, 0.013, 0.006, 35, mat('#315441'));
      for (let z = -15; z < 12; z += 2)
        box(0, 0.014, z, 24, 0.006, 0.012, mat('#3c624e'));
      box(0, 1.38, -6, 7.1, 1.35, 0.14, mat('#4a7061'));
      box(0, 1.38, -6, 0.15, 1.35, 3.6, mat('#4a7061'));
      desk(-1.7, -6.95, Math.PI);
      desk(1.7, -6.95, Math.PI);
      desk(-3, -4.7);
      desk(3, -4.7);
      desk(-7, -9, 0.25);
      desk(7, -9, -0.25);
      for (const x of [-10, 10]) {
        box(x, 1.35, -12, 1.7, 2.7, 0.75, mat('#99aaa0'));
        for (let i = 0; i < 4; i++) {
          box(x, 0.35 + i * 0.64, -11.6, 1.56, 0.57, 0.04, cream);
          box(x, 0.45 + i * 0.64, -11.565, 0.3, 0.035, 0.03, metal);
        }
      }
      box(0, 2.2, -13.82, 3, 3.7, 0.04, mat('#214c40'));
      label('L U M O N', 0, 3.12, -13.78, 2.7, 0.65, '#e0e7d3', '#214c40');
      label(
        'MACRODATA REFINEMENT',
        0,
        2.62,
        -13.77,
        2.6,
        0.3,
        '#d3ddca',
        '#214c40',
      );
      label(
        'Please enjoy each throw equally.',
        0,
        1.7,
        -13.77,
        2.5,
        0.3,
        '#d3ddca',
        '#214c40',
      );
    } else {
      scene.background = new T.Color('#afdbe1');
      box(0, -0.12, -4, 26, 0.2, 30, mat('#d2baa0'));
      for (let x = -12; x <= 12; x += 1.1)
        box(x, 0.002, -4, 0.02, 0.005, 29, mat('#b7a084'));
      box(-12, 4, -2, 0.25, 8, 25, mat('#e8dfcc'));
      box(12, 4, -2, 0.25, 8, 25, cream);
      box(0, 8, -2, 24, 0.15, 25, mat('#eddfc8'));
      box(0, 0.02, -5, 13, 0.04, 9, mat('#d7d2b9'));
      box(0, -0.28, -27, 100, 0.12, 35, mat('#e8d7af'));
      box(0, -0.2, -65, 180, 0.1, 65, mat('#49a9b4', 0.19, 0.25));
      for (let i = 0; i < 16; i++)
        box(
          Math.sin(i) * 9,
          -0.12,
          -43 - i * 2,
          60,
          0.02,
          0.07,
          mat('#bee5df'),
        );
      for (let x = -12; x <= 12; x += 4) {
        box(x, 4, -13, 0.09, 8, 0.1, black);
        box(x, 4, -12.98, 3.9, 0.025, 0.08, black);
      }
      box(0, 7.8, -13, 24, 0.12, 0.15, black);
      function sofa(x: number, z: number, r: number) {
        const g = new T.Group();
        g.position.set(x, 0, z);
        g.rotation.y = r;
        room.add(g);
        const fabric = mat('#eee5d1');
        box(0, 0.24, 0, 3.9, 0.25, 1.6, wood, g);
        for (let i = -1; i <= 1; i++) {
          const seat = box(i * 1.2, 0.52, 0.08, 1.16, 0.4, 1.35, fabric, g);
          seat.geometry = new T.BoxGeometry(1.16, 0.4, 1.35);
          box(i * 1.2, 1.0, -0.59, 1.17, 0.78, 0.34, fabric, g);
        }
        for (const xx of [-1.96, 1.96])
          box(xx, 0.66, 0, 0.34, 0.64, 1.63, fabric, g);
        for (const xx of [-1.3, 1.2]) {
          const pillow = box(
            xx,
            0.97,
            -0.23,
            0.62,
            0.62,
            0.19,
            mat(xx < 0 ? '#9c6342' : '#a6b19b'),
            g,
          );
          pillow.rotation.z = xx * 0.12;
          pillow.rotation.x = -0.2;
        }
      }
      sofa(-4.6, -5.5, 0.48);
      sofa(4.6, -6.8, -0.48);
      cyl(0, 0.4, -6, 1.48, 1.4, 0.18, mat('#977552'));
      cyl(0, 0.17, -6, 0.8, 0.65, 0.35, wood);
      box(0.2, 0.51, -6, 0.8, 0.04, 0.6, cream);
      cyl(-0.6, 0.66, -6, 0.12, 0.18, 0.35, mat('#684531'));
      for (const x of [-9, 9]) {
        cyl(x, 0.55, -10, 0.48, 0.33, 1.1, mat('#b9865a'));
        for (let i = 0; i < 12; i++) {
          const a = i * 2.4;
          const leaf = mesh(
            new T.SphereGeometry(1, 10, 6),
            mat(i % 2 ? '#477b4d' : '#698c52'),
            x + Math.sin(a) * 0.55,
            1.3 + i * 0.14,
            -10 + Math.cos(a) * 0.5,
          );
          leaf.scale.set(0.2, 0.9, 0.1);
          leaf.rotation.z = Math.sin(a) * 0.7;
        }
      }
      for (const x of [-5, 0, 5]) {
        cyl(x, 6.5, -5, 0.012, 0.012, 3, black);
        const shade = mesh(
          new T.SphereGeometry(0.7, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
          mat('#c3a678'),
          x,
          5,
          -5,
        );
        shade.scale.y = 0.6;
      }
    }
    const bm = mat(
      level === 1 ? '#88978e' : '#b98e56',
      0.4,
      level === 1 ? 0.6 : 0.45,
    );
    const shell = new T.CylinderGeometry(binR, binR * 0.78, binH, 48, 1, true);
    bm.side = T.DoubleSide;
    mesh(shell, bm, bin.x, binH / 2, bin.z);
    cyl(bin.x, 0.04, bin.z, binR * 0.78, binR * 0.78, 0.08, mat('#1b2923'));
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      const wire = box(
        bin.x + Math.sin(a) * 0.439,
        0.45,
        bin.z + Math.cos(a) * 0.439,
        0.015,
        0.76,
        0.015,
        level === 1 ? dark : wood,
      );
      wire.rotation.z = -Math.sin(a) * 0.11;
      wire.rotation.x = Math.cos(a) * 0.11;
    }
    for (let i = 0; i < 5; i++) {
      const ring = mesh(
        new T.TorusGeometry(0.39 + i * 0.022, 0.013, 6, 48),
        bm,
        bin.x,
        0.08 + i * 0.19,
        bin.z,
      );
      ring.rotation.x = Math.PI / 2;
    }
    const rim = mesh(
      new T.TorusGeometry(binR, 0.027, 10, 64),
      bm,
      bin.x,
      binH,
      bin.z,
    );
    rim.rotation.x = Math.PI / 2;
    const halo = mesh(
      new T.RingGeometry(0.65, 0.67, 64),
      new T.MeshBasicMaterial({
        color: '#d5ef7a',
        transparent: true,
        opacity: 0.5,
        side: T.DoubleSide,
      }),
      bin.x,
      0.012,
      bin.z,
    );
    halo.rotation.x = -Math.PI / 2;
  }
  buildRoom();
  const paperMat = mat('#f1f0de', 1);
  const geom = new T.IcosahedronGeometry(radius, 2);
  const attr = geom.getAttribute('position');
  for (let i = 0; i < attr.count; i++) {
    const v = new T.Vector3().fromBufferAttribute(attr, i);
    v.multiplyScalar(
      0.85 + 0.23 * (Math.sin(v.x * 370 + v.y * 180 + v.z * 230) * 0.5 + 0.5),
    );
    attr.setXYZ(i, v.x, v.y, v.z);
  }
  geom.computeVertexNormals();
  const held = mesh(geom, paperMat, origin.x, origin.y, origin.z, scene);
  held.scale.setScalar(1.5);
  const dots = new T.Group();
  scene.add(dots);
  const dotMat = new T.MeshBasicMaterial({
    color: '#e8f4af',
    transparent: true,
    opacity: 0.78,
  });
  for (let i = 0; i < 40; i++)
    mesh(new T.SphereGeometry(0.027, 6, 6), dotMat, 0, 0, 0, dots);
  type Ball = {
    mesh: T.Mesh;
    v: T.Vector3;
    age: number;
    scored: boolean;
    finished: boolean;
  };
  let ball: Ball | null = null;
  const resting: T.Mesh[] = [];
  function velocity() {
    const speed = 6 + power * 0.065;
    return new T.Vector3(
      Math.sin(yaw) * speed * 0.76,
      speed * 0.65,
      -Math.cos(yaw) * speed * 0.76,
    );
  }
  function arc() {
    const v = velocity();
    dots.children.forEach((o, i) => {
      const t = (i + 1) * 0.055;
      o.position.copy(origin).addScaledVector(v, t);
      o.position.y -= (gravity * t * t) / 2;
      o.visible = o.position.y > radius;
    });
  }
  function sound(win: boolean) {
    if (muted) return;
    try {
      const ac = new AudioContext();
      const osc = ac.createOscillator(),
        gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = win ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(win ? 660 : 130, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(
        win ? 1000 : 60,
        ac.currentTime + 0.15,
      );
      gain.gain.setValueAtTime(0.06, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.3);
      osc.start();
      osc.stop(ac.currentTime + 0.3);
      osc.onended = () => ac.close();
    } catch {}
  }
  function shoot() {
    if (locked || ball) return;
    shots++;
    onChange({ shots, message: ' ' });
    ball = {
      mesh: mesh(geom, paperMat, origin.x, origin.y, origin.z, scene),
      v: velocity(),
      age: 0,
      scored: false,
      finished: false,
    };
    held.visible = false;
    dots.visible = false;
  }
  function finish() {
    if (!ball) return;
    if (!ball.scored) {
      sound(false);
      onChange({
        message:
          ball.mesh.position.z < bin.z
            ? 'A little less power. Try again.'
            : 'So close. Adjust your aim and power.',
      });
    }
    resting.push(ball.mesh);
    if (resting.length > 16) scene.remove(resting.shift()!);
    ball = null;
    held.visible = !locked;
    dots.visible = !locked;
  }
  let start: { x: number; y: number; p: number; yaw: number } | null = null;
  const down = (e: PointerEvent) => {
    if (locked || ball) return;
    start = { x: e.clientX, y: e.clientY, p: power, yaw };
    renderer.domElement.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent) => {
    if (!start) return;
    yaw = T.MathUtils.clamp(
      start.yaw + (e.clientX - start.x) * 0.0025,
      -0.55,
      0.55,
    );
    power = T.MathUtils.clamp(start.p + (e.clientY - start.y) * 0.24, 0, 100);
    onChange({ power: Math.round(power) });
    arc();
  };
  const up = () => {
    if (!start) return;
    start = null;
    shoot();
  };
  const cancel = () => {
    start = null;
  };
  const key = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement)?.tagName === 'BUTTON') return;
    if (
      ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)
    ) {
      e.preventDefault();
      if (locked || ball) return;
      if (e.key === ' ') shoot();
      if (e.key === 'ArrowLeft') yaw -= 0.016;
      if (e.key === 'ArrowRight') yaw += 0.016;
      if (e.key === 'ArrowUp') power += 1;
      if (e.key === 'ArrowDown') power -= 1;
      yaw = T.MathUtils.clamp(yaw, -0.55, 0.55);
      power = T.MathUtils.clamp(power, 0, 100);
      arc();
      onChange({ power: Math.round(power) });
    }
  };
  renderer.domElement.addEventListener('pointerdown', down);
  renderer.domElement.addEventListener('pointermove', move);
  renderer.domElement.addEventListener('pointerup', up);
  renderer.domElement.addEventListener('pointercancel', cancel);
  window.addEventListener('keydown', key);
  function resize() {
    const w = host.clientWidth,
      h = host.clientHeight;
    camera.aspect = w / h;
    camera.fov = w < 700 ? 72 : 58;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  arc();
  onChange({ ready: true });
  const toolLifecycle = new AbortController();
  const context = (
    document as Document & {
      modelContext?: {
        registerTool: (tool: unknown, options: unknown) => void | Promise<void>;
      };
    }
  ).modelContext;
  if (context?.registerTool) {
    try {
      Promise.resolve(
        context.registerTool(
          {
            name: 'throw_paper_ball',
            description:
              'Aim and throw a paper ball in the current level. Power is 0–100 and angle is degrees from center.',
            inputSchema: {
              type: 'object',
              properties: {
                power: { type: 'number', minimum: 0, maximum: 100 },
                angle: { type: 'number', minimum: -30, maximum: 30 },
              },
              required: ['power', 'angle'],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false },
            execute: (input: unknown) => {
              const a = input as { power: number; angle: number };
              if (
                !a ||
                !Number.isFinite(a.power) ||
                !Number.isFinite(a.angle) ||
                a.power < 0 ||
                a.power > 100 ||
                Math.abs(a.angle) > 30
              )
                throw Error('Invalid power or angle');
              if (ball || locked)
                throw Error(
                  'Wait for the current shot or advance to the next level',
                );
              power = a.power;
              yaw = (a.angle * Math.PI) / 180;
              arc();
              onChange({ power });
              shoot();
              return { level, shots, power, angle: a.angle };
            },
          },
          { signal: toolLifecycle.signal },
        ),
      ).catch(() => {});
    } catch {}
  }
  let prev = performance.now(),
    acc = 0;
  const dt = 1 / 240;
  function step() {
    if (!ball) return;
    ball.age += dt;
    const p = ball.mesh.position,
      old = p.clone();
    p.addScaledVector(ball.v, dt);
    p.y -= (gravity * dt * dt) / 2;
    ball.v.y -= gravity * dt;
    ball.mesh.rotation.x += dt * 4;
    ball.mesh.rotation.z += dt * 2;
    const dx = p.x - bin.x,
      dz = p.z - bin.z,
      dist = Math.hypot(dx, dz);
    if (!ball.scored && ball.v.y < 0 && old.y > binH && p.y <= binH) {
      const t = (old.y - binH) / (old.y - p.y),
        cross = old.clone().lerp(p, t);
      if (
        Math.hypot(cross.x - bin.x, cross.z - bin.z) <
        binR - radius - 0.015
      ) {
        ball.scored = true;
        made++;
        score += 10;
        sound(true);
        onChange({ score, made, message: '+10  ·  Perfectly refined.' });
        if (score >= 100 && level === 1) {
          locked = true;
          onChange({ transition: true });
        }
      }
    }
    if (
      !ball.scored &&
      Math.abs(p.y - binH) < radius + 0.024 &&
      Math.abs(dist - binR) < radius + 0.025
    ) {
      const normal = new T.Vector3(dx, 0, dz).normalize();
      if (old.y > binH + radius * 0.5) {
        p.y = binH + radius + 0.025;
        ball.v.y = Math.abs(ball.v.y) * 0.38;
      } else {
        const d = ball.v.dot(normal);
        ball.v.addScaledVector(normal, -1.5 * d);
        p.addScaledVector(normal, 0.025);
      }
    }
    if (
      p.y < binH &&
      p.y > radius &&
      Math.abs(dist - binR * 0.88) < radius &&
      !ball.scored
    ) {
      const n = new T.Vector3(dx, 0, dz).normalize();
      if (ball.v.dot(n) < 0) {
        ball.v.addScaledVector(n, -1.45 * ball.v.dot(n));
        p.addScaledVector(n, 0.02);
      }
    }
    const floor = ball.scored ? 0.15 : radius;
    if (p.y < floor) {
      p.y = floor;
      ball.v.y = Math.abs(ball.v.y) * 0.28;
      ball.v.x *= 0.7;
      ball.v.z *= 0.7;
    }
    if (ball.age > 3.5 || (ball.age > 1.3 && ball.v.length() < 0.7)) finish();
  }
  function animate(now: number) {
    if (disposed) return;
    acc += Math.min((now - prev) / 1000, 0.05);
    prev = now;
    while (acc >= dt) {
      step();
      acc -= dt;
    }
    held.rotation.y = now * 0.0003;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
  function clear() {
    if (ball) {
      scene.remove(ball.mesh);
      ball = null;
    }
    resting.forEach((o) => scene.remove(o));
    resting.length = 0;
    start = null;
    held.visible = true;
    dots.visible = true;
    yaw = 0;
    power = 42;
    arc();
  }
  return {
    mute: (v) => {
      muted = v;
    },
    nextLevel: () => {
      if (level !== 1 || score < 100) return;
      level = 2;
      locked = false;
      clear();
      buildRoom();
      onChange({
        level,
        transition: false,
        power,
        message: 'Welcome to your outie era.',
      });
    },
    reset: () => {
      level = 1;
      score = shots = made = 0;
      locked = false;
      clear();
      buildRoom();
      onChange({
        level,
        score,
        shots,
        made,
        power,
        transition: false,
        message: 'Your outie would be proud.',
      });
    },
    dispose: () => {
      disposed = true;
      toolLifecycle.abort();
      observer.disconnect();
      window.removeEventListener('keydown', key);
      renderer.domElement.removeEventListener('pointerdown', down);
      renderer.domElement.removeEventListener('pointermove', move);
      renderer.domElement.removeEventListener('pointerup', up);
      renderer.domElement.removeEventListener('pointercancel', cancel);
      scene.traverse((o) => {
        if (o instanceof T.Mesh) o.geometry.dispose();
      });
      materials.forEach((m) => {
        if (m instanceof T.MeshBasicMaterial) m.map?.dispose();
        m.dispose();
      });
      dotMat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
