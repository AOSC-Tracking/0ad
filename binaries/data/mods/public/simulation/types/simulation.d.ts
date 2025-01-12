// Use record as the default type to mean "some object with unknown properties".
declare type Component = Record<string, unknown>;
declare type Interface = IIDs[keyof IIDs];

// Allows suppressing errors, but should be used sparingly.
declare type Template = Record<string, any>;

declare type EntityId = number;

declare const SYSTEM_ENTITY = 1;
declare const INVALID_PLAYER = -1;
declare const INVALID_ENTITY = -1;

declare const AttackHelper: AttackHelperClass;
declare const g_AttackEffects: AttackEffects;
declare const PositionHelper: PositionHelperClass;
declare const RequirementsHelper: RequirementsHelperClass;
declare const g_Resources: Resources & {
  BuildChoicesSchema: any;
  BuildSchema: any;
};

// Random helpers for typing other components.
declare class FsmSpec {
  readonly [prop: string]:
    | ((
        this: UnitAI,
        msg: { type: string; data: any; [prop: string]: any }
      ) => void | boolean)
    | FsmSpec
    | string;
}

declare class Engine {
  static RegisterComponentType(iid: number, name: string, component: new () => Interface): void;
  static RegisterSystemComponentType(iid: number, name: string, component: new () => Interface): void;
  static RegisterInterface(name: string): void;
  static RegisterMessageType(name: string): void;
  static RegisterGlobal<T>(name: string, value: NonNullable<T>): void;

  static FlushDestroyedEntities(): void;
  static GetEntitiesWithInterface(iid: IID | 0): EntityId[];

  static PostMessage<T extends keyof MessageMap>(entity: EntityId, mid: T, data?: MessageMap[T]): void;
  static BroadcastMessage<T extends keyof MessageMap>(mid: T, data?: MessageMap[T]): void;

  static AddEntity(templateName: string): EntityId;
  static AddLocalEntity(templateName: string): EntityId;
  static DestroyEntity(entity: EntityId): void;

  static GetTemplate(templateName: string): Template;

  // System components are assumed to never be undefined.
  static QueryInterface<T extends SystemInterface>(entity: EntityId, iid: T): IIDs[T];
  static QueryInterface<T extends keyof IIDs>(entity: EntityId, iid: T): IIDs[T] | undefined;
  static QueryInterface(entity: EntityId, iid: number): unknown | undefined;
}

type IID = keyof IIDs;

type SystemInterface =
  | typeof IID_AIInterface
  | typeof IID_AIManager
  | typeof IID_CeasefireManager
  | typeof IID_CinemaManager
  | typeof IID_CommandQueue
  | typeof IID_DelayedDamage
  | typeof IID_EndGameManager
  | typeof IID_GuiInterface
  | typeof IID_ModifiersManager
  | typeof IID_ObstructionManager
  | typeof IID_Pathfinder
  | typeof IID_PlayerManager
  | typeof IID_ProjectileManager
  | typeof IID_RallyPointRenderer
  | typeof IID_RangeManager
  | typeof IID_SoundManager
  | typeof IID_TemplateManager
  | typeof IID_Terrain
  | typeof IID_TerritoryDecayManager
  | typeof IID_TerritoryManager
  | typeof IID_Timer
  | typeof IID_Trigger
  | typeof IID_UnitMotionManager
  | typeof IID_UnitRenderer
  | typeof IID_WaterManager;

declare type AIManager = ICmpAIManager;
declare type CinemaManager = Component;
declare type CommandQueue = Component;
declare type Decay = Component;
declare type Footprint = ICmpFootprint;
declare type Minimap = Component;
declare type Motion = Component;
declare type Obstruction = ICmpObstruction;
declare type ObstructionManager = ICmpObstructionManager;
declare type OverlayRenderer = ICmpOverlayRenderer;
declare type Ownership = ICmpOwnership;
declare type ParticleManager = Component;
declare type Pathfinder = ICmpPathfinder;
declare type Position = ICmpPosition;
declare type ProjectileManager = ICmpProjectileManager;
declare type RallyPointRenderer = ICmpRallyPointRenderer;
declare type RangeManager = ICmpRangeManager;
declare type RangeOverlayRenderer = ICmpRangeOverlayRenderer;
declare type Selectable = Component;
declare type SoundManager = ICmpSoundManager;
declare type TemplateManager = ICmpTemplateManager;
declare type Terrain = ICmpTerrain;
declare type TerritoryInfluence = Component;
declare type TerritoryManager = ICmpTerritoryManager;
declare type Test1 = Component;
declare type Test2 = Component;
declare type UnitMotion = ICmpUnitMotion;
declare type UnitMotionManager = Component;
declare type UnitRenderer = Component;
declare type UnknownScript = Component;
declare type Vision = ICmpVision;
declare type Visual = ICmpVisual;
declare type WaterManager = ICmpWaterManager;
