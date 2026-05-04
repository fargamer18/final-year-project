import * as THREE from 'three';
export class ThreeRenderer {
    constructor(container) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(this.renderer.domElement);
        // Set initial camera position
        this.camera.position.z = 5;
    }
    render(model) {
        // Dispose and clear existing meshes from the scene
        while (this.scene.children.length > 0) {
            const child = this.scene.children[0];
            if (child.geometry) {
                child.geometry.dispose();
            }
            const mat = child.material;
            if (Array.isArray(mat)) {
                mat.forEach(m => m.dispose());
            }
            else if (mat) {
                mat.dispose();
            }
            this.scene.remove(child);
        }
        // Add new meshes based on the model
        model.shapes.forEach((shape) => {
            const geometry = this.createGeometry(shape);
            const material = new THREE.MeshStandardMaterial({
                color: shape.material?.color || '#ffffff',
            });
            const mesh = new THREE.Mesh(geometry, material);
            // Set position
            mesh.position.set(shape.position.x, shape.position.y, shape.position.z);
            // Apply model transforms if any
            if (model.transforms) {
                if (model.transforms.rotation) {
                    mesh.rotation.set(model.transforms.rotation.x, model.transforms.rotation.y, model.transforms.rotation.z);
                }
                if (model.transforms.scale) {
                    mesh.scale.set(model.transforms.scale.x, model.transforms.scale.y, model.transforms.scale.z);
                }
            }
            this.scene.add(mesh);
        });
        // Add lights
        const ambientLight = new THREE.AmbientLight(0x404040);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(ambientLight);
        this.scene.add(directionalLight);
    }
    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }
    createGeometry(shape) {
        switch (shape.type.toLowerCase()) {
            case 'box':
                return new THREE.BoxGeometry(shape.dimensions.width || 1, shape.dimensions.height || 1, shape.dimensions.depth || 1);
            case 'sphere':
                return new THREE.SphereGeometry(shape.dimensions.radius || 1);
            case 'cylinder':
                return new THREE.CylinderGeometry(shape.dimensions.radius || 1, shape.dimensions.radius || 1, shape.dimensions.height || 1);
            default:
                console.warn(`Unsupported shape type: ${shape.type}`);
                return new THREE.BoxGeometry(1, 1, 1); // Default fallback
        }
    }
}
//# sourceMappingURL=threeRenderer.js.map