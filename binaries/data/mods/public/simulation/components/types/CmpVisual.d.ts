declare interface ICmpVisual {
    SetShadingColor(r: number, g: number, b: number, a: number): void;
    SetActorSeed(seed: number): void;
    GetActorSeed(): number;

    RecomputeActorName(): void;

    HasConstructionPreview(): boolean;
    GetProjectileActor(): string;
    GetProjectileLaunchPoint(): Vector3D;

    SetAnimationSyncRepeat(repeattime: number): void;
    SetAnimationSyncOffset(offset: number): void;
    
    SelectAnimation(name: string, once: boolean, speed: number): void;
    SetVariant(key: string, selection: string | undefined): void;
    SetVariable(key: string, value: number): void;
}