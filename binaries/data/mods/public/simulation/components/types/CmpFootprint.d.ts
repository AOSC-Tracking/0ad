declare interface ICmpFootprint {
    GetShape(): { type: "circle", radius: number, height: number } | { type: "square", width: number, depth: number, height: number };
    PickSpawnPoint(ent: EntityId): Vector3D;
    PickSpawnPointBothPass(ent: EntityId): Vector3D;
}