import { isFalsy, addNotExpect } from "./jestHelpers";

/**
 * Removes references to sandbox
 */
export const removeSandboxVisitor = (sandboxName) => ({
  ExpressionStatement(path) {
    if (
      path.get("expression.callee").isMemberExpression() &&
      path.get("expression.callee.object").isIdentifier({ name: sandboxName })
    ) {
      path.remove();
    }
  }
});

/**
 * Handles sinon sandbox methods
 */
const convertSinonMethodsVisitor = (sinonName, sinonSandboxName, t) => ({
  CallExpression(path) {
    /**
     * Handle methods 
     * - sinon.spy(obj, 'method') => jest.spyOn(obj, 'method')
     * - testContext.ss.spy(obj, 'method') => jest.spyOn(obj, 'method')
     * - testContext.ss.stub(obj, 'method').return(true) => jest.spyOn(obj, 'method').mockImplementation(() => { return true; })
     * - testContext.ss.restore()
     */

    if (
      path.get("callee.object").isIdentifier({ name: sinonName }) ||
      path.get("callee.object").isIdentifier({ name: sinonSandboxName }) ||
      (
        path.get("callee.object").isMemberExpression() &&
        path.get("callee.object.property").isIdentifier({ name: sinonSandboxName })
      )
    ) {
      // .spy
      if (
        path.get("callee.property").isIdentifier({ name: "spy" }) &&
        path.get("arguments").length === 2 &&
        path.get("arguments.0").isIdentifier() &&
        path.get("arguments.1").isStringLiteral()
      ) {
        path.get("callee").replaceWith(
          t.memberExpression(t.identifier('jest'), t.identifier('spyOn'))
        )
      }
      // .stub
      else if (
        path.get("callee.property").isIdentifier({ name: "stub" }) &&
        path.get("arguments").length === 2 &&
        path.get("arguments.1").isStringLiteral()
      ) {
        const parent = path.parentPath;
        // Handle testContext.ss.stub(obj, 'method').returns(true)
        if (
          parent.isMemberExpression() &&
          parent.get("property").isIdentifier({ name: "returns" }) &&
          parent.parentPath.isCallExpression()
        ) {
          parent.get("property").replaceWith(t.identifier('mockImplementation'));
          const mockedArguments = parent.parentPath.get('arguments.0').node;
          const mockFunction = t.arrowFunctionExpression([], t.blockStatement([
            t.returnStatement(mockedArguments)
          ]));
          parent.parentPath.get('arguments.0').replaceWith(mockFunction);
          path.get("callee").replaceWith(
            t.memberExpression(t.identifier("jest"), t.identifier("spyOn"))
          );
        }
        // Handle testContext.ss.stub(obj, 'method')
        else if (
          !parent.isMemberExpression()
        ) {
          path.replaceWith(
            t.callExpression(
              t.memberExpression(
                t.callExpression(
                  t.memberExpression(
                    t.identifier("jest"),
                    t.identifier("spyOn")
                  ),
                  path.node.arguments
                ),
                t.identifier("mockImplementation")
              ),
              [t.arrowFunctionExpression([], t.blockStatement([]))]
            )
          );
        }    
      }
      // .restore
      else if (path.get("callee.property").isIdentifier({ name: "restore" })) {
        path.getStatementParent().remove();
      }
    }
  }
});

/**
 * Handles converting sinon timers to jest timers
 */
const convertTimersVisitor = (clockName, isVariable, t) => ({
  CallExpression(path) {
    /**
     * Handle timer tick
     * - testContext.ss.clock.tick(100) => jest.advanceTimersByTime(100)
     * - clock.tick(100) => jest.advanceTimersByTime(100)
     */
    if (
      path.get("callee.property").isIdentifier({ name: "tick" }) &&
      (
        (
          isVariable &&
          path.get("callee.object").isIdentifier({ name: clockName })
        ) ||
        (
          !isVariable &&
          path.get("callee.object").isMemberExpression() &&
          path.get("callee.object.property").isIdentifier({ name: clockName })
        )
      ) &&
      path.get("arguments").length === 1 &&
      path.get("arguments.0").isNumericLiteral()
    ) {
      path.getStatementParent().replaceWith(
        t.expressionStatement(
          t.callExpression(
            t.memberExpression(
              t.identifier("jest"),
              t.identifier("advanceTimersByTime")
            ),
            path.node.arguments
          )
        )
      );
    }
  }
});

/**
 * Removes references to sinon
 */
export const removeSinonVisitor = (sinonName, t) => ({
  CallExpression(path) {
    /**
     * Handle methods directly on the sinon object
     * - sinon.createSandbox()
     * - sinon.createSandbox({ useFakeTimers: true })
     * - sinon.createSandbox({ useFakeTimers: true, useFakeServer: true })
     * - sinon.useFakeTimers()
     */
    // sinon.
    if (path.get("callee").isMemberExpression() && path.get("callee.object").isIdentifier({ name: sinonName })) {
      // .createSandbox()
      if (path.get("callee.property").isIdentifier({ name: "createSandbox" })) {
        // Remove references to the sinon sandbox timer if useFakeTimers: true
        if (
          path.get("arguments").length > 0 &&
          path.get("arguments.0").isObjectExpression() &&
          path.node.arguments[0].properties.findIndex((prop) => prop.key.name === "useFakeTimers") !== -1
        ) {
          path.findParent((parentPath) => parentPath.isProgram()).traverse(convertTimersVisitor("clock", false, t));
          // insert jest.useFakeTimers()
          path.getStatementParent().insertBefore(
            t.expressionStatement(
              t.callExpression(
                t.memberExpression(
                  t.identifier("jest"),
                  t.identifier("useFakeTimers")
                ),
                []
              )
            )
          );
        }

        // Remove spy references to the sinon sandbox
        const statementParent = path.getStatementParent();
        if (
          statementParent.isExpressionStatement() &&
          statementParent.get("expression").isAssignmentExpression()
        ) {
          /**
           * Handles either
           * - testContext.ss = sinon.createSandbox()
           * - ss = sinon.createSandbox()
           */
          const sinonSandboxName = statementParent.get("expression.left").isMemberExpression()
            ? statementParent.node.expression.left.property.name // left is MemberExpression
            : statementParent.node.expression.left.name; // left is Identifier
          
          path.findParent((parentPath) => parentPath.isProgram()).traverse(convertSinonMethodsVisitor(sinonName, sinonSandboxName, t));
        }

        statementParent.remove();
      }

      // .useFakeTimers()
      else if (path.get("callee.property").isIdentifier({ name: "useFakeTimers" })) {
        const statementParent = path.getStatementParent();
        // const clock = sinon.useFakeTimers()
        if (statementParent.isVariableDeclaration()) {
          const variableDeclarator = path.findParent((parentPath) => parentPath.isVariableDeclarator());
          const clockName = variableDeclarator.node.id.name;
          path.findParent((parentPath) => parentPath.isProgram()).traverse(convertTimersVisitor(clockName, true, t));
        }
        // testContext.clock = sinon.useFakeTimers
        else if (statementParent.isExpressionStatement() && statementParent.get("expression").isAssignmentExpression()) {
          const clockName = statementParent.node.expression.left.property.name;
          path.findParent((parentPath) => parentPath.isProgram()).traverse(convertTimersVisitor(clockName, false, t));
        }

        // Replace with jest.useFakeTimers()
        statementParent.replaceWith(
          t.expressionStatement(
            t.callExpression(
              t.memberExpression(
                t.identifier("jest"),
                t.identifier("useFakeTimers")
              ),
              []
            )
          )
        );
      }
    }
  },

  ExpressionStatement(path) {
    /**
     * Change sinon spy methods and properties to jest
     * - expect(testContext.spies.method.called).toBe(true); => expect(testContext.spies.method).toHaveBeenCalled();
     * - expect(testContext.spies.method.calledOnce).toBe(true); => expect(testContext.spies.method).toHaveBeenCalledTimes(1);
     * - expect(testContext.spies.method.calledWith(5)).toBe(true); => expect(testContext.spies.method).toHaveBeenCalledWith(5);
     */
    if (
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
        // If falsy, add .not
        if (isFalsy(path)) {
          addNotExpect(path, t);
        }
        // Replace .toBe(x) with .toHaveBeenCalled()
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
        // If falsy, add .not
        if (isFalsy(path)) {
          addNotExpect(path, t);
        }
        // Replace .toBe(x) with .toHaveBeenCalledTimes(1)
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
        // If falsy, add .not
        if (isFalsy(path)) {
          addNotExpect(path, t);
        }
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
});
