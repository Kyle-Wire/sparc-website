/**
 * The names buyers see for each model, in one place.
 *
 * Kyle asked on 24 Nov 2026 for clever names for the models, switched
 * everywhere on the site, then for names with more scientific quirks (he
 * picked Yew for ground and Ash for fire). The set is "the grove": each model
 * is a tree with a true quirk that matches its hazard. The options and the
 * conflict check are on the project's naming page (model-names.html).
 *
 * Quirks, as checked on 24 Nov 2026 (web pages opened in the naming thread):
 *   Alder        much of Venice stands on wooden piles, alder among them, that
 *                have lasted centuries under water (Britannica, "How Was
 *                Venice Built on Water?").
 *   Ginkgo       a "living fossil": the ginkgo line goes back to the age of
 *                the dinosaurs.
 *   Yew          ancient yews are thought to be 2,000 years old or more and go
 *                hollow while still living (Woodland Trust, ancient yews).
 *   Poplar       poplars and aspens have flattened leaf stalks, so their leaves
 *                flutter in the faintest breeze (Natural Resources Canada,
 *                trembling aspen factsheet).
 *   Ash          ash wood burns well even green ("ash green is fit for a
 *                queen").
 *   Bristlecone  the oldest living bristlecones are close to 5,000 years old,
 *                their history packed into tight rings.
 *
 * These are display names only. Repositories, code, commands and engine
 * commits keep their own names (FloodSim, HeatSim, insar_pipeline, WindSim,
 * FireSim), so source citations on the site still name the repository they
 * come from; `engine` below is how a page says which engine a model runs on.
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
  flood: { name: "Alder", why: "Much of Venice stands on wooden piles, alder among them, that have lasted centuries under water. Alder knows water.", engine: "FloodSim" },
  heat: { name: "Ginkgo", why: "A living fossil that has come through every hot spell since the dinosaurs. Ginkgo reads sun and shade, hour by hour.", engine: "HeatSim" },
  ground: { name: "Yew", why: "Yews can stand for 2,000 years, hollow inside and still upright. Yew watches the ground under you.", engine: "SPARC InSAR" },
  wind: { name: "Poplar", why: "Poplar leaves hang on flattened stalks, so they flutter in the faintest breeze. Poplar follows the gusts between buildings.", engine: "WindSim" },
  fire: { name: "Ash", why: "Ash wood burns well even green, the old saying goes. Ash follows a fire and its embers toward the house.", engine: "FireSim" },
};

/** The buyer-facing name of a model. */
export const modelName = (id: EngineId): string => MODEL_NAMES[id].name;

/** The checker that scores every model's misses by code length (gridzip-lab
 *  codelen and physlib). The oldest bristlecones pack close to 5,000 years of
 *  weather into tight rings: compression, grown. */
export const CHECKER_NAME = "Bristlecone";
