/**
 * CAD Tools for ArchGPT - Transform operations and manipulations
 */
export interface Transform {
    position?: [number, number, number];
    rotation?: [number, number, number];
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
export declare class CADTools {
    private objects;
    private selectedIds;
    private groupMap;
    private history;
    private historyIndex;
    /**
     * Move an object to a new position
     */
    move(objectId: string, x: number, y: number, z: number): CADObject | null;
    /**
     * Rotate an object (in degrees)
     */
    rotate(objectId: string, x: number, y: number, z: number): CADObject | null;
    /**
     * Scale an object
     */
    scale(objectId: string, x: number, y?: number, z?: number): CADObject | null;
    /**
     * Delete an object
     */
    delete(objectId: string): boolean;
    /**
     * Duplicate an object
     */
    duplicate(objectId: string): CADObject | null;
    /**
     * Mirror an object across an axis
     */
    mirror(objectId: string, axis: 'x' | 'y' | 'z'): CADObject | null;
    /**
     * Align multiple objects
     */
    align(objectIds: string[], direction: 'left' | 'right' | 'top' | 'bottom' | 'center'): boolean;
    /**
     * Group multiple objects
     */
    group(objectIds: string[], groupName: string): string | null;
    /**
     * Ungroup objects
     */
    ungroup(groupId: string): boolean;
    /**
     * Apply material to object(s)
     */
    applyMaterial(objectIds: string[], materialName: string): number;
    /**
     * Boolean operation (Union)
     */
    union(objectId1: string, objectId2: string): CADObject | null;
    /**
     * Boolean operation (Subtract)
     */
    subtract(baseObjectId: string, subtractObjectId: string): CADObject | null;
    /**
     * Select objects
     */
    select(objectIds: string[], multiSelect?: boolean): string[];
    /**
     * Deselect objects
     */
    deselect(objectIds?: string[]): string[];
    /**
     * Get selected object IDs
     */
    getSelected(): string[];
    /**
     * Hide/Show objects
     */
    setVisibility(objectIds: string[], visible: boolean): number;
    /**
     * Lock/Unlock objects (prevent editing)
     */
    setLocked(objectIds: string[], locked: boolean): number;
    /**
     * Undo last action
     */
    undo(): boolean;
    /**
     * Redo last undone action
     */
    redo(): boolean;
    /**
     * Internal: Save current state to history
     */
    private saveHistory;
    /**
     * Internal: Restore state from history
     */
    private restoreFromHistory;
    /**
     * Add an object to the scene
     */
    addObject(obj: CADObject): string;
    /**
     * Get an object by ID
     */
    getObject(objectId: string): CADObject | null;
    /**
     * Get all objects
     */
    getAll(): CADObject[];
    /**
     * Clear all objects
     */
    clear(): void;
}
