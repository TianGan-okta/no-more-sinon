import {isBeforeEach, getBeforeEachBody, isEmptyCall} from "./beforeEach";
import {isRestoreSandbox, isSinonFunction, removeSandbox} from "./sinonSandbox";

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
      },

      ExpressionStatement(path) {
        // update the path with sandbox removal
        path.parentPath.traverse({
          ImportDeclaration(path) {
            removeSandbox(path, t);
          },

          ExpressionStatement(path) {
            if (isSinonFunction(path.node, t) || isRestoreSandbox(path.node, t)) {
              path.remove();
            }
          }
        });

        // remove empty function after sandbox removal
        if(isEmptyCall(path.node, t)) {
          path.remove();
        }

        /**
         * Change sinon spy methods and properties to jest
         * - expect(testContext.spies.method.called).toBe(true); => expect(testContext.spies.method).toHaveBeenCalled();
         * - expect(testContext.spies.method.calledOnce).toBe(true); => expect(testContext.spies.method).toHaveBeenCalledTimes(1);
         * - expect(testContext.spies.method.calledWith(5)).toBe(true); => expect(testContext.spies.method).toHaveBeenCalledWith(5);
         */
        else if (
          path.get("expression").isCallExpression() &&
          path.get("expression.callee").isMemberExpression() &&
          path.get("expression.callee.object").isCallExpression() &&
          path.get("expression.callee.object.callee").isIdentifier({ name: "expect" })
        ) {
          // .called
          if (
            path.get("expression.callee.object.arguments.0.property").isIdentifier({ name: "called" })
          ) {
            // Remove .called
            path.get("expression.callee.object.arguments.0").replaceWith(
              path.get("expression.callee.object.arguments.0.object")
            );
            // Replace .toBe(true) with .toHaveBeenCalled()
            path.get("expression.callee.property").replaceWith(
              t.identifier("toHaveBeenCalled")
            );
            path.get("expression.arguments.0").remove();
          }

          // .calledOnce
          else if (
            path.get("expression.callee.object.arguments.0.property").isIdentifier({ name: "calledOnce" })
          ) {
            // Remove .calledOnce
            path.get("expression.callee.object.arguments.0").replaceWith(
              path.get("expression.callee.object.arguments.0.object")
            );
            // Replace .toBe(true) with .toHaveBeenCalledTimes(1)
            path.get("expression.callee.property").replaceWith(
              t.identifier("toHaveBeenCalledTimes")
            );
            path.get("expression.arguments.0").replaceWith(t.numericLiteral(1));
          }

          // .calledWith
          else if (
            path.get("expression.callee.object.arguments.0").isCallExpression() &&
            path.get("expression.callee.object.arguments.0.callee.property").isIdentifier({ name: "calledWith" })
          ) {
            // Remove .calledWith(x)
            const calledWithArgs = path.node.expression.callee.object.arguments[0].arguments
            path.get("expression.callee.object.arguments.0").replaceWith(
              path.get("expression.callee.object.arguments.0.callee.object")
            );
            // Replace .toBe(true) with .toHaveBeenCalledTimes(x)
            path.get("expression.callee.property").replaceWith(
              t.identifier("toHaveBeenCalledWith")
            );
            path.get("expression").replaceWith(
              t.callExpression(path.node.expression.callee, calledWithArgs)
            );
          }
        }
      },

      CallExpression(path) {
        /**
         * Change sinon spy to jest spyOn
         * testContext.ss.spy(obj, 'method') => jest.spyOn(obj, 'method')
         */
        if (
          path.get("callee.property").isIdentifier({ name: "spy" }) &&
          path.get("arguments").length === 2 &&
          path.get("arguments")[0].isIdentifier() &&
          path.get("arguments")[1].isLiteral()
        ) {
          path.get("callee").replaceWith(
            t.memberExpression(t.identifier('jest'), t.identifier('spyOn'))
          )
        }
      },

      MemberExpression(path) {
        /**
         * Change sinon spy methods and properties to jest
         * - testContext.spies.method.callCount => testContext.spies.method.mock.calls.length
         * - testContext.spies.method.args[0][0] => testContext.spies.method.mock.calls[0][0]
         */

        // .callCount
        if (
          path.get("property").isIdentifier({ name: "callCount" })
        ) {
          path.replaceWith(
            t.memberExpression(
              t.memberExpression(
                t.memberExpression(
                  path.node.object,
                  t.identifier("mock")
                ),
                t.identifier("calls")
              ),
              t.identifier("length")
            )
          );
        }

        // .args
        else if (
          path.get("property").isIdentifier({ name: "args" }) &&
          path.parentPath.isMemberExpression() &&
          path.parentPath.get("property").isNumericLiteral()
        ) {
          path.replaceWith(
            t.memberExpression(
              t.memberExpression(
                path.node.object,
                t.identifier("mock")
              ),
              t.identifier("calls")
            )
          )
        }
      },
    }
  };
}
