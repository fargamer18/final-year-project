"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { facingToRotation, parseHouseDsl, type HouseDslShape } from "../lib/houseDsl";

type HouseModelViewportProps = {
  dslSource: string;
  embedded?: boolean;
};

const SHAPE_ORDER: Record<string, number> = {
  basement: 0,
  foundation: 1,
  floor: 2,
  wall: 3,
  door: 4,
  window: 5,
  balcony: 6,
  core: 7,
  roof: 8,
};

const TYPE_COLORS: Record<string, string> = {
  basement: "#140d1b",
  foundation: "#251836",
  floor: "#6d28d9",
  wall: "#2a1d45",
  door: "#7c4a21",
  window: "#d8b4fe",
  balcony: "#9f7aea",
  core: "#f472b6",
  roof: "#1b1326",
};

const AR_FEET_TO_METERS_SCALE = 0.3048;
const AR_MODEL_OFFSET_Z = -4;

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }

    const material = mesh.material;
    if (Array.isArray(material)) {
      material.forEach((item) => item.dispose());
    } else if (material) {
      material.dispose();
    }
  });
}

function createMaterial(shape: HouseDslShape) {
  const color = new THREE.Color(shape.color || TYPE_COLORS[shape.type.toLowerCase()] || "#9f7aea");
  const opacity = shape.opacity ?? (shape.type.toLowerCase() === "window" ? 0.68 : shape.type.toLowerCase() === "wall" ? 0.72 : 1);
  const transparent = opacity < 1;

  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: shape.roughness ?? (shape.type.toLowerCase() === "window" ? 0.12 : 0.82),
    metalness: shape.metallic ?? (shape.type.toLowerCase() === "window" ? 0.08 : 0.02),
    transparent,
    opacity,
    emissive: shape.emissive ? new THREE.Color(shape.emissive) : new THREE.Color(0x000000),
    emissiveIntensity: shape.emissive ? 0.18 : 0,
    side: THREE.DoubleSide,
  });

  if (shape.type.toLowerCase() === "window") {
    material.depthWrite = false;
  }

  return material;
}

function createMeshForShape(shape: HouseDslShape) {
  const type = shape.type.toLowerCase();
  const width = shape.width || 1;
  const height = shape.height || 1;
  const depth = shape.depth || 1;

  const geometry = new THREE.BoxGeometry(width, type === "roof" ? Math.max(0.45, height) : height, depth);
  const mesh = new THREE.Mesh(geometry, createMaterial(shape));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.renderOrder = type === "window" ? 3 : 1;

  if (shape.position) {
    mesh.position.set(shape.position[0], shape.position[1], shape.position[2]);
  }

  if (shape.rotation) {
    mesh.rotation.set(shape.rotation[0], shape.rotation[1], shape.rotation[2]);
  }

  return mesh;
}

function buildModelGroup(parsedModel: ReturnType<typeof parseHouseDsl>) {
  const group = new THREE.Group();
  const orderedShapes = [...parsedModel.shapes].sort((left, right) => {
    const leftOrder = SHAPE_ORDER[left.type.toLowerCase()] ?? 20;
    const rightOrder = SHAPE_ORDER[right.type.toLowerCase()] ?? 20;
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return (left.position?.[1] ?? 0) - (right.position?.[1] ?? 0);
  });

  orderedShapes.forEach((shape) => {
    group.add(createMeshForShape(shape));
  });

  group.rotation.y = facingToRotation(parsedModel.house.roadFacing || parsedModel.house.mainEntranceFacing);
  return group;
}

function frameCamera(camera: THREE.PerspectiveCamera, controls: OrbitControls, object: THREE.Object3D, embedded: boolean) {
  const bounds = new THREE.Box3().setFromObject(object);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z, 24);
  const distance = maxDimension * (embedded ? 1.5 : 1.9) + 18;

  camera.near = Math.max(0.1, maxDimension / 100);
  camera.far = Math.max(400, maxDimension * 16);
  camera.updateProjectionMatrix();

  camera.position.set(center.x + distance, center.y + distance * 0.72, center.z + distance * 0.95);
  controls.target.copy(center);
  controls.maxDistance = distance * 2.2;
  controls.minDistance = Math.max(18, maxDimension * 0.35);
  controls.update();
}

export function HouseModelViewport({ dslSource, embedded = false }: HouseModelViewportProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const groundRef = useRef<THREE.Mesh | null>(null);
  const gridRef = useRef<THREE.GridHelper | null>(null);
  const baseScaleRef = useRef<THREE.Vector3 | null>(null);
  const basePositionRef = useRef<THREE.Vector3 | null>(null);
  const [arSupported, setArSupported] = useState(false);
  const [arActive, setArActive] = useState(false);
  const [arStatus, setArStatus] = useState("");
  const parsedModel = useMemo(() => parseHouseDsl(dslSource), [dslSource]);
  const storeys = Math.max(1, parsedModel.house.storeys || parsedModel.shapes.filter((shape) => shape.type === "floor").length || 1);
  const hasBasement = parsedModel.house.hasBasement || parsedModel.shapes.some((shape) => shape.type === "basement");
  const hasLift = parsedModel.house.hasLift || parsedModel.shapes.some((shape) => shape.type === "core");
  const plotWidth = parsedModel.house.plotWidthFt;
  const plotDepth = parsedModel.house.plotDepthFt;
  const plotSpecified = Boolean(parsedModel.house.plotSpecified && plotWidth && plotDepth);

  useEffect(() => {
    let cancelled = false;

    const checkArSupport = async () => {
      if (typeof navigator === "undefined" || !navigator.xr || typeof navigator.xr.isSessionSupported !== "function") {
        if (!cancelled) {
          setArSupported(false);
          setArStatus("WebXR AR is not available in this browser");
        }
        return;
      }

      const supported = await navigator.xr.isSessionSupported("immersive-ar").catch(() => false);
      if (!cancelled) {
        setArSupported(supported);
        setArStatus(supported ? "" : "Immersive AR is not supported on this device");
      }
    };

    void checkArSupport();

    return () => {
      cancelled = true;
    };
  }, []);

  const restoreNormalView = () => {
    const modelGroup = modelGroupRef.current;
    if (!modelGroup) {
      return;
    }

    if (baseScaleRef.current) {
      modelGroup.scale.copy(baseScaleRef.current);
    }

    if (basePositionRef.current) {
      modelGroup.position.copy(basePositionRef.current);
    }

    if (groundRef.current) {
      groundRef.current.visible = true;
    }

    if (gridRef.current) {
      gridRef.current.visible = true;
    }

    if (controlsRef.current) {
      controlsRef.current.enabled = true;
      controlsRef.current.autoRotate = true;
    }
  };

  const toggleArSession = async () => {
    const renderer = rendererRef.current;
    const modelGroup = modelGroupRef.current;

    if (!renderer || !modelGroup) {
      setArStatus("The model is still loading.");
      return;
    }

    if (renderer.xr.isPresenting) {
      const session = renderer.xr.getSession();
      if (session) {
        try {
          await session.end();
        } catch {
          // Ignore session shutdown errors.
        }
      }
      return;
    }

    if (typeof navigator === "undefined" || !navigator.xr || typeof navigator.xr.isSessionSupported !== "function" || typeof navigator.xr.requestSession !== "function") {
      setArStatus("WebXR AR is not available in this browser");
      return;
    }

    const supported = arSupported || await navigator.xr.isSessionSupported("immersive-ar").catch(() => false);
    if (!supported) {
      setArStatus("Immersive AR is not supported on this device");
      return;
    }

    try {
      if (!baseScaleRef.current) {
        baseScaleRef.current = modelGroup.scale.clone();
      }

      if (!basePositionRef.current) {
        basePositionRef.current = modelGroup.position.clone();
      }

      const session = await navigator.xr.requestSession("immersive-ar", {
        optionalFeatures: ["local-floor", "dom-overlay"],
        domOverlay: containerRef.current ? { root: containerRef.current } : undefined,
      });

      session.addEventListener("end", () => {
        restoreNormalView();
        setArActive(false);
        setArStatus("AR session ended");
      }, { once: true });

      modelGroup.scale.setScalar(AR_FEET_TO_METERS_SCALE);
      modelGroup.position.set(0, 0, AR_MODEL_OFFSET_Z);

      if (groundRef.current) {
        groundRef.current.visible = false;
      }

      if (gridRef.current) {
        gridRef.current.visible = false;
      }

      renderer.xr.enabled = true;
      renderer.xr.setReferenceSpaceType("local-floor");
      renderer.xr.setSession(session);
      setArActive(true);
      setArStatus("AR session started");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      restoreNormalView();
      setArActive(false);
      setArStatus(`AR launch failed: ${message}`);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || parsedModel.shapes.length === 0) {
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#080a11");
    scene.fog = new THREE.Fog("#080a11", 90, 260);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType("local-floor");
    rendererRef.current = renderer;

    const getSize = () => ({
      width: Math.max(320, container.clientWidth || (embedded ? 560 : 760)),
      height: Math.max(240, container.clientHeight || (embedded ? 300 : 420)),
    });

    const initialSize = getSize();
    renderer.setSize(initialSize.width, initialSize.height, false);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.touchAction = "none";
    container.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(38, initialSize.width / initialSize.height, 0.1, 1000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4;

    const ambientLight = new THREE.HemisphereLight(0xf8ebff, 0x182033, 1.35);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.2);
    directionalLight.position.set(78, 126, 64);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.set(1024, 1024);
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0x9f7aea, 0.72);
    fillLight.position.set(-42, 48, -72);
    scene.add(fillLight);

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(260, 260),
      new THREE.MeshStandardMaterial({ color: 0x06070b, roughness: 1, metalness: 0 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    ground.receiveShadow = true;
    scene.add(ground);
    groundRef.current = ground;

    const grid = new THREE.GridHelper(260, 26, 0x8b5cf6, 0x263041);
    grid.position.y = 0.001;
    scene.add(grid);
    gridRef.current = grid;

    const modelGroup = buildModelGroup(parsedModel);
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;
    baseScaleRef.current = modelGroup.scale.clone();
    basePositionRef.current = modelGroup.position.clone();
    frameCamera(camera, controls, modelGroup, embedded);
    controlsRef.current = controls;

    const resize = () => {
      const { width, height } = getSize();
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(container);
    window.addEventListener("resize", resize);

    renderer.setAnimationLoop(() => {
      if (!renderer.xr.isPresenting) {
        controls.enabled = true;
        controls.autoRotate = true;
        controls.update();
      } else {
        controls.enabled = false;
      }
      renderer.render(scene, camera);
    });

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
      renderer.setAnimationLoop(null);
      controls.dispose();
      disposeObject(modelGroup);
      scene.clear();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      rendererRef.current = null;
      controlsRef.current = null;
      modelGroupRef.current = null;
      groundRef.current = null;
      gridRef.current = null;
    };
  }, [embedded, parsedModel]);

  return (
    <div className={`relative overflow-hidden rounded-[26px] border border-purple-400/15 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.16),rgba(6,8,12,0.98)_58%)] ${embedded ? "min-h-[290px]" : "min-h-[390px]"}`}>
      <div className="absolute inset-0 opacity-35" style={{ backgroundImage: "linear-gradient(rgba(168,85,247,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.08) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3 pointer-events-none">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-purple-200/70">3D viewport</p>
          <h4 className="mt-1 text-sm font-semibold text-white">DSL-driven 3D model</h4>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 text-[10px] uppercase tracking-[0.2em] text-gray-300 pointer-events-auto">
          <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-purple-100">{`G+${Math.max(0, storeys - 1)}`}</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{parsedModel.house.style}</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{parsedModel.house.roadFacing}</span>
          {!embedded && (
            <button
              type="button"
              onClick={() => void toggleArSession()}
              disabled={!arSupported && !arActive}
              className="rounded-full border border-purple-300/30 bg-purple-400/15 px-3 py-1 text-purple-50 transition hover:bg-purple-400/25 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-gray-400"
            >
              {arActive ? "Exit AR" : "View in AR"}
            </button>
          )}
          {arStatus && (
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-gray-300">
              {arStatus}
            </span>
          )}
        </div>
      </div>

      <div ref={containerRef} className="absolute inset-0" aria-label="DSL-driven 3D house model viewport" />

      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap gap-2 border-t border-white/8 px-4 py-3 pointer-events-none">
        <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-purple-100">{hasLift ? "Lift core" : "Stair core"}</span>
        <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-purple-100">{hasBasement ? "Basement included" : "No basement level"}</span>
        <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-purple-100">{`${parsedModel.shapes.length} DSL blocks`}</span>
        {plotSpecified ? (
          <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-purple-100">{`${plotWidth} × ${plotDepth} ft plot`}</span>
        ) : (
          <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-purple-100">No guessed plot size</span>
        )}
        <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-purple-100">Drag to orbit</span>
      </div>
    </div>
  );
}

export default HouseModelViewport;