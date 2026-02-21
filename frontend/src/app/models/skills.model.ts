export interface Skill {
    id: number;
    name: string;
    effect: string;
    level?: number | null; // Null for passive skills, value for latent skills
    bonuses?: SkillBonus[] | null;
}

export interface TeamSkill {
    id: number;
    name: string;
    effect: string;
}

export interface SkillBonus {
    type: string; // "stat", "all_stats", "stamina_cost", "tech_power_type", "tech_power_combined", "tech_power_specific", etc.
    value: number; // Percentage or flat value
    statName?: string | null; // "shot", "pass", etc. (only for type = "stat")
    techniqueType?: string | null; // "remate", "volea", etc. (only for type = "tech_power_type")
    techniqueIds?: number[] | null; // IDs de técnicas concretas (only for type = "tech_power_specific")
}
