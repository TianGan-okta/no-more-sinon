describe("timeout-enforcement/models/TimeoutEnforcement", () => {
  let testContext;
  beforeEach(() => {
    testContext = {};
    testContext.foo = "abc";
  });
  it("has a Model and a Collection", () => {
    expect(TimeoutEnforcement.Model).toBeDefined();
    expect(TimeoutEnforcement.Collection).toBeDefined();
  });
});
