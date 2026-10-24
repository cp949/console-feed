// oxlint JS plugin. ES 문법이 아닌 Web API 중 Chrome 75에 없는 호출을 막는다.
// eslint-plugin-es-x는 Web API를 검사하지 않아 별도 규칙으로 둔다.

const unsupportedCalls = [
  {
    path: ['structuredClone'],
    message: 'structuredClone은 Chrome 98부터 지원한다.',
  },
  {
    path: ['globalThis', 'structuredClone'],
    message: 'globalThis.structuredClone은 Chrome 98부터 지원한다.',
  },
  {
    path: ['crypto', 'randomUUID'],
    message: 'crypto.randomUUID는 Chrome 92부터 지원한다.',
  },
  {
    path: ['globalThis', 'crypto', 'randomUUID'],
    message: 'globalThis.crypto.randomUUID는 Chrome 92부터 지원한다.',
  },
]

// `a.b.c` 형태의 callee를 ['a', 'b', 'c']로 푼다. 계산식 접근과 다른 노드는 null이다.
function toPath(node) {
  if (node.type === 'Identifier') return [node.name]
  if (
    node.type === 'MemberExpression' &&
    !node.computed &&
    node.property.type === 'Identifier'
  ) {
    const objectPath = toPath(node.object)
    return objectPath && [...objectPath, node.property.name]
  }
  return null
}

const noUnsupportedWebApi = {
  create(context) {
    return {
      CallExpression(node) {
        const path = toPath(node.callee)?.join('.')
        const found = unsupportedCalls.find(
          (entry) => entry.path.join('.') === path,
        )
        if (found) context.report({ node, message: found.message })
      },
    }
  },
}

export default {
  meta: { name: 'chrome75' },
  rules: { 'no-unsupported-web-api': noUnsupportedWebApi },
}
