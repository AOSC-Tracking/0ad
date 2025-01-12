declare interface ICmpObstruction {
    SetControlGroup(group: number): void;
    SetControlGroup2(group: number): void;
    GetControlGroup(): number;
    GetControlGroup2(): number;

    GetBlockMovementFlag(templateOnly: boolean): boolean;

    GetEntitiesDeletedUponConstruction(): EntityId[];
    GetEntitiesBlockingConstruction(): EntityId[];

    SetActive(active: boolean): void;
    SetDisableBlockMovementPathfinding(movementDisabled: boolean, pathfindingDisabled: boolean, shape: number): void;

    CheckShorePlacement(): boolean;
    CheckFoundation(className: string, onlyCenterPoint: boolean): "success" | string;

    GetSize(): number;
}