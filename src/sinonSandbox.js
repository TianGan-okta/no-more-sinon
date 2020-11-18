export function removeSinonFunction(path, t) {
    const value = path.node;
    if (t.isCallExpression(value.expression.right)
        && value.expression.right.callee.object.name === 'sinon') {
        if (t.isMemberExpression(value.expression.left)
            && value.expression.right.callee.property.name === 'createSandbox') {
            path.findParent((path) => path.isProgram()).traverse({
                ExpressionStatement(path) {
                    if (isRestoreSandbox(path.node, t, value.expression.left.property.name)){
                        path.remove();
                    }
                },
                CallExpression(path) {
                    if (isSpy(path, value.expression.left.property.name)) {
                        path.get("callee").replaceWith(
                            t.memberExpression(t.identifier('jest'), t.identifier('spyOn'))
                        )
                    }else if (isStub(path.node, t, value.expression.left.property.name)){
                        const parentPath = path.findParent((path) => path.isCallExpression());
                        if (isNoArgStub(path.node)) {
                            path.replaceWith(
                                t.callExpression(t.memberExpression(t.identifier('jest'), t.identifier('fn')), [])
                            )
                        } else {
                            if (isReturnedStub(parentPath.node, t, value.expression.left.property.name)) {
                                parentPath.get('callee.property').replaceWith(t.identifier('mockImplementation'));
                                const mockedArguments = parentPath.get('arguments')[0].node;
                                const mockFunction = t.arrowFunctionExpression([], t.blockStatement([
                                    t.returnStatement(mockedArguments)
                                ]))
                                parentPath.get('arguments')[0].replaceWith(mockFunction);
                            }
                            path.get("callee").replaceWith(
                                t.memberExpression(t.identifier('jest'), t.identifier('spyOn'))
                            )
                        }
                    }
                }
            });
            path.remove();
        }
    }
}

export function isRestoreSandbox(value, t, name) {
  return t.isMemberExpression(value.expression.callee)
      && t.isMemberExpression(value.expression.callee.object)
      && value.expression.callee.object.property.name === name
      && value.expression.callee.property.name === 'restore'
}

function isStub(value, t, name) {
    return t.isMemberExpression(value.callee)
        && value.callee.object.name === name
        && value.callee.property.name === 'stub'
}

function isNoArgStub(value) {
    return value.arguments.length === 0;
}

function isReturnedStub(value, t, name) {
    return t.isMemberExpression(value.callee)
        && isStub(value.callee.object, t, name);
}

export function isSpy(path, name) {
    return path.get("callee.property").isIdentifier({ name: "spy" }) &&
        path.get("arguments").length === 2 &&
        path.get("arguments")[0].isIdentifier() &&
        path.get("arguments")[1].isLiteral()
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
