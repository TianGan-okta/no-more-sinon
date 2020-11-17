# babel-plugin-bable-plugin-dedup-before-each



## Example

**In**

```js
// input code
```

**Out**

```js
"use strict";

// output code
```

## Installation

```sh
$ npm install babel-plugin-bable-plugin-dedup-before-each
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["bable-plugin-dedup-before-each"]
}
```

### Via CLI

```sh
$ babel --plugins bable-plugin-dedup-before-each script.js
```

### Via Node API

```javascript
require("babel-core").transform("code", {
  plugins: ["bable-plugin-dedup-before-each"]
});
```
