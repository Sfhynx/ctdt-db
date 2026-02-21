import { StatName } from "../types/player-types";
export const ASSOCIATE_PHYSICAL_STATS: Record<StatName,StatName> = {
  dribble: 'speed',
  shot: 'power',
  pass: 'technique',
  tackle: 'speed',
  block: 'power',
  intercept: 'technique',
  speed: 'speed',
  power: 'power',
  technique: 'technique',
  punch: 'power',
  catchStat: 'power',
  energy: 'energy'
};
