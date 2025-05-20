export function isVisualEditorPage(route: any) {
  return route.query['visual-editor'] === 'true' || route.query['visual-editor'] === true || route.query['visual-editor'] === 1
}
