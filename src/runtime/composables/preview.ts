export function isVisualEditorPage() {
  const route = useRoute()
  return route.query['visual-editor'] && route.query['visual-editor'] === 'true'
}
