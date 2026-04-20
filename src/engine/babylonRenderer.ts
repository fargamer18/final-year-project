declare const BABYLON: any; // Use the global BABYLON namespace
declare const CANNON: any; // Use the global CANNON namespace

interface Model {
    type: string;
    properties: Record<string, any>;
    children?: Model[];
}

export class BabylonRenderer {
    private scene: BABYLON.Scene;
    private physics: boolean = false;
    public sunLight: BABYLON.DirectionalLight | null = null;
    private hemiLight: BABYLON.HemisphericLight | null = null;
    private fillLight: BABYLON.HemisphericLight | null = null;
    private shadowGenerator: BABYLON.ShadowGenerator | null = null;
    private sceneGround: BABYLON.Mesh | null = null;
    private sceneGroundMaterial: BABYLON.PBRMaterial | null = null;
    private lightingPreset: 'day' | 'night' = 'day';

    constructor(scene: BABYLON.Scene) {
        this.scene = scene;
        this.physics = typeof CANNON !== 'undefined';
        this.setupEnvironment();
    }

    private setupEnvironment() {
        this.scene.clearColor = new BABYLON.Color4(0.08, 0.08, 0.09, 1);

        // Add a hemispheric light for soft overall illumination
        const hemiLight = new BABYLON.HemisphericLight(
            "hemiLight", 
            new BABYLON.Vector3(0, 1, 0), 
            this.scene
        );
        hemiLight.intensity = 0.34;
        hemiLight.groundColor = new BABYLON.Color3(0.1, 0.1, 0.12);
        this.hemiLight = hemiLight;

        // Add a directional sun light for shading definition
        const sunLight = new BABYLON.DirectionalLight(
            "sunLight",
            new BABYLON.Vector3(-0.35, -1, -0.25),
            this.scene
        );
        sunLight.intensity = 0.85;
        sunLight.position = new BABYLON.Vector3(60, 80, 45);
        this.sunLight = sunLight;

        const shadowGenerator = new BABYLON.ShadowGenerator(2048, sunLight);
        shadowGenerator.useBlurExponentialShadowMap = true;
        shadowGenerator.blurKernel = 24;
        shadowGenerator.setDarkness(0.3);
        this.shadowGenerator = shadowGenerator;

        // Add a small fill light for dark scenes
        const fillLight = new BABYLON.HemisphericLight(
            "fillLight",
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
        fillLight.intensity = 0.14;
        fillLight.groundColor = new BABYLON.Color3(0.03, 0.03, 0.04);
        this.fillLight = fillLight;

        const ground = BABYLON.MeshBuilder.CreateGround(
            "sceneGround",
            { width: 260, height: 260 },
            this.scene
        );
        ground.position.y = -0.03;
        ground.isPickable = false;
        ground.receiveShadows = true;

        const groundMaterial = new BABYLON.PBRMaterial("sceneGroundMaterial", this.scene);
        groundMaterial.albedoColor = new BABYLON.Color3(0.09, 0.1, 0.12);
        groundMaterial.metallic = 0;
        groundMaterial.roughness = 1;
        ground.material = groundMaterial;
        this.sceneGround = ground;
        this.sceneGroundMaterial = groundMaterial;

        this.scene.imageProcessingConfiguration.contrast = 1.15;
        this.scene.imageProcessingConfiguration.exposure = 1.05;
        this.applyLightingPreset('day');
    }

    public applyLightingPreset(preset: 'day' | 'night') {
        this.lightingPreset = preset;
        const isNight = preset === 'night';
        const sunPosition = isNight
            ? new BABYLON.Vector3(28, 38, 20)
            : new BABYLON.Vector3(60, 80, 45);

        this.scene.clearColor = isNight
            ? new BABYLON.Color4(0.04, 0.05, 0.08, 1)
            : new BABYLON.Color4(0.78, 0.88, 0.98, 1);

        if (this.hemiLight) {
            this.hemiLight.intensity = isNight ? 0.14 : 0.38;
            this.hemiLight.groundColor = isNight
                ? new BABYLON.Color3(0.03, 0.03, 0.04)
                : new BABYLON.Color3(0.16, 0.18, 0.2);
        }

        if (this.fillLight) {
            this.fillLight.intensity = isNight ? 0.22 : 0.12;
            this.fillLight.groundColor = isNight
                ? new BABYLON.Color3(0.08, 0.08, 0.1)
                : new BABYLON.Color3(0.05, 0.05, 0.06);
        }

        if (this.sunLight) {
            this.setSunPosition(sunPosition, isNight ? 0.22 : 0.85);
        }

        if (this.shadowGenerator) {
            this.shadowGenerator.setDarkness(isNight ? 0.42 : 0.24);
            this.shadowGenerator.blurKernel = isNight ? 18 : 24;
        }

        if (this.sceneGroundMaterial) {
            this.sceneGroundMaterial.albedoColor = isNight
                ? new BABYLON.Color3(0.05, 0.06, 0.08)
                : new BABYLON.Color3(0.1, 0.11, 0.13);
        }

        this.scene.imageProcessingConfiguration.contrast = isNight ? 1.22 : 1.12;
        this.scene.imageProcessingConfiguration.exposure = isNight ? 0.88 : 1.1;
    }

    private createSurfaceMaterial(name: string, color: BABYLON.Color3, roughness: number, metallic = 0, alpha = 1): BABYLON.PBRMaterial {
        const material = new BABYLON.PBRMaterial(name, this.scene);
        material.albedoColor = color;
        material.roughness = roughness;
        material.metallic = metallic;
        material.alpha = alpha;
        material.environmentIntensity = 0.9;
        material.directIntensity = 1.1;
        return material;
    }

    private createGlassMaterial(name: string, color: BABYLON.Color3, alpha = 0.38): BABYLON.StandardMaterial {
        const material = new BABYLON.StandardMaterial(name, this.scene);
        material.diffuseColor = color.scale(0.82);
        material.specularColor = new BABYLON.Color3(0.98, 0.99, 1.0);
        material.specularPower = 220;
        material.emissiveColor = color.scale(0.08);
        material.alpha = alpha;
        material.backFaceCulling = false;
        return material;
    }

    private polishMesh(mesh: BABYLON.Mesh, type: string) {
        const lowerType = type.toLowerCase();
        mesh.receiveShadows = true;

        if (this.shadowGenerator && !lowerType.includes('window') && !lowerType.includes('door')) {
            this.shadowGenerator.addShadowCaster(mesh, true);
        }

        if (typeof mesh.enableEdgesRendering === 'function' && (
            lowerType.includes('wall') ||
            lowerType.includes('floor') ||
            lowerType.includes('foundation') ||
            lowerType.includes('roof') ||
            lowerType.includes('slab')
        )) {
            mesh.enableEdgesRendering(0.95);
            mesh.edgesWidth = 0.8;
            mesh.edgesColor = new BABYLON.Color4(0.05, 0.05, 0.06, 0.28);
        }

        if (lowerType.includes('window')) {
            mesh.renderingGroupId = 2;
        }
    }

    public setSunPosition(position: BABYLON.Vector3, intensity: number) {
        if (!this.sunLight) {
            return;
        }

        this.sunLight.position = position;
        const direction = new BABYLON.Vector3(-position.x, -position.y, -position.z);
        if (direction.lengthSquared() === 0) {
            direction.set(0, -1, 0);
        }
        this.sunLight.direction = direction.normalize();
        this.sunLight.intensity = intensity;
    }

    render(model: Model): BABYLON.Mesh[] {
        try {
            if (!model || !model.type || !model.properties) {
                throw new Error('Invalid model: missing required properties');
            }

            console.log("Rendering model:", model.properties.name);
            const meshes = this.createMeshFromModel(model);
            if (!meshes) {
                throw new Error('Failed to create meshes');
            }

            const result = Array.isArray(meshes) ? meshes : [meshes];
            result.forEach(mesh => {
                if (!mesh) return;
                mesh.receiveShadows = true;
                
                // Apply custom color if provided
                if (model.properties.color && Array.isArray(model.properties.color)) {
                    const [r, g, b] = model.properties.color;
                    const material = mesh.material as any;
                    if (material) {
                        const color = new BABYLON.Color3(r, g, b);
                        if ('albedoColor' in material) {
                            material.albedoColor = color;
                        }
                        if ('diffuseColor' in material) {
                            material.diffuseColor = color;
                        }
                        if ('emissiveColor' in material && model.type.toLowerCase().includes('window')) {
                            material.emissiveColor = color.scale(0.1);
                        }
                    }
                }

                if (typeof model.properties.alpha === 'number' && mesh.material && 'alpha' in mesh.material) {
                    (mesh.material as any).alpha = model.properties.alpha;
                }

                this.polishMesh(mesh, model.type);
            });

            return result;
        } catch (error) {
            console.error('Error in render:', error);
            throw error;
        }
    }

    private createMeshFromModel(model: Model): BABYLON.Mesh | BABYLON.Mesh[] {
        try {
            const type = model.type.toLowerCase();
            switch (type) {
                case 'wall':
                    return this.createWall(
                        model.properties.width || 5,
                        model.properties.height || 4,
                        model.properties.depth || 0.3,
                        model.properties.position,
                        model.properties.name
                    );
                case 'floor':
                    return this.createFloor(
                        model.properties.width || 5,
                        model.properties.height || 0.1,
                        model.properties.depth || 5,
                        model.properties.position,
                        model.properties.name
                    );
                case 'door':
                    return this.createDoor(
                        model.properties.width || 1,
                        model.properties.height || 2.2,
                        model.properties.depth || 0.1,
                        model.properties.position,
                        model.properties.name
                    );
                case 'window':
                    return this.createWindow(
                        model.properties.width || 1,
                        model.properties.height || 1,
                        model.properties.depth || 0.1,
                        model.properties.position,
                        model.properties.name
                    );
                case 'foundation':
                    return this.createFoundation(
                        model.properties.width || 5,
                        model.properties.height || 0.5,
                        model.properties.depth || 5,
                        model.properties.position,
                        model.properties.name
                    );
                case 'roof':
                    return this.createRoof(
                        model.properties.width || 5,
                        model.properties.height || 2,
                        model.properties.depth || 5,
                        model.properties.position
                    );
                case 'house':
                    return this.createHouse(model.properties);
                default:
                    console.warn(`Unknown model type: ${type}, creating default box`);
                    const box = BABYLON.MeshBuilder.CreateBox(type, { 
                        width: model.properties.width || 1,
                        height: model.properties.height || 1,
                        depth: model.properties.depth || 1
                    }, this.scene);
                    if (model.properties.position) {
                        box.position = model.properties.position;
                    }
                    box.name = model.properties.name || type;
                    return box;
            }
        } catch (error) {
            console.error('Error in createMeshFromModel:', error);
            throw error;
        }
    }

    private createWall(width: number, height: number, depth: number, position?: any, name?: string): BABYLON.Mesh {
        try {
            const wall = BABYLON.MeshBuilder.CreateBox(name || "wall", {
                width: width,
                height: height,
                depth: depth
            }, this.scene);

            if (position) {
                if (position instanceof BABYLON.Vector3) {
                    wall.position = position;
                } else if (Array.isArray(position)) {
                    wall.position = new BABYLON.Vector3(position[0], position[1], position[2]);
                } else {
                    wall.position = new BABYLON.Vector3(
                        position.x || 0,
                        position.y || 0,
                        position.z || 0
                    );
                }
            }

            const accentLike = !!name && /rail|frame|parapet|canopy|trim|accent/i.test(name);
            const material = this.createSurfaceMaterial(
                `${name}_mat`,
                accentLike ? new BABYLON.Color3(0.78, 0.79, 0.82) : new BABYLON.Color3(0.72, 0.7, 0.67),
                accentLike ? 0.38 : 0.9,
                accentLike ? 0.32 : 0
            );
            wall.material = material;

            wall.computeWorldMatrix(true);
            return wall;
        } catch (error) {
            console.error('Error creating wall:', error);
            throw error;
        }
    }

    private createFloor(width: number, height: number, depth: number, position?: any, name?: string): BABYLON.Mesh {
        try {
            const floor = BABYLON.MeshBuilder.CreateBox(name || "floor", {
                width: width,
                height: height,
                depth: depth
            }, this.scene);

            if (position) {
                if (position instanceof BABYLON.Vector3) {
                    floor.position = position;
                } else if (Array.isArray(position)) {
                    floor.position = new BABYLON.Vector3(position[0], position[1], position[2]);
                }
            }

            let baseColor = new BABYLON.Color3(0.68, 0.66, 0.62);
            let roughness = 0.94;
            let metallic = 0;
            
            // Color coding for different spaces
            if (name && name.includes('verandah')) {
                baseColor = new BABYLON.Color3(0.5, 0.42, 0.34);
            } else if (name && name.includes('living')) {
                baseColor = new BABYLON.Color3(0.58, 0.52, 0.38);
            } else if (name && name.includes('kitchen')) {
                baseColor = new BABYLON.Color3(0.45, 0.55, 0.38);
            } else if (name && name.includes('bedroom')) {
                baseColor = new BABYLON.Color3(0.42, 0.5, 0.62);
            } else if (name && name.includes('master')) {
                baseColor = new BABYLON.Color3(0.38, 0.48, 0.62);
            } else if (name && name.includes('bathroom')) {
                baseColor = new BABYLON.Color3(0.5, 0.58, 0.64);
            } else if (name && name.includes('foundation')) {
                baseColor = new BABYLON.Color3(0.26, 0.26, 0.28);
            } else if (name && name.includes('slab')) {
                baseColor = new BABYLON.Color3(0.36, 0.36, 0.38);
            }
            if (name && /balcony|terrace|canopy/i.test(name)) {
                roughness = 0.62;
                metallic = 0.08;
                baseColor = new BABYLON.Color3(0.56, 0.56, 0.58);
            }
            const material = this.createSurfaceMaterial(`${name}_mat`, baseColor, roughness, metallic);
            
            floor.material = material;
            floor.computeWorldMatrix(true);
            return floor;
        } catch (error) {
            console.error('Error creating floor:', error);
            throw error;
        }
    }

    private createDoor(width: number, height: number, depth: number, position?: any, name?: string): BABYLON.Mesh {
        try {
            const door = BABYLON.MeshBuilder.CreateBox(name || "door", {
                width: width,
                height: height,
                depth: depth
            }, this.scene);

            if (position) {
                if (position instanceof BABYLON.Vector3) {
                    door.position = position;
                } else if (Array.isArray(position)) {
                    door.position = new BABYLON.Vector3(position[0], position[1], position[2]);
                }
            }

            const material = this.createSurfaceMaterial(`${name}_mat`, new BABYLON.Color3(0.42, 0.27, 0.18), 0.62, 0.02);
            door.material = material;

            door.computeWorldMatrix(true);
            return door;
        } catch (error) {
            console.error('Error creating door:', error);
            throw error;
        }
    }

    private createWindow(width: number, height: number, depth: number, position?: any, name?: string): BABYLON.Mesh {
        try {
            const window = BABYLON.MeshBuilder.CreateBox(name || "window", {
                width: width,
                height: height,
                depth: depth
            }, this.scene);

            if (position) {
                if (position instanceof BABYLON.Vector3) {
                    window.position = position;
                } else if (Array.isArray(position)) {
                    window.position = new BABYLON.Vector3(position[0], position[1], position[2]);
                }
            }

            const material = this.createGlassMaterial(`${name}_mat`, new BABYLON.Color3(0.63, 0.77, 0.85));
            window.material = material;

            window.computeWorldMatrix(true);
            return window;
        } catch (error) {
            console.error('Error creating window:', error);
            throw error;
        }
    }

    private createFoundation(width: number, height: number, depth: number, position?: any, name?: string): BABYLON.Mesh {
        try {
            const foundation = BABYLON.MeshBuilder.CreateBox(name || "foundation", {
                width: width,
                height: height,
                depth: depth
            }, this.scene);

            if (position) {
                if (position instanceof BABYLON.Vector3) {
                    foundation.position = position;
                } else if (Array.isArray(position)) {
                    foundation.position = new BABYLON.Vector3(position[0], position[1], position[2]);
                }
            }

            const material = this.createSurfaceMaterial(`${name}_mat`, new BABYLON.Color3(0.27, 0.27, 0.29), 0.98, 0);
            foundation.material = material;

            foundation.computeWorldMatrix(true);
            return foundation;
        } catch (error) {
            console.error('Error creating foundation:', error);
            throw error;
        }
    }

    private createRoof(width: number, height: number, depth: number, position?: BABYLON.Vector3): BABYLON.Mesh {
        try {
            const roofMesh = new BABYLON.Mesh("roof", this.scene);

            const positions = [
                // Front face
                -width/2, 0, depth/2,      // bottom left
                width/2, 0, depth/2,       // bottom right
                0, height, depth/2,        // top
                // Back face
                -width/2, 0, -depth/2,     // bottom left
                width/2, 0, -depth/2,      // bottom right
                0, height, -depth/2,       // top
            ];

            const indices = [
                0, 1, 2,    // front face
                3, 5, 4,    // back face
                0, 2, 5, 0, 5, 3,    // left side
                1, 4, 5, 1, 5, 2,    // right side
                0, 3, 4, 0, 4, 1     // bottom
            ];

            const normals: number[] = [];
            BABYLON.VertexData.ComputeNormals(positions, indices, normals);

            const vertexData = new BABYLON.VertexData();
            vertexData.positions = positions;
            vertexData.indices = indices;
            vertexData.normals = normals;
            vertexData.applyToMesh(roofMesh);

            if (position) {
                roofMesh.position = position;
            }

            const roofMaterial = this.createSurfaceMaterial("roofMaterial", new BABYLON.Color3(0.8, 0.2, 0.2), 0.76, 0.02);
            roofMesh.material = roofMaterial;

            return roofMesh;
        } catch (error) {
            console.error('Error creating roof:', error);
            throw error;
        }
    }

    private createHouse(properties: Record<string, any>): BABYLON.Mesh[] {
        try {
            console.log("Creating house with properties:", properties);
            const width = properties.width || 8;
            const height = properties.height || 6;
            const depth = properties.depth || 10;
            const wallThickness = properties.wallThickness || 0.3;

            // Create house root node to group all meshes
            const houseRoot = new BABYLON.TransformNode("house", this.scene);
            
            // Create a material for visualization
            const pbr = new BABYLON.PBRMaterial("houseMaterial", this.scene);
            pbr.metallic = 0.1;
            pbr.roughness = 0.5;
            pbr.albedoColor = new BABYLON.Color3(0.8, 0.8, 0.8);

            // Create ground/foundation first
            const foundation = BABYLON.MeshBuilder.CreateBox("foundation", {
                width: width + wallThickness * 2,
                height: 0.5,
                depth: depth + wallThickness * 2
            }, this.scene);
            
            foundation.position.y = -0.25;
            
            const foundationMaterial = new BABYLON.StandardMaterial("foundationMaterial", this.scene);
            foundationMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
            foundation.material = foundationMaterial;

            // Create walls with proper positions relative to the foundation
            const frontWall = this.createWall(
                width, 
                height, 
                wallThickness, 
                new BABYLON.Vector3(0, height/2, depth/2)
            );
            const backWall = this.createWall(
                width, 
                height, 
                wallThickness, 
                new BABYLON.Vector3(0, height/2, -depth/2)
            );
            const leftWall = this.createWall(
                wallThickness, 
                height, 
                depth, 
                new BABYLON.Vector3(-width/2, height/2, 0)
            );
            const rightWall = this.createWall(
                wallThickness, 
                height, 
                depth, 
                new BABYLON.Vector3(width/2, height/2, 0)
            );

            // Create the roof with proper dimensions and position
            const roof = this.createRoof(
                width + wallThickness * 2, 
                height/2, 
                depth + wallThickness * 2,
                new BABYLON.Vector3(0, height + height/4, 0)
            );

            // Create all meshes first
            const allMeshes = [foundation, frontWall, backWall, leftWall, rightWall, roof];
            
            // Setup physics before parenting
            allMeshes.forEach(mesh => {
                // Compute initial world matrix
                mesh.computeWorldMatrix(true);
            });

            // Apply materials and physics
            allMeshes.forEach(mesh => {
                const meshMaterial = pbr.clone(`${mesh.name}Material`);

                try {
                    if (mesh === roof) {
                        meshMaterial.albedoColor = new BABYLON.Color3(0.7, 0.2, 0.2); // Red for roof
                        if (this.scene.getPhysicsEngine()) {
                            mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
                                mesh,
                                BABYLON.PhysicsImpostor.BoxImpostor,
                                { mass: 1, restitution: 0.2, friction: 0.4 },
                                this.scene
                            );
                        }
                    } else if (mesh === foundation) {
                        meshMaterial.albedoColor = new BABYLON.Color3(0.4, 0.4, 0.4); // Dark gray for foundation
                        if (this.scene.getPhysicsEngine()) {
                            mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
                                mesh,
                                BABYLON.PhysicsImpostor.BoxImpostor,
                                { mass: 0, restitution: 0.9, friction: 0.5 },
                                this.scene
                            );
                        }
                    } else {
                        if (this.scene.getPhysicsEngine()) {
                            mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
                                mesh,
                                BABYLON.PhysicsImpostor.BoxImpostor,
                                { mass: 1, restitution: 0.9, friction: 0.5 },
                                this.scene
                            );
                        }
                    }
                } catch (e) {
                    console.warn(`Failed to create physics impostor for ${mesh.name}:`, e);
                }

                meshMaterial.roughness = 0.6;
                mesh.material = meshMaterial;
            });

            // Now parent all meshes after physics setup
            allMeshes.forEach(mesh => {
                mesh.parent = houseRoot;
            });

            // Position the entire house above ground
            houseRoot.position.y = 0.25;
            
            console.log("House created with", allMeshes.length, "meshes", allMeshes.map(m => ({ name: m.name, pos: m.position })));
            return allMeshes;
        } catch (error) {
            console.error('Error creating house:', error);
            throw error;
        }
    }
}

export default BabylonRenderer;
