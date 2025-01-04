declare interface ICmpObstructionManager {
    DistanceToPoint(ent: number, px: number, pz: number): number;
    MaxDistanceToPoint(ent: number, px: number, pz: number): number;
    DistanceToTarget(ent: number, target: number): number;
    MaxDistanceToTarget(ent: number, target: number): number;
    IsInPointRange(ent: number, px: number, pz: number, minRange: number, maxRange: number, opposite: boolean): boolean;
    IsInTargetRange(ent: number, target: number, minRange: number, maxRange: number, opposite: boolean): boolean;
    IsInTargetParabolicRange(ent: number, target: number, minRange: number, maxRange: number, yOrigin: number, opposite: boolean): boolean;
    IsPointInPointRange(x: number, z: number, px: number, pz: number, minRange: number, maxRange: number): boolean;
    SetPassabilityCircular(enabled: boolean): void;
    SetDebugOverlay(enabled: boolean): void;
}