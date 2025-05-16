import type { RouteLocationNormalized} from 'vue-router';

export function isVisualEditorPage(route: RouteLocationNormalized): boolean {
  return route.query['visual-editor'] && route.query['visual-editor'] === 'true' ? true : false
}
