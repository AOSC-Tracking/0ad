declare interface ICmpTemplateManager {
    GetTemplate(templateName: string): Template;
    GetTemplateWithoutValidation(templateName: string): Template;
    TemplateExists(templateName: string): boolean;
    GetCurrentTemplateName(ent: EntityId): string;
    FindAllTemplates(includeActors: boolean): string[];
    GetCivData(): string[][];
}
