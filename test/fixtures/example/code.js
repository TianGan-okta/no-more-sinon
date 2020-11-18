import sinon from 'sinon';
import $sandbox from 'sandbox';

describe('timeout-enforcement/models/TimeoutEnforcement', () => {
  let testContext;

  beforeEach(() => {
    testContext = {};
  });

  beforeEach(() => {
    testContext.ss = sinon.createSandbox({
      useFakeTimers: true,
    });
    testContext.foo = "abc";
  });

  afterEach(() => {
    testContext.ss.restore();
    $sandbox.empty();
  });

  it('has a Model and a Collection', () => {
    testContext.ss.clock.tick(100);
    expect(TimeoutEnforcement.Model).toBeDefined();
    expect(TimeoutEnforcement.Collection).toBeDefined();
  });
});
