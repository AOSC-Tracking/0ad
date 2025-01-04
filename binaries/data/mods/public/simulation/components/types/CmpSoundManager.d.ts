declare interface ICmpSoundManager {
    PlaySoundGroup(name: string, entity: EntityId): void;
    PlaySoundGroupAtPosition(name: string, sourcePos: Vector3D): void;
    PlaySoundGroupForPlayer(name: string, playerId: number): void;
}