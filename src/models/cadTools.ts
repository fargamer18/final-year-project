/**
 * CAD Tools for ArchGPT - Transform operations and manipulations
 */

export interface Transform {
    position?: [number, number, number];
    rotation?: [number, number, number]; // degrees
    scale?: [number, number, number];
}

export interface CADObject {
    id: string;
    type: string;
    name: string;
    properties: Record<string, any>;
    transform: Transform;
    material?: string;
    children?: CADObject[];
    hidden?: boolean;
    locked?: boolean;
}

export class CADTools {
    private objects: Map<string, CADObject> = new Map();
    private selectedIds: Set<string> = new Set();
    private groupMap: Map<string, string[]> = new Map(); // groupId -> [objectIds]
    private history: CADObject[][] = [];
    private historyIndex: number = -1;

    /**
     * Move an object to a new position
     */
    move(objectId: string, x: number, y: number, z: number): CADObject | null {
        const obj = this.objects.get(objectId);
        if (!obj) return null;
        
        this.saveHistory();
        obj.transform.position = [x, y, z];
        return obj;
    }

    /**
     * Rotate an object (in degrees)
     */
    rotate(objectId: string, x: number, y: number, z: number): CADObject | null {
        const obj = this.objects.get(objectId);
        if (!obj) return null;
        
        this.saveHistory();
        obj.transform.rotation = [x, y, z];
        return obj;
    }

    /**
     * Scale an object
     */
    scale(objectId: string, x: number, y?: number, z?: number): CADObject | null {
        const obj = this.objects.get(objectId);
        if (!obj) return null;
        
        this.saveHistory();
        obj.transform.scale = [x, y ?? x, z ?? x];
        return obj;
    }

    /**
     * Delete an object
     */
    delete(objectId: string): boolean {
        if (!this.objects.has(objectId)) return false;
        
        this.saveHistory();
        this.objects.delete(objectId);
        this.selectedIds.delete(objectId);
        return true;
    }

    /**
     * Duplicate an object
     */
    duplicate(objectId: string): CADObject | null {
        const original = this.objects.get(objectId);
        if (!original) return null;
        
        this.saveHistory();
        const duplicate: CADObject = JSON.parse(JSON.stringify(original));
        duplicate.id = `${original.id}_copy_${Date.now()}`;
        duplicate.name = `${original.name} (Copy)`;
        
        // Offset the duplicate slightly
        if (duplicate.transform.position) {
            duplicate.transform.position[0] += 1;
            duplicate.transform.position[2] += 1;
        }
        
        this.objects.set(duplicate.id, duplicate);
        return duplicate;
    }

    /**
     * Mirror an object across an axis
     */
    mirror(objectId: string, axis: 'x' | 'y' | 'z'): CADObject | null {
        const obj = this.objects.get(objectId);
        if (!obj) return null;
        
        this.saveHistory();
        const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
        if (obj.transform.scale) {
            obj.transform.scale[axisIndex] *= -1;
        }
        return obj;
    }

    /**
     * Align multiple objects
     */
    align(objectIds: string[], direction: 'left' | 'right' | 'top' | 'bottom' | 'center'): boolean {
        const objects = objectIds
            .map(id => this.objects.get(id))
            .filter((obj): obj is CADObject => obj !== null);
        
        if (objects.length < 2) return false;
        
        this.saveHistory();
        const reference = objects[0];
        const refPos = reference.transform.position || [0, 0, 0];
        
        objects.slice(1).forEach(obj => {
            if (!obj.transform.position) obj.transform.position = [0, 0, 0];
            
            switch (direction) {
                case 'left':
                    obj.transform.position[0] = refPos[0];
                    break;
                case 'right':
                    obj.transform.position[0] = refPos[0];
                    break;
                case 'top':
                    obj.transform.position[1] = refPos[1];
                    break;
                case 'bottom':
                    obj.transform.position[1] = refPos[1];
                    break;
                case 'center':
                    obj.transform.position = [...refPos];
                    break;
            }
        });
        return true;
    }

    /**
     * Group multiple objects
     */
    group(objectIds: string[], groupName: string): string | null {
        const groupId = `group_${Date.now()}`;
        const validIds = objectIds.filter(id => this.objects.has(id));
        
        if (validIds.length === 0) return null;
        
        this.saveHistory();
        this.groupMap.set(groupId, validIds);
        return groupId;
    }

    /**
     * Ungroup objects
     */
    ungroup(groupId: string): boolean {
        if (!this.groupMap.has(groupId)) return false;
        
        this.saveHistory();
        this.groupMap.delete(groupId);
        return true;
    }

    /**
     * Apply material to object(s)
     */
    applyMaterial(objectIds: string[], materialName: string): number {
        let count = 0;
        this.saveHistory();
        
        objectIds.forEach(id => {
            const obj = this.objects.get(id);
            if (obj) {
                obj.material = materialName;
                count++;
            }
        });
        return count;
    }

    /**
     * Boolean operation (Union)
     */
    union(objectId1: string, objectId2: string): CADObject | null {
        const obj1 = this.objects.get(objectId1);
        const obj2 = this.objects.get(objectId2);
        
        if (!obj1 || !obj2) return null;
        
        this.saveHistory();
        const union: CADObject = {
            id: `union_${Date.now()}`,
            type: 'union',
            name: `${obj1.name} ∪ ${obj2.name}`,
            properties: { ...obj1.properties, ...obj2.properties },
            transform: { ...obj1.transform },
            material: obj1.material,
            children: [obj1, obj2]
        };
        
        this.objects.set(union.id, union);
        return union;
    }

    /**
     * Boolean operation (Subtract)
     */
    subtract(baseObjectId: string, subtractObjectId: string): CADObject | null {
        const base = this.objects.get(baseObjectId);
        const subtract = this.objects.get(subtractObjectId);
        
        if (!base || !subtract) return null;
        
        this.saveHistory();
        const result: CADObject = {
            id: `subtract_${Date.now()}`,
            type: 'subtract',
            name: `${base.name} - ${subtract.name}`,
            properties: { ...base.properties },
            transform: { ...base.transform },
            material: base.material,
            children: [base, subtract]
        };
        
        this.objects.set(result.id, result);
        return result;
    }

    /**
     * Select objects
     */
    select(objectIds: string[], multiSelect: boolean = false): string[] {
        if (!multiSelect) {
            this.selectedIds.clear();
        }
        
        objectIds.forEach(id => {
            if (this.objects.has(id)) {
                this.selectedIds.add(id);
            }
        });
        
        return Array.from(this.selectedIds);
    }

    /**
     * Deselect objects
     */
    deselect(objectIds?: string[]): string[] {
        if (!objectIds) {
            this.selectedIds.clear();
        } else {
            objectIds.forEach(id => this.selectedIds.delete(id));
        }
        return Array.from(this.selectedIds);
    }

    /**
     * Get selected object IDs
     */
    getSelected(): string[] {
        return Array.from(this.selectedIds);
    }

    /**
     * Hide/Show objects
     */
    setVisibility(objectIds: string[], visible: boolean): number {
        let count = 0;
        objectIds.forEach(id => {
            const obj = this.objects.get(id);
            if (obj) {
                obj.hidden = !visible;
                count++;
            }
        });
        return count;
    }

    /**
     * Lock/Unlock objects (prevent editing)
     */
    setLocked(objectIds: string[], locked: boolean): number {
        let count = 0;
        objectIds.forEach(id => {
            const obj = this.objects.get(id);
            if (obj) {
                obj.locked = locked;
                count++;
            }
        });
        return count;
    }

    /**
     * Undo last action
     */
    undo(): boolean {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreFromHistory();
            return true;
        }
        return false;
    }

    /**
     * Redo last undone action
     */
    redo(): boolean {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreFromHistory();
            return true;
        }
        return false;
    }

    /**
     * Internal: Save current state to history
     */
    private saveHistory(): void {
        // Remove any redo history if we're not at the end
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // Save current state
        const currentState = Array.from(this.objects.values());
        this.history.push(JSON.parse(JSON.stringify(currentState)));
        this.historyIndex++;
        
        // Limit history to 100 states
        if (this.history.length > 100) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    /**
     * Internal: Restore state from history
     */
    private restoreFromHistory(): void {
        if (this.historyIndex >= 0 && this.historyIndex < this.history.length) {
            this.objects.clear();
            const state = this.history[this.historyIndex];
            state.forEach(obj => {
                this.objects.set(obj.id, JSON.parse(JSON.stringify(obj)));
            });
        }
    }

    /**
     * Add an object to the scene
     */
    addObject(obj: CADObject): string {
        this.objects.set(obj.id, JSON.parse(JSON.stringify(obj)));
        return obj.id;
    }

    /**
     * Get an object by ID
     */
    getObject(objectId: string): CADObject | null {
        const obj = this.objects.get(objectId);
        return obj ? JSON.parse(JSON.stringify(obj)) : null;
    }

    /**
     * Get all objects
     */
    getAll(): CADObject[] {
        return Array.from(this.objects.values()).map(obj => 
            JSON.parse(JSON.stringify(obj))
        );
    }

    /**
     * Clear all objects
     */
    clear(): void {
        this.objects.clear();
        this.selectedIds.clear();
        this.groupMap.clear();
        this.history = [];
        this.historyIndex = -1;
    }
}
