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
      },
    }
  };
}
