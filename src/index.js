function isBeforeEach(t, value) {
  return t.isExpressionStatement(value)
    && t.isCallExpression(value.expression)
    && t.isIdentifier(value.expression.callee)
    && value.expression.callee.name === 'beforeEach';
}

function getBeforeEachBody(t, value) {
  return value.expression
    .arguments[0]  // ArrowFunctionExpression or FunctionExpression
    .body  // BlockStatement
    .body
}

module.exports = function ({ types: t }) {
  return {
    visitor: {
      BlockStatement(path, state) {
        const beforeEachExp = path.node.body.filter(isBeforeEach.bind(this, t));
        if (beforeEachExp.length >= 2) {
          state.opts.ignore = false;
          const otherBeforeEach = beforeEachExp.slice(0, beforeEachExp.length - 1);

          let otherBodys = [];
          otherBeforeEach.forEach(exp => {
            const b = getBeforeEachBody(t, exp);
            otherBodys = otherBodys.concat(b);
          });

          const lastBeforeEach = beforeEachExp[beforeEachExp.length - 1];
          const lastBeforeEachBody = getBeforeEachBody(t, lastBeforeEach);
          otherBodys.forEach(exp => {
            lastBeforeEachBody.unshift(exp);
          });

          // console.log(lastBeforeEachBody);
          path.node.body = path.node.body.filter(b => {
            return otherBeforeEach.indexOf(b) === -1;
          });
        }
      }
    }
  };
}
