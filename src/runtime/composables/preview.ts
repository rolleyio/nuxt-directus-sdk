export function isVisualEditorPage(route: any) {
  return route.query['visual-editor'] && route.query['visual-editor'] === 'true'
}
