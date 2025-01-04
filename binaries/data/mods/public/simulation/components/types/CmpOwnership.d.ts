declare interface ICmpOwnership {
    GetOwner(): number;
    SetOwner(player: number | typeof INVALID_PLAYER): void;
    SetOwnerQuiet(player: number | typeof INVALID_PLAYER): void;
}