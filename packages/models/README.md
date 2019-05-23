# Mongoose models for Alice donations platform

## Usage

You can use the models like this:

```javascript
const mongoose = require('mongoose');
const User = require('@alice-si/models/user')(mongoose);
const Mail = require('@alice-si/models/mail')(mongoose);
```

## Tests

Can be run with `yarn test`.
