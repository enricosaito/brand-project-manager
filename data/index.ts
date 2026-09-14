/**
 * Mock data layer.
 *
 * Everything the UI renders comes from here via the workspace store. When a
 * backend exists, this module (and the store's initial state) is the only
 * thing that needs to change.
 */
export { members, CURRENT_MEMBER_ID } from "./members"
export { projects } from "./projects"
export { assets } from "./assets"
export { tasks } from "./tasks"
export { activity } from "./activity"
export { COVER_OPTIONS, UPLOAD_SAMPLES, unsplash } from "./images"
