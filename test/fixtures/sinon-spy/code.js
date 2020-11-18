describe('sinon-spy', () => {
  let testContext;
  const obj = {
    method: (num) => num + 10,
    add: (a, b) => a + b
  };

  function setupMock(ss) {
    this.stubs = {
      add: ss.spy(obj, 'add'),
    };
  }

  beforeEach(() => {
    testContext = {};
    testContext.ss = sinon.createSandbox();
    testContext.spies = {
      method: testContext.ss.spy(obj, 'method')
    };
    setupMock.call(testContext, testContext.ss);
  });

  it('spy on method', () => {
    expect(obj.method(5)).toBe(15);
    expect(testContext.spies.method.called).toBe(true);
    expect(testContext.stubs.add.called).toBe(false);
    expect(testContext.spies.method.callCount).toBe(1);
    expect(testContext.spies.method.calledOnce).toBe(true);
    expect(testContext.stubs.add.calledOnce).toBe(false);
    expect(testContext.spies.method.calledWith(5)).toBe(true);
    expect(testContext.stubs.add.calledWith(5)).toBe(false);
    expect(testContext.spies.method.args[0][0]).toBe(5);
    expect(testContext.spies.method.args[0][0]).not.toBe(10);
  });
});