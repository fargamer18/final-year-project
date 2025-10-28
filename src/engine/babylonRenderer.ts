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

    constructor(scene: BABYLON.Scene) {
        this.scene = scene;
        this.physics = typeof CANNON !== 'undefined';
        this.setupEnvironment();
    }

    private setupEnvironment() {
        // Add a hemispheric light for better overall illumination
        const hemiLight = new BABYLON.HemisphericLight(
            "hemiLight", 
            new BABYLON.Vector3(0, 1, 0), 
            this.scene
        );
        hemiLight.intensity = 0.7;

        // Add directional light for better definition
        const dirLight = new BABYLON.DirectionalLight(
            "dirLight",
            new BABYLON.Vector3(-1, -2, -1),
            this.scene
        );
        dirLight.intensity = 0.5;

        // Add ambient light for fill
        const ambientLight = new BABYLON.HemisphericLight(
            "ambientLight",
            new BABYLON.Vector3(0, 1, 0),
            this.scene
        );
        ambientLight.intensity = 0.3;
    }

    render(model: Model): BABYLON.Mesh[] {
        try {
            if (!model || !model.type || !model.properties) {
                throw new Error('Invalid model: missing required properties');
            }

            console.log("Rendering model:", model);
            const meshes = this.createMeshFromModel(model);
            if (!meshes) {
                throw new Error('Failed to create meshes');
            }

            const result = Array.isArray(meshes) ? meshes : [meshes];
            result.forEach(mesh => {
                if (!mesh) return;
                mesh.receiveShadows = true;
            });

            console.log('BabylonRenderer: created', result.length, 'mesh(es)', result.map(m => m.name));
            return result;
        } catch (error) {
            console.error('Error in render:', error);
            throw error;
        }
    }

    private createMeshFromModel(model: Model): BABYLON.Mesh | BABYLON.Mesh[] {
        try {
            switch (model.type.toLowerCase()) {
                case 'wall':
                    return this.createWall(
                        model.properties.width || 5,
                        model.properties.height || 4,
                        model.properties.depth || 0.3,
                        model.properties.position
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
                    console.warn(`Unknown model type: ${model.type}`);
                    return BABYLON.MeshBuilder.CreateBox("default", { size: 1 }, this.scene);
            }
        } catch (error) {
            console.error('Error in createMeshFromModel:', error);
            throw error;
        }
    }

    private createWall(width: number, height: number, depth: number, position?: any): BABYLON.Mesh {
        try {
            console.log("Creating wall:", { width, height, depth, position });
            const wall = BABYLON.MeshBuilder.CreateBox("wall", {
                width: width,
                height: height,
                depth: depth
            }, this.scene);

            if (position) {
                if (position instanceof BABYLON.Vector3) {
                    wall.position = position;
                } else {
                    wall.position = new BABYLON.Vector3(
                        position.x || 0,
                        position.y || 0,
                        position.z || 0
                    );
                }
            }

            wall.computeWorldMatrix(true);
            return wall;
        } catch (error) {
            console.error('Error creating wall:', error);
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
