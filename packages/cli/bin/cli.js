#!/usr/bin/env node

const argv = require('yargs')
  .command(require('./generate-keys'))
  .help()
  .demandCommand()
  .argv;
