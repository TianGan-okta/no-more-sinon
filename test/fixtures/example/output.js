describe('timeout-enforcement/models/TimeoutEnforcement', () => {
  let testContext;
  beforeEach(() => {
    testContext = {};
    jest.useFakeTimers();
    testContext.foo = "abc";
  });
  it('has a Model and a Collection', () => {
    jest.advanceTimersByTime(100);
    expect(TimeoutEnforcement.Model).toBeDefined();
    expect(TimeoutEnforcement.Collection).toBeDefined();
  });
});