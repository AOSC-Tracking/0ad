type RangeManagerFlags = number;
type RangeManagerQuery = number;
declare interface ICmpRangeManager {
    ExploreTerritories(): void;
    ExploreMap(player: number): void;
    SetLosRevealAll(player: number | typeof INVALID_PLAYER, reveal: boolean): void;
    GetLosCircular(): boolean
    SetLosCircular(cirular: boolean): void;
    SetSharedLos(player: number, players: number[]): void;

    GetLosVisibility(ent: EntityId, player: number): "hidden" | "fogged" | "visible";
    GetLosVisibilityPosition(x: number, z: number, player: number): "hidden" | "fogged" | "visible";
    RequestVisibilityUpdate(ent: EntityId): void;

	ExecuteQuery(source: EntityId, minRange: number, maxRange: number, owners: number[], requiredInterface?: IID | 0, accountForSize?: boolean): EntityId[];
    ExecuteQueryAroundPos(pos: Vector2D, minRange: number, maxRange: number, owners: number[], requiredInterface?: IID | 0, accountForSize?: boolean): EntityId[];

    CreateActiveQuery(source: EntityId, minRange: number, maxRange: number, owners: number[], requiredInterface?: IID | 0, flags?: RangeManagerFlags, accountForSize?: boolean): RangeManagerQuery;
    CreateActiveParabolicQuery(source: EntityId, minRange: number, maxRange: number, yOrigin: number, owners: number[], requiredInterface?: IID | 0, flags?: RangeManagerFlags, accountForSize?: boolean): RangeManagerQuery;
    EnableActiveQuery(tag: RangeManagerQuery): void;
    DisableActiveQuery(tag: RangeManagerQuery): void;
    ResetActiveQuery(tag: RangeManagerQuery): EntityId[];
    DestroyActiveQuery(tag: RangeManagerQuery): void;
    IsActiveQueryEnabled(tag: RangeManagerQuery): boolean;

    GetEntityFlagMask(identifier: "normal" | "injured"): RangeManagerFlags;
    SetEntityFlag(ent: EntityId, identifier: "normal" | "injured", value: boolean): void;

    GetEntitiesByPlayer(player: number): EntityId[];

    GetEffectiveParabolicRange(source: EntityId, target: EntityId, range: number, yOrigin: number): number;
    GetElevationAdaptedRange(pos: { x: number, y: number, z: number}, rot: { x: number, y: number, z: number}, range: number, yOrigin: number, angle: number): number;

    ActivateScriptedVisibility(entity: EntityId, status: boolean): void;
}
