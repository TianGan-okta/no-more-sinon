export function isSinonFunction(value, t) {
    return t.isCallExpression(value.expression.right)
        && value.expression.right.callee.object.name === 'sinon'
}

export function isRestoreSandbox(value, t) {
  return t.isMemberExpression(value.expression.callee)
      && t.isMemberExpression(value.expression.callee.object)
      && value.expression.callee.object.property.name === 'ss'
      && value.expression.callee.property.name === 'restore'
}

export function removeSandbox(path, t) {
    if(path.node.source.value === 'sandbox') {
        const sinonLocal = path.node.specifiers[0].local.name;
        path.parentPath.traverse({
            ExpressionStatement(path) {
                if(t.isMemberExpression(path.node.expression.callee) && path.node.expression.callee.object.name === sinonLocal) {
                    path.remove();
                }
            },
        });
        path.remove();
    }
}
