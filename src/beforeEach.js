export function isBeforeEach(t, value) {
  return t.isExpressionStatement(value)
      && t.isCallExpression(value.expression)
      && t.isIdentifier(value.expression.callee)
      && value.expression.callee.name === 'beforeEach';
}

export function getBeforeEachBody(t, value) {
  return value.expression
      .arguments[0]  // ArrowFunctionExpression or FunctionExpression
      .body  // BlockStatement
      .body
}

export function isEmptyCall(value, t) {
  return t.isCallExpression(value.expression)
      && value.expression.arguments.length===1
      && t.isArrowFunctionExpression(value.expression.arguments[0])
      && t.isBlockStatement(value.expression.arguments[0].body)
      && value.expression.arguments[0].body.body.length === 0;
}
