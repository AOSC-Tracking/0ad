declare interface ICmpTerrain {
    GetMapSize(): number;
    GetGroundLevel(nx: number, nz: number): number;
}