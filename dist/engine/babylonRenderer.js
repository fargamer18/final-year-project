export class BabylonRenderer {
    constructor(scene) {
        this.scene = scene;
        this.setupEnvironment();
    }
    setupEnvironment() {
        // Add a hemispheric light for better overall illumination
        const hemiLight = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), this.scene);
        hemiLight.intensity = 0.7;
        // Add directional light for better definition
        const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -2, -1), this.scene);
        dirLight.intensity = 0.5;
        // Add ambient light for fill
        const ambientLight = new BABYLON.HemisphericLight("ambientLight", new BABYLON.Vector3(0, 1, 0), this.scene);
        ambientLight.intensity = 0.3;
    }
    render(model) {
        console.log("Rendering model:", model);
        const meshes = this.createMeshFromModel(model);
        const result = Array.isArray(meshes) ? meshes : [meshes];
        // Apply visualization settings to all meshes
        result.forEach(mesh => {
            mesh.receiveShadows = true;
            mesh.checkCollisions = true;
        });
        return result;
    }
    createMeshFromModel(model) {
        switch (model.type.toLowerCase()) {
            case 'wall':
                return this.createWall(model.properties.width || 5, model.properties.height || 4, model.properties.depth || 0.3, model.properties.position);
            case 'roof':
                return this.createRoof(model.properties.width || 5, model.properties.height || 2, model.properties.depth || 5, model.properties.position);
            case 'house':
                return this.createHouse(model.properties);
            default:
                console.warn(`Unknown model type: ${model.type}`);
                return BABYLON.MeshBuilder.CreateBox("default", { size: 1 }, this.scene);
        }
    }
    createWall(width, height, depth, position) {
        console.log("Creating wall:", { width, height, depth, position });
        const wall = BABYLON.MeshBuilder.CreateBox("wall", {
            width: width,
            height: height,
            depth: depth
        }, this.scene);
        // Set position before adding physics
        if (position) {
            if (position instanceof BABYLON.Vector3) {
                wall.position = position;
            }
            else {
                wall.position = new BABYLON.Vector3(position.x || 0, position.y || 0, position.z || 0);
            }
        }
        // Ensure the wall is properly positioned before adding physics
        wall.computeWorldMatrix(true);
        try {
            // Add physics impostor with static mass (0) for stability
            wall.physicsImpostor = new BABYLON.PhysicsImpostor(wall, BABYLON.PhysicsImpostor.BoxImpostor, {
                mass: 0,
                restitution: 0.2,
                friction: 0.4,
                disableBidirectionalTransformation: true
            }, this.scene);
        }
        catch (error) {
            console.warn("Failed to add physics impostor to wall:", error);
        }
        return wall;
    }
    createRoof(width, height, depth, position) {
        // Create triangular prism for roof using custom vertices
        const roofMesh = new BABYLON.Mesh("roof", this.scene);
        const positions = [
            // Front face
            -width / 2, 0, depth / 2,
            width / 2, 0, depth / 2,
            0, height, depth / 2,
            // Back face
            -width / 2, 0, -depth / 2,
            width / 2, 0, -depth / 2,
            0, height, -depth / 2, // top
        ];
        const indices = [
            0, 1, 2,
            3, 5, 4,
            0, 2, 5, 0, 5, 3,
            1, 4, 5, 1, 5, 2,
            0, 3, 4, 0, 4, 1 // bottom
        ];
        const normals = [];
        BABYLON.VertexData.ComputeNormals(positions, indices, normals);
        const vertexData = new BABYLON.VertexData();
        vertexData.positions = positions;
        vertexData.indices = indices;
        vertexData.normals = normals;
        vertexData.applyToMesh(roofMesh);
        if (position) {
            roofMesh.position = position;
        }
        // Add physics impostor
        roofMesh.physicsImpostor = new BABYLON.PhysicsImpostor(roofMesh, BABYLON.PhysicsImpostor.ConvexHullImpostor, { mass: 1, restitution: 0.2, friction: 0.4 }, this.scene);
        return roofMesh;
    }
    createHouse(properties) {
        console.log("Creating house with properties:", properties);
        const width = properties.width || 8;
        const height = properties.height || 6;
        const depth = properties.depth || 10;
        const wallThickness = properties.wallThickness || 0.3;
        // Create house root node to group all meshes
        const houseRoot = new BABYLON.Mesh("house", this.scene);
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
        foundation.physicsImpostor = new BABYLON.PhysicsImpostor(foundation, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9, friction: 0.5 }, this.scene);
        // Create walls with proper positions relative to the foundation
        const frontWall = this.createWall(width, height, wallThickness, new BABYLON.Vector3(0, height / 2, depth / 2));
        const backWall = this.createWall(width, height, wallThickness, new BABYLON.Vector3(0, height / 2, -depth / 2));
        const leftWall = this.createWall(wallThickness, height, depth, new BABYLON.Vector3(-width / 2, height / 2, 0));
        const rightWall = this.createWall(wallThickness, height, depth, new BABYLON.Vector3(width / 2, height / 2, 0));
        // Create the roof with proper dimensions and position
        const roof = this.createRoof(width + wallThickness * 2, height / 2, depth + wallThickness * 2, new BABYLON.Vector3(0, height + height / 4, 0));
        // Apply materials to all walls
        const wallMaterial = new BABYLON.StandardMaterial("wallMaterial", this.scene);
        wallMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
        [frontWall, backWall, leftWall, rightWall].forEach(wall => {
            wall.material = wallMaterial;
            wall.physicsImpostor = new BABYLON.PhysicsImpostor(wall, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9, friction: 0.5 }, this.scene);
        });
        // Apply roof material
        const roofMaterial = new BABYLON.StandardMaterial("roofMaterial", this.scene);
        roofMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.2, 0.2);
        roof.material = roofMaterial;
        // Parent all meshes to the house root and setup physics
        const allMeshes = [foundation, frontWall, backWall, leftWall, rightWall, roof];
        allMeshes.forEach(mesh => {
            mesh.parent = houseRoot;
            // Enable edge rendering for better visibility
            mesh.enableEdgesRendering();
            mesh.edgesWidth = 2.0;
            mesh.edgesColor = new BABYLON.Color4(0, 0, 0, 1);
            // Add PBR material
            const meshMaterial = pbr.clone(`${mesh.name}Material`);
            if (mesh === roof) {
                meshMaterial.albedoColor = new BABYLON.Color3(0.7, 0.2, 0.2); // Red for roof
                // Roof gets a convex hull impostor with mass
                mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, BABYLON.PhysicsImpostor.ConvexHullImpostor, { mass: 1, restitution: 0.2, friction: 0.4 }, this.scene);
            }
            else if (mesh === foundation) {
                meshMaterial.albedoColor = new BABYLON.Color3(0.4, 0.4, 0.4); // Dark gray for foundation
                // Foundation is static
                mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9, friction: 0.5 }, this.scene);
            }
            else {
                // Walls are static boxes
                mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9, friction: 0.5 }, this.scene);
            }
            meshMaterial.roughness = 0.6;
            mesh.material = meshMaterial;
            // Add outline highlight
            mesh.renderOutline = true;
            mesh.outlineWidth = 0.02;
            mesh.outlineColor = new BABYLON.Color3(0, 0, 0);
        });
        // Position the entire house above ground
        houseRoot.position.y = 0.25;
        console.log("House created with", allMeshes.length, "meshes");
        return allMeshes;
    }
}
export default BabylonRenderer;
//# sourceMappingURL=babylonRenderer.js.map