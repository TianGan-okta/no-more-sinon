/**
 * Returns true if the jest expect statement is one of the following:
 * - .toBe(false)
 * - .toEqual(false)
 * - .toBeFalsy()
 * 
 * @param path -- ExpressionStatement with expect
 */
export const isFalsy = (path) => {
  const propertyName = path.get("expression.callee.property");
  const argument = path.get("expression.arguments.0");

  return propertyName.isIdentifier({ name: "toBeFalsy" }) || (
    (
      propertyName.isIdentifier({ name: "toBe" }) ||
      propertyName.isIdentifier({ name: "toEqual" })
    ) && argument.isBooleanLiteral({ value: false })
  );
};

/**
 * Adds .not to the jest expect statement
 * @param path -- ExpressionStatement with expect
 * @param t -- types
 */

export const addNotExpect = (path, t) => {
  path.get("expression.callee.object").replaceWith(
    t.memberExpression(
      path.node.expression.callee.object,
      t.identifier("not")
    )
  )
};
