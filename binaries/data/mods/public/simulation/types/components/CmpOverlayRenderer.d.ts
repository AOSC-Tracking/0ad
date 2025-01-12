declare interface ICmpOverlayRenderer {
    Reset(): void;
    AddSprite(textureName: string, corner0: { x: number, y: number }, corner1: { x: number, y: number }, offset: { x: number, y: number, z: number }, color: string): void;
}