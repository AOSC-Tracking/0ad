declare interface ICmpTerritoryManager {
    SetTerritoryBlinking(x: number, z: number, blinking: boolean): void;
    IsTerritoryBlinking(x: number, z: number): boolean;
    IsConnected(x: number, z: number): boolean;
    GetNeighbours(x: number, z: number, filterConnected: boolean): number[];
    GetOwner(x: number, z: number): number;
}
