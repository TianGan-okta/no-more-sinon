import {isBeforeEach, getBeforeEachBody, isEmptyCall} from "./beforeEach";
import {isRestoreSandbox, isSinonFunction, removeSinonVisitor, removeSandbox, removeSandboxVisitor} from "./sinonSandbox";

module.exports = function ({ types: t }) {
  return {
    visitor: {
      ImportDeclaration(path) {
        /**
         * If importing sinon, remove the declaration and references in the code
         * - import sinon from "sinon"
         * - import $sandbox from "sandbox"
         */
        if (path.get("source").isStringLiteral({ value: "sinon" })) {
          const sinonName = path.node.specifiers[0].local.name;
          path.findParent((parentPath) => parentPath.isProgram()).traverse(removeSinonVisitor(sinonName, t));
          path.remove();
        } else if (path.get("source").isStringLiteral({ value: "sandbox" })) {
          const sandboxName = path.node.specifiers[0].local.name;
          path.findParent((parentPath) => parentPath.isProgram()).traverse(removeSandboxVisitor(sandboxName));
          path.remove();
        }
      },

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
        /**
         * Remove empty statements such as beforeEach(() => {}) that occur after removing sandbox/sinon
         */
        if (
          (
            path.get("expression.callee").isIdentifier({ name: "beforeEach" }) ||
            path.get("expression.callee").isIdentifier({ name: "beforeAll" }) ||
            path.get("expression.callee").isIdentifier({ name: "afterEach" }) ||
            path.get("expression.callee").isIdentifier({ name: "afterAll" })
          ) &&
          isEmptyCall(path.node, t)
        ) {
          path.remove();
        }
      },
    }
  };
}
