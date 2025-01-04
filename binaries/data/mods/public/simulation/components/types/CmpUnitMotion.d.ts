declare interface ICmpUnitMotion {
    SetFacePointAfterMove(face: boolean): void;
    GetFacePointAfterMove(): boolean;
    FaceTowardsPoint(x: number, z: number): void;
    EstimateFuturePosition(time: number): Vector2D;

    SetSpeedMultiplier(speed: number): void;
    SetAcceleration(acceleration: number): void;
    SetPassabilityClassName(passClass: string): void;

    GetCurrentSpeed(): number;
    GetWalkSpeed(): number;
    GetRunMultiplier(): number;
    GetAcceleration(): number;
    GetPassabilityClassName(): string;

    IsTargetRangeReachable(target: EntityId, min: number, max: number): boolean;

    SetMemberOfFormation(formation: EntityId): void;

    StopMoving(): void;

    MoveToPointRange(x: number, z: number, min: number, max: number): boolean;
    MoveToTargetRange(target: EntityId, min: number, max: number): boolean
    MoveToFormationOffset(ent: EntityId, x: number, z: number): boolean;
    
    PossiblyAtDestination(): boolean;
}