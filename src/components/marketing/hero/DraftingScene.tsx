"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SCOPE_STEPS } from "@/components/marketing/scopeStack";
import { paintSheet, type SheetMode } from "./sheetArt";

/* ---------------------------------------------------------------------------
 * The drafting object (DESIGN.md §2.2, §5).
 *
 * Four paper slabs — one per document in the scope stack — held in space. It is
 * not decoration: the object *is* the process the studio sells, and the
 * blueprint toggle redraws the same four documents as a technical drawing,
 * which is the one place the studio-black register opens.
 *
 * Constraints this file lives inside:
 *  - No runtime asset fetches. Geometry and printed text are generated here, so
 *    `default-src 'self'` holds and there is no model or texture to download.
 *  - Lazy. This module only ever loads on a capable desktop (see HeroStage).
 *  - DPR-capped, and the render loop stops the moment the hero leaves the
 *    viewport. Under prefers-reduced-motion it is never mounted at all.
 * ------------------------------------------------------------------------- */

const SHEET_W = 2.36;
const SHEET_H = 1.84;
const SHEET_T = 0.03;
const CORNER = 0.06;

const COUNT = SCOPE_STEPS.length;
const HALF = (COUNT - 1) / 2;

/** Sheet offsets at rest — a tight stack, like the CSS fallback. */
const REST = { x: 0.125, y: 0.125, z: 0.16 };
/** Sheet offsets in blueprint mode — the same stack, pulled apart. */
const OPEN = { x: 0.15, y: 0.15, z: 0.3 };

/** The camera dollies back as the stack opens, so the fan always fits the frame. */
const CAM_Z = { closed: 5.55, open: 6.15 };

const BASE_RX = 0.1;
const BASE_RY = -0.24;

const INK = "#0b0f17";
const COBALT = "#5f74ff";
const PAPER = "#ffffff";
const STUDIO = "#0a0e16";

const INK_COLOR = new THREE.Color(INK);
const COBALT_COLOR = new THREE.Color(COBALT);
const PAPER_COLOR = new THREE.Color(PAPER);
const STUDIO_COLOR = new THREE.Color(STUDIO);

const damp = (current: number, target: number, lambda: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function createSlab(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  const x = -SHEET_W / 2;
  const y = -SHEET_H / 2;
  shape.moveTo(x + CORNER, y);
  shape.lineTo(x + SHEET_W - CORNER, y);
  shape.quadraticCurveTo(x + SHEET_W, y, x + SHEET_W, y + CORNER);
  shape.lineTo(x + SHEET_W, y + SHEET_H - CORNER);
  shape.quadraticCurveTo(x + SHEET_W, y + SHEET_H, x + SHEET_W - CORNER, y + SHEET_H);
  shape.lineTo(x + CORNER, y + SHEET_H);
  shape.quadraticCurveTo(x, y + SHEET_H, x, y + SHEET_H - CORNER);
  shape.lineTo(x, y + CORNER);
  shape.quadraticCurveTo(x, y, x + CORNER, y);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: SHEET_T,
    bevelEnabled: false,
    curveSegments: 8,
  });
  geometry.translate(0, 0, -SHEET_T / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function createFaceTexture(index: number, mode: SheetMode): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(paintSheet(index, mode));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function Stack({ blueprint }: { blueprint: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const sheetRefs = useRef<(THREE.Group | null)[]>([]);
  const bodyRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const edgeRefs = useRef<(THREE.LineBasicMaterial | null)[]>([]);
  const paperRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const blueRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  const openRef = useRef(blueprint ? 1 : 0);
  const restRef = useRef({ x: BASE_RX, y: BASE_RY });
  const aimRef = useRef({ x: 0, y: 0 });

  const geometry = useMemo(() => createSlab(), []);
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry, 1), [geometry]);
  const faceGeometry = useMemo(() => new THREE.PlaneGeometry(SHEET_W, SHEET_H), []);
  const paperMaps = useMemo(() => SCOPE_STEPS.map((_, i) => createFaceTexture(i, "paper")), []);
  const blueMaps = useMemo(() => SCOPE_STEPS.map((_, i) => createFaceTexture(i, "blueprint")), []);

  const gl = useThree((state) => state.gl);

  // Two-way parallax. Listening on the window (not the canvas) keeps the object
  // responding while the pointer is over the toggle sitting in front of it.
  useEffect(() => {
    const canvas = gl.domElement;
    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      aimRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      aimRef.current.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    };
    const onLeave = () => {
      aimRef.current.x = 0;
      aimRef.current.y = 0;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, [gl]);

  useEffect(
    () => () => {
      geometry.dispose();
      edges.dispose();
      faceGeometry.dispose();
      for (const map of paperMaps) map.dispose();
      for (const map of blueMaps) map.dispose();
    },
    [geometry, edges, faceGeometry, paperMaps, blueMaps],
  );

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const group = groupRef.current;
    if (!group) return;

    const open = (openRef.current = damp(openRef.current, blueprint ? 1 : 0, 5.5, dt));

    // Rest pose drifts on a very slow sine so the object is alive, never busy.
    const aimY = BASE_RY + aimRef.current.x * 0.16 + Math.sin(t * 0.33) * 0.028;
    const aimX = BASE_RX - aimRef.current.y * 0.11 + Math.sin(t * 0.26 + 1.7) * 0.015;
    group.rotation.set(
      (restRef.current.x = damp(restRef.current.x, aimX, 4.5, dt)),
      (restRef.current.y = damp(restRef.current.y, aimY, 4.5, dt)),
      0,
    );

    // The fan widens as the blueprint register opens; the stack breathes either way.
    const spreadX = mix(REST.x, OPEN.x, open);
    const spreadY = mix(REST.y, OPEN.y, open);
    const spreadZ = mix(REST.z, OPEN.z, open);
    group.position.y = Math.sin(t * 0.5) * 0.022;

    // Dolly back with the fan so the opened stack never leaves the frame.
    state.camera.position.z = mix(CAM_Z.closed, CAM_Z.open, open);

    for (let i = 0; i < COUNT; i++) {
      const sheet = sheetRefs.current[i];
      if (!sheet) continue;
      const k = i - HALF;
      sheet.position.set(k * spreadX, k * spreadY, -k * spreadZ);

      const body = bodyRefs.current[i];
      const edge = edgeRefs.current[i];
      const paper = paperRefs.current[i];
      const blue = blueRefs.current[i];
      if (!body || !edge || !paper || !blue) continue;

      body.color.lerpColors(PAPER_COLOR, STUDIO_COLOR, open);
      body.roughness = mix(0.92, 0.62, open);
      edge.color.lerpColors(INK_COLOR, COBALT_COLOR, open);
      edge.opacity = mix(0.15, 0.85, open);
      // Aerial perspective: the sheets receding into the stack sit a little
      // deeper than the one in front, so the stack reads as depth, not as a
      // single flat card.
      paper.color.setScalar(mix(1 - 0.06 * i, 1, open));
      paper.opacity = 1 - open;
      blue.opacity = open;
      blue.roughness = mix(0.7, 0.55, open);
    }
  });

  return (
    <group ref={groupRef} rotation={[BASE_RX, BASE_RY, 0]}>
      {SCOPE_STEPS.map((step, i) => (
        <group
          key={step.n}
          ref={(element) => {
            sheetRefs.current[i] = element;
          }}
        >
          <mesh geometry={geometry} castShadow receiveShadow>
            <meshStandardMaterial
              ref={(material) => {
                bodyRefs.current[i] = material;
              }}
              color={PAPER}
              roughness={0.92}
              metalness={0}
            />
          </mesh>

          <lineSegments geometry={edges}>
            <lineBasicMaterial
              ref={(material) => {
                edgeRefs.current[i] = material;
              }}
              color={INK}
              transparent
              opacity={0.13}
            />
          </lineSegments>

          {/* Paper face, then the blueprint drawing over it: two maps, one
              crossfade, so the toggle reads as the same document redrawn. */}
          <mesh geometry={faceGeometry} position={[0, 0, SHEET_T / 2 + 0.0026]} renderOrder={1}>
            <meshStandardMaterial
              ref={(material) => {
                paperRefs.current[i] = material;
              }}
              map={paperMaps[i]}
              roughness={0.9}
              metalness={0}
              transparent
              depthWrite={false}
            />
          </mesh>

          <mesh geometry={faceGeometry} position={[0, 0, SHEET_T / 2 + 0.0018]} renderOrder={2}>
            <meshStandardMaterial
              ref={(material) => {
                blueRefs.current[i] = material;
              }}
              map={blueMaps[i]}
              roughness={0.7}
              metalness={0}
              transparent
              opacity={0}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export default function DraftingScene({
  blueprint,
  frameloop,
}: {
  blueprint: boolean;
  frameloop: "always" | "demand";
}) {
  return (
    <Canvas
      frameloop={frameloop}
      shadows
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", toneMapping: THREE.NeutralToneMapping }}
      camera={{ position: [0, 0, CAM_Z.closed], fov: 30, near: 0.1, far: 40 }}
      onCreated={({ gl }) => {
        gl.setClearAlpha(0);
      }}
    >
      {/* One warm key (the art direction's single studio lamp), one cool fill,
          one white rim to hold the paper edges. */}
      <ambientLight intensity={1.25} />
      <directionalLight
        position={[2, 5.6, 4.4]}
        intensity={3.6}
        color="#fff1dc"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
        shadow-radius={6}
        shadow-camera-left={-2.8}
        shadow-camera-right={2.8}
        shadow-camera-top={2.8}
        shadow-camera-bottom={-2.8}
        shadow-camera-near={2}
        shadow-camera-far={12}
      />
      <directionalLight position={[-4.6, 1.2, 3.4]} intensity={0.9} color="#d6e2ff" />
      <directionalLight position={[0.8, -2.6, -3.8]} intensity={1.5} />

      <Stack blueprint={blueprint} />

      {/* Contact shadow only — no visible floor, so the stack reads as sitting on
          the page rather than floating over it. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.14, 0]} receiveShadow>
        <planeGeometry args={[9, 9]} />
        <shadowMaterial transparent opacity={0.1} />
      </mesh>
    </Canvas>
  );
}
