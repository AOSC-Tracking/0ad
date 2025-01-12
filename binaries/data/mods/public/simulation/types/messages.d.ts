declare type MessageEntityRenamed = { entity: EntityId; newentity: EntityId };
declare type MessageSkirmishReplacerReplaced = {
  entity: EntityId;
  newentity: EntityId;
};
declare type MessageTerritoriesChanged = {
  player: number;
  territories: number[];
};
declare type MessageDiplomacyChanged =
  | { player: number; otherPlayer: null }
  | { player: number; otherPlayer: number; value: number };
declare type MessagePlayerDefeated = { playerId: number };
declare type MessageTributeExchanged = {
  from: number;
  to: number;
  amounts: Record<GenericResName, number>;
};
declare type MessageCeasefireEnded = { player: number; otherPlayer: number };
declare type MessagePositionChanged = {
  x: number;
  z: number;
  a: number;
  inWorld: boolean;
};
declare type MessageOwnershipChanged = {
  entity: EntityId;
  to: number;
  from: number;
};
declare type MessageHealthChanged = { from: number; to: number };
declare type MessageCapturePointsChanged = { capturePoints: number[] };
declare type MessageInvulnerabilityChanged = {
  entity: EntityId;
  invulnerability: boolean;
};
declare type MessageUnitIdleChanged = { idle: boolean };
declare type MessageUnitStanceChanged = { to: string };
declare type MessageUnitAIStateChanged = { to: string };
declare type MessageUnitAIOrderDataChanged = { to: any };
declare type MessageProductionQueueChanged = { queue: any[] };
declare type MessageGarrisonedStateChanged = {
  oldHolder: EntityId;
  holderID: EntityId;
};
declare type MessageGarrisonedUnitsChanged = {
  added: EntityId[];
  removed: EntityId[];
};
declare type MessageFoundationProgressChanged = { to: number };
declare type MessageFoundationBuildersChanged = { to: EntityId[] };
declare type MessageDropsiteSharingChanged = { shared: boolean };
declare type MessageTerritoryDecayChanged = {
  entity: EntityId;
  to: boolean;
  rate: number;
};
declare type MessageMultiplierChanged = { player: number };
declare type MessageDeserialized = {};
declare type MessageUnitAbleToMoveChanged = {
  entity: EntityId;
  ableToMove: boolean;
};
declare type MessageAttacked = {
  target: EntityId;
  attacker: EntityId;
  type: string;
  attackerOwner: number;
  damage?: number;
  capture?: number;
  statusEffects?: string[];
  fromStatusEffect?: boolean;
};
declare type MessageGuardedAttacked = {
  guarded: EntityId;
  data: MessageAttacked;
};
declare type MessagePickupRequested = { entity: EntityId; iid: IID };
declare type MessagePickupCanceled = { entity: EntityId };
declare type MessageMotionUpdate = {
  likelySuccess?: true;
  likelyFailure?: true;
  obstructed?: true;
  veryObstructed?: true;
};

declare type MessageVisibilityChanged = {
  player: number;
  newVisibility: typeof VIS_HIDDEN | typeof VIS_FOGGED | typeof VIS_VISIBLE;
};
declare type MessageRangeUpdate = {
  tag: number;
  added: EntityId[];
  removed: EntityId[];
};
declare type MessagePackFinished = { packed: boolean };
declare type MessageVisionRangeChanged = { entity: EntityId };
declare type MessageConstructionFinished = {
  newentity: EntityId;
  entity: EntityId;
};
declare type MessageTrainingStarted = {};
declare type MessageTrainingFinished = {};
declare type MessageAIMetadata = {};
declare type MessageInitGame = {};
declare type MessageSkirmishReplace = {};
declare type MessageUpdate = { turnLength: number };
declare type MessageTemplateModification = any;
declare type MessageValueModification = {
  component: string;
  valueNames: string[];
  entities: EntityId[];
};
declare type MessageResearchFinished = { player: number; tech: string };
declare type MessageResourceSupplyChanged = {};
declare type MessagePackProgressUpdate = {};
declare type MessageUpgradeProgressUpdate = {};
declare type MessagePlayerColorChanged = {};
declare type MessageDisabledTemplatesChanged = {};
declare type MessageCinemaPathEnded = {};
declare type MessageCinemaQueueEnded = {};
declare type MessagePlayerWon = {};
declare type MessagePlayerEntityChanged = {
  player: number;
  from: EntityId;
  to: EntityId;
};
declare type MessageAttackDetected = {};
declare type MessageBattleStateChanged = {};
declare type MessageCaptureRegenStateChanged = {};
declare type MessageCeasefireStarted = {};
declare type MessageCreate = {};
declare type MessageDestroy = {};
declare type MessageDisabledTechnologiesChanged = {};
declare type MessageExperienceChanged = {};
declare type MessageInterpolate = {};
declare type MessageInterpolatedPositionChanged = {};
declare type MessageMinimapPing = {};
declare type MessageMovementObstructionChanged = {};
declare type MessageObstructionMapShapeChanged = {};
declare type MessagePathResult = {};
declare type MessageProgressiveLoad = {};
declare type MessageRenderSubmit = {};
declare type MessageTerrainChanged = {};
declare type MessageTurnStart = {};
declare type MessageTurretedStateChanged = {};
declare type MessageTurretsChanged = {};
declare type MessageUpdate_Final = {};
declare type MessageUpdate_MotionFormation = {};
declare type MessageUpdate_MotionUnit = {};
declare type MessageVictoryConditionsChanged = {};
declare type MessageVisionSharingChanged = {};
declare type MessageWaterChanged = {};
