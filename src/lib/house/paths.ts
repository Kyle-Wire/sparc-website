/**
 * Where a house's account files live in the private "reports" bucket, next to
 * the PDF (<user_id>/<order_id>.pdf) and the package (src/lib/payments/package.ts).
 * No database column: the path follows from the order, like the package.
 *
 *   <user_id>/<order_id>-house.json          the dashboard (HouseBundle)
 *   <user_id>/<order_id>-whatif-model.json   the house's flood emulator (CHI validate.mjs --export)
 *   <user_id>/<order_id>-whatif-engine.js    FloodSim's emulator + cascade code (CHI page.mjs engineScript)
 *
 * The engine is a private file, not part of this public repo: FloodSim's code
 * reaches only the browser of a buyer who owns the house.
 */
export const HOUSE_SUFFIX = "-house.json";
export const WHATIF_MODEL_SUFFIX = "-whatif-model.json";
export const WHATIF_ENGINE_SUFFIX = "-whatif-engine.js";

export const housePath = (userId: string, orderId: string) => `${userId}/${orderId}${HOUSE_SUFFIX}`;
export const whatifModelPath = (userId: string, orderId: string) => `${userId}/${orderId}${WHATIF_MODEL_SUFFIX}`;
export const whatifEnginePath = (userId: string, orderId: string) => `${userId}/${orderId}${WHATIF_ENGINE_SUFFIX}`;
