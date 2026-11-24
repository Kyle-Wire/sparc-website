/**
 * The names buyers see for each model, in one place.
 *
 * Kyle asked on 24 Nov 2026 for clever names for the models and for them to
 * switch everywhere on the site. The set is "the inspector's kit": each model
 * is named for the instrument that answers its question. The options and the
 * conflict check are in the project's naming page (model-names.html).
 *
 * These are display names only. Repositories, code, commands and engine
 * commits keep their own names (FloodSim, HeatSim, insar_pipeline, WindSim),
 * so source citations on the site still name the repository they come from;
 * `engine` below is how a page says which engine a model runs on.
 */
import type { EngineId } from "./engines";

export interface ModelName {
  /** The name a buyer reads. */
  name: string;
  /** One line on why it has that name. */
  why: string;
  /** The engine (repository) it runs on. */
  engine: string;
}

export const MODEL_NAMES: Record<EngineId, ModelName> = {
  flood: { name: "Level", why: "Water finds its level. Level follows it street by street, one metre at a time.", engine: "FloodSim" },
  heat: { name: "Sundial", why: "Street heat is sun and shade, hour by hour, which is what a sundial reads.", engine: "HeatSim" },
  ground: { name: "Plumb", why: "Is the house still plumb? Plumb watches the ground under it from orbit.", engine: "SPARC InSAR" },
  wind: { name: "Vane", why: "The oldest wind instrument on a roof. Vane follows the gusts between buildings.", engine: "WindSim" },
};

/** The buyer-facing name of a model. */
export const modelName = (id: EngineId): string => MODEL_NAMES[id].name;

/** The checker that scores every model's misses by code length (gridzip-lab
 *  codelen and physlib): a jeweller's lens that looks closer at where a model
 *  misses and names what is missing. */
export const CHECKER_NAME = "Loupe";
