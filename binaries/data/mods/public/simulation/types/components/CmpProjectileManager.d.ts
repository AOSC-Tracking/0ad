declare interface ICmpProjectileManager {
    LaunchProjectileAtPoint(launchPoint: Vector3D, position: Vector3D, horizSpeed: number, gravity: number, actorName: string, impactActorName: string, impactAnimationLifetime: number): number;
    RemoveProjectile(projectile: number): void;
}