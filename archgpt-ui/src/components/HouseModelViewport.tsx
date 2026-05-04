"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { facingToRotation, parseHouseDsl, type HouseDslShape } from "../lib/houseDsl";
import { SpatialSolver, type ArchitecturalIR, type SpatialNode } from "../lib/spatialSolver";

type HouseModelViewportProps = {
  dslSource?: string;
  semanticIR?: ArchitecturalIR; // New prop for LLM-driven IR
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

function createFloorOutline(shape: HouseDslShape) {
  const width = (shape.width || 1) + 0.1;
  const height = Math.max(0.08, (shape.height || 1) + 0.04);
  const depth = (shape.depth || 1) + 0.1;
  const outlineGeometry = new THREE.EdgesGeometry(new THREE.BoxGeometry(width, height, depth));
  const outlineColor = new THREE.Color(shape.color || TYPE_COLORS[shape.type.toLowerCase()] || '#9f7aea').lerp(new THREE.Color('#1f172c'), 0.42);
  const outlineMaterial = new THREE.LineBasicMaterial({
    color: outlineColor,
    transparent: true,
    opacity: 0.96,
    depthTest: false,
    depthWrite: false,
  });

  const outline = new THREE.LineSegments(outlineGeometry, outlineMaterial);
  outline.position.y = 0.02;
  outline.renderOrder = 6;
  return outline;
}

function createPitchedRoofGeometry(width: number, height: number, depth: number): THREE.BufferGeometry {
  const hw = width / 2;
  const hd = depth / 2;
  const rh = Math.max(height, 2.5);
  const vertices = new Float32Array([
    -hw, 0, -hd,   hw, 0, -hd,   0, rh, -hd,
    -hw, 0, hd,    0, rh, hd,    hw, 0, hd,
    -hw, 0, -hd,   0, rh, -hd,   0, rh, hd,
    -hw, 0, -hd,   0, rh, hd,    -hw, 0, hd,
    hw, 0, -hd,    hw, 0, hd,    0, rh, hd,
    hw, 0, -hd,    0, rh, hd,    0, rh, -hd,
    -hw, 0, -hd,   -hw, 0, hd,   hw, 0, hd,
    -hw, 0, -hd,   hw, 0, hd,    hw, 0, -hd,
  ]);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
  geo.computeVertexNormals();
  return geo;
}

function createMeshForShape(shape: HouseDslShape) {
  const type = shape.type.toLowerCase();
  const width = shape.width || 1;
  const height = shape.height || 1;
  const depth = shape.depth || 1;
  const name = (shape.name || "").toLowerCase();

  let geometry: THREE.BufferGeometry;
  const isPitchedRoof = type === "roof" && (
    name.includes("pitched") || name.includes("gabled") || name.includes("farmhouse") ||
    name.includes("bungalow") || name.includes("a-frame") || name.includes("cottage") ||
    name.includes("sloped")
  );

  if (isPitchedRoof) {
    geometry = createPitchedRoofGeometry(width, Math.max(3, height), depth);
  } else {
    geometry = new THREE.BoxGeometry(width, type === "roof" ? Math.max(0.45, height) : height, depth);
  }

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

  if (type === "floor") {
    mesh.add(createFloorOutline(shape));
    mesh.renderOrder = 0;
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

function renderSemanticIR(ir: ArchitecturalIR, scene: THREE.Group) {
  const solver = new SpatialSolver();
  const resolvedNodes = solver.resolve(ir);

  resolvedNodes.forEach(node => {
    const geo = new THREE.BoxGeometry(node.dimensions.w, node.dimensions.h, node.dimensions.d);
    const mat = new THREE.MeshStandardMaterial({ 
      color: TYPE_COLORS[node.type] || '#ffffff',
      transparent: node.type === 'opening',
      opacity: node.type === 'opening' ? 0.3 : 1.0
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(node.position.x, node.position.y, node.position.z);
    scene.add(mesh);
  });
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

  camera.position.set(center.x + distance, center.y + distance * 0.88, center.z + distance * 0.92);
  controls.target.copy(center);
  controls.maxDistance = distance * 2.2;
  controls.minDistance = Math.max(18, maxDimension * 0.35);
  controls.update();
}

export function HouseModelViewport({ dslSource = "", semanticIR, embedded = false }: HouseModelViewportProps) {
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
  const [renderStatus, setRenderStatus] = useState<"idle" | "rendering" | "error">("idle");
  const [archScore, setArchScore] = useState<{ overall: number, circulation: number, daylight: number } | null>(null);

  const parsedModel = useMemo(() => {
    console.log("[Viewport] Parsing DSL source...");
    return parseHouseDsl(dslSource);
  }, [dslSource]);

  useEffect(() => {
    console.log("[Viewport] semanticIR updated:", semanticIR);
    if (semanticIR) {
      setRenderStatus("rendering");
    }
  }, [semanticIR]);
  
  // ... (rest of helper functions)
  const storeys = Math.max(1, parsedModel.house.storeys || parsedModel.shapes.filter((shape) => shape.type === "floor").length || 1);
  const hasBasement = parsedModel.house.hasBasement || parsedModel.shapes.some((shape) => shape.type === "basement");
  const hasLift = parsedModel.house.hasLift || parsedModel.shapes.some((shape) => shape.type === "core");
  const plotWidth = parsedModel.house.plotWidthFt;
  const plotDepth = parsedModel.house.plotDepthFt;
  const plotSpecified = Boolean(parsedModel.house.plotSpecified && plotWidth && plotDepth);

  useEffect(() => {
    let cancelled = false;
    const checkArSupport = async () => {
      if (typeof navigator === "undefined" || !navigator.xr) return;
      const supported = await navigator.xr.isSessionSupported("immersive-ar").catch(() => false);
      if (!cancelled) {
        setArSupported(supported);
        setArStatus(supported ? "" : "Immersive AR is not supported");
      }
    };
    void checkArSupport();
    return () => { cancelled = true; };
  }, []);

  const restoreNormalView = () => {
    const modelGroup = modelGroupRef.current;
    if (!modelGroup) return;
    if (baseScaleRef.current) modelGroup.scale.copy(baseScaleRef.current);
    if (basePositionRef.current) modelGroup.position.copy(basePositionRef.current);
    if (groundRef.current) groundRef.current.visible = true;
    if (gridRef.current) gridRef.current.visible = true;
    if (controlsRef.current) {
      controlsRef.current.enabled = true;
      controlsRef.current.autoRotate = true;
    }
  };

  const toggleArSession = async () => {
    const renderer = rendererRef.current;
    const modelGroup = modelGroupRef.current;
    if (!renderer || !modelGroup) return;
    if (renderer.xr.isPresenting) {
      await renderer.xr.getSession()?.end();
      return;
    }
    try {
      if (!baseScaleRef.current) baseScaleRef.current = modelGroup.scale.clone();
      if (!basePositionRef.current) basePositionRef.current = modelGroup.position.clone();
      const session = await navigator.xr.requestSession("immersive-ar", {
        optionalFeatures: ["local-floor", "dom-overlay"],
        domOverlay: containerRef.current ? { root: containerRef.current } : undefined,
      });
      session.addEventListener("end", () => {
        restoreNormalView();
        setArActive(false);
      }, { once: true });
      modelGroup.scale.setScalar(AR_FEET_TO_METERS_SCALE);
      modelGroup.position.set(0, 0, AR_MODEL_OFFSET_Z);
      if (groundRef.current) groundRef.current.visible = false;
      if (gridRef.current) gridRef.current.visible = false;
      renderer.xr.enabled = true;
      renderer.xr.setReferenceSpaceType("local-floor");
      renderer.xr.setSession(session);
      setArActive(true);
    } catch (error) {
      restoreNormalView();
      setArActive(false);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || (parsedModel.shapes.length === 0 && !semanticIR)) return;

    let animationFrameId: number;

    const init = () => {
      const scene = new THREE.Scene();
      const houseStyle = parsedModel.house.style || "contemporary";
      const isFarmhouse = houseStyle === "farmhouse" || houseStyle === "bungalow" || houseStyle === "cottage";
      scene.background = new THREE.Color(isFarmhouse ? "#0e0c09" : "#080a11");
      scene.fog = new THREE.Fog(isFarmhouse ? "#0e0c09" : "#080a11", 90, 280);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap; // Ensuring modern shadow map is used
      rendererRef.current = renderer;

      const getSize = () => ({
        width: container.clientWidth || (embedded ? 560 : 760),
        height: container.clientHeight || (embedded ? 300 : 420),
      });

      const initialSize = getSize();
      renderer.setSize(initialSize.width, initialSize.height, false);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      container.appendChild(renderer.domElement);

      const camera = new THREE.PerspectiveCamera(38, initialSize.width / initialSize.height, 0.1, 1000);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.4;
      controlsRef.current = controls;

      scene.add(new THREE.HemisphereLight(isFarmhouse ? 0xfff3e0 : 0xf8ebff, isFarmhouse ? 0x3e2a14 : 0x182033, 1.5));
      
      const sun = new THREE.DirectionalLight(0xffffff, 2.5);
      sun.position.set(78, 126, 64);
      sun.castShadow = true;
      scene.add(sun);

      const ground = new THREE.Mesh(new THREE.PlaneGeometry(320, 320), new THREE.MeshStandardMaterial({ color: isFarmhouse ? 0x1a1508 : 0x06070b }));
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);
      groundRef.current = ground;

      const grid = new THREE.GridHelper(320, 32, isFarmhouse ? 0x5d4037 : 0x8b5cf6, 0x263041);
      scene.add(grid);
      gridRef.current = grid;

      const modelGroup = semanticIR ? new THREE.Group() : buildModelGroup(parsedModel);
      if (semanticIR) renderSemanticIR(semanticIR, modelGroup);
      scene.add(modelGroup);
      modelGroupRef.current = modelGroup;

      frameCamera(camera, controls, modelGroup, embedded);

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      const handleResize = () => {
        const { width, height } = getSize();
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        cancelAnimationFrame(animationFrameId);
        disposeObject(modelGroup);
        renderer.dispose();
        if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
      };
    };

    // Delay init to next frame to avoid "Forced Layout" warning
    const cleanup = init();
    return cleanup;
  }, [embedded, parsedModel, semanticIR]);

  return (
    <div className={`relative overflow-hidden rounded-[26px] border border-purple-400/15 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.16),rgba(6,8,12,0.98)_58%)] ${embedded ? "min-h-[290px]" : "min-h-[390px]"}`}>
      <div className="absolute inset-0 opacity-35" style={{ backgroundImage: "linear-gradient(rgba(168,85,247,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.08) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
      <div ref={containerRef} className="absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap gap-2 border-t border-white/8 px-4 py-3 pointer-events-none text-white text-[10px] uppercase tracking-widest">
        <span>{hasLift ? "Lift core" : "Stair core"}</span>
        <span>•</span>
        <span>{hasBasement ? "Basement included" : "No basement"}</span>
      </div>
    </div>
  );
}

export default HouseModelViewport;
