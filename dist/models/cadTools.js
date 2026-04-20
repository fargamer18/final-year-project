/**
 * CAD Tools for ArchGPT - Transform operations and manipulations
 */
export class CADTools {
    constructor() {
        this.objects = new Map();
        this.selectedIds = new Set();
        this.groupMap = new Map(); // groupId -> [objectIds]
        this.history = [];
        this.historyIndex = -1;
    }
    /**
     * Move an object to a new position
     */
    move(objectId, x, y, z) {
        const obj = this.objects.get(objectId);
        if (!obj)
            return null;
        this.saveHistory();
        obj.transform.position = [x, y, z];
        return obj;
    }
    /**
     * Rotate an object (in degrees)
     */
    rotate(objectId, x, y, z) {
        const obj = this.objects.get(objectId);
        if (!obj)
            return null;
        this.saveHistory();
        obj.transform.rotation = [x, y, z];
        return obj;
    }
    /**
     * Scale an object
     */
    scale(objectId, x, y, z) {
        const obj = this.objects.get(objectId);
        if (!obj)
            return null;
        this.saveHistory();
        obj.transform.scale = [x, y ?? x, z ?? x];
        return obj;
    }
    /**
     * Delete an object
     */
    delete(objectId) {
        if (!this.objects.has(objectId))
            return false;
        this.saveHistory();
        this.objects.delete(objectId);
        this.selectedIds.delete(objectId);
        return true;
    }
    /**
     * Duplicate an object
     */
    duplicate(objectId) {
        const original = this.objects.get(objectId);
        if (!original)
            return null;
        this.saveHistory();
        const duplicate = JSON.parse(JSON.stringify(original));
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
    mirror(objectId, axis) {
        const obj = this.objects.get(objectId);
        if (!obj)
            return null;
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
    align(objectIds, direction) {
        const objects = objectIds
            .map(id => this.objects.get(id))
            .filter((obj) => obj !== null);
        if (objects.length < 2)
            return false;
        this.saveHistory();
        const reference = objects[0];
        const refPos = reference.transform.position || [0, 0, 0];
        objects.slice(1).forEach(obj => {
            if (!obj.transform.position)
                obj.transform.position = [0, 0, 0];
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
    group(objectIds, groupName) {
        const groupId = `group_${Date.now()}`;
        const validIds = objectIds.filter(id => this.objects.has(id));
        if (validIds.length === 0)
            return null;
        this.saveHistory();
        this.groupMap.set(groupId, validIds);
        return groupId;
    }
    /**
     * Ungroup objects
     */
    ungroup(groupId) {
        if (!this.groupMap.has(groupId))
            return false;
        this.saveHistory();
        this.groupMap.delete(groupId);
        return true;
    }
    /**
     * Apply material to object(s)
     */
    applyMaterial(objectIds, materialName) {
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
    union(objectId1, objectId2) {
        const obj1 = this.objects.get(objectId1);
        const obj2 = this.objects.get(objectId2);
        if (!obj1 || !obj2)
            return null;
        this.saveHistory();
        const union = {
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
    subtract(baseObjectId, subtractObjectId) {
        const base = this.objects.get(baseObjectId);
        const subtract = this.objects.get(subtractObjectId);
        if (!base || !subtract)
            return null;
        this.saveHistory();
        const result = {
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
    select(objectIds, multiSelect = false) {
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
    deselect(objectIds) {
        if (!objectIds) {
            this.selectedIds.clear();
        }
        else {
            objectIds.forEach(id => this.selectedIds.delete(id));
        }
        return Array.from(this.selectedIds);
    }
    /**
     * Get selected object IDs
     */
    getSelected() {
        return Array.from(this.selectedIds);
    }
    /**
     * Hide/Show objects
     */
    setVisibility(objectIds, visible) {
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
    setLocked(objectIds, locked) {
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
    undo() {
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
    redo() {
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
    saveHistory() {
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
    restoreFromHistory() {
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
    addObject(obj) {
        this.objects.set(obj.id, JSON.parse(JSON.stringify(obj)));
        return obj.id;
    }
    /**
     * Get an object by ID
     */
    getObject(objectId) {
        const obj = this.objects.get(objectId);
        return obj ? JSON.parse(JSON.stringify(obj)) : null;
    }
    /**
     * Get all objects
     */
    getAll() {
        return Array.from(this.objects.values()).map(obj => JSON.parse(JSON.stringify(obj)));
    }
    /**
     * Clear all objects
     */
    clear() {
        this.objects.clear();
        this.selectedIds.clear();
        this.groupMap.clear();
        this.history = [];
        this.historyIndex = -1;
    }
}
//# sourceMappingURL=cadTools.js.map