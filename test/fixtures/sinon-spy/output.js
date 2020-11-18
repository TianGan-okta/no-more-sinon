describe("sinon-spy", () => {
  let testContext;
  const obj = {
    method: (num) => num + 10,
    add: (a, b) => a + b,
  };

  function setupMock(ss) {
    this.stubs = {
      add: jest.spyOn(obj, "add"),
    };
  }

  beforeEach(() => {
    testContext = {};
    testContext.spies = {
      method: jest.spyOn(obj, "method"),
    };
    setupMock.call(testContext, testContext.ss);
  });
  it("spy on method", () => {
    expect(obj.method(5)).toBe(15);
    expect(testContext.spies.method).toHaveBeenCalled();
    expect(testContext.spies.method.mock.calls.length).toBe(1);
    expect(testContext.spies.method).toHaveBeenCalledTimes(1);
    expect(testContext.spies.method).toHaveBeenCalledWith(5);
    expect(testContext.spies.method.mock.calls[0][0]).toBe(5);
  });
});