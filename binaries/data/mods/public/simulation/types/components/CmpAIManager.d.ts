declare interface ICmpAIManager {
    AddPlayer(ai: string, player: number, difficulty: number, behavior: string): void;
    TryLoadSharedComponent(): void;
    RunGamestateInit(): void;
}