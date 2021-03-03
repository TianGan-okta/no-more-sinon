# no-more-sinon

Babel plugin to help convert [Sinon](https://sinonjs.org/) spies, stubs, and mocks to [Jest](https://jestjs.io/).

## Example

```
yarn demo [-m modify target file(s) in place] [-p <path to test file/directory>]
```

### Input

```js
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
```

### Output

```js
describe("timeout-enforcement/models/TimeoutEnforcement", () => {
  let testContext;
  beforeEach(() => {
    testContext = {};
    jest.useFakeTimers();
    testContext.foo = "abc";
  });
  it("has a Model and a Collection", () => {
    jest.advanceTimersByTime(100);
    expect(TimeoutEnforcement.Model).toBeDefined();
    expect(TimeoutEnforcement.Collection).toBeDefined();
  });
});
```

## Installation

```sh
$ npm install babel-plugin-no-more-sinon
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["babel-plugin-no-more-sinon"]
}
```

### Via CLI

```sh
$ babel --plugins babel-plugin-no-more-sinon script.js
```

### Via Node API

```javascript
require("babel-core").transform("code", {
  plugins: ["babel-plugin-no-more-sinon"]
});
```
