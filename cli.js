#!/usr/bin/env node
'use strict;'
const btcValue = require('btc-value');
const meow = require('meow');

const cli = meow(`
        Usage
        $ btc-value
        
        Options
          --double, -d get value as double

        Examples
        $ btc-value
            $16258
        $ btc-value -d
            $16258.2
`, {
    flags: {
        double: {
            type: 'double',
            alias: 'd'
        }
    }
});

if (cli.flags.d === undefined) {
    btcValue(true)
        .then((value) => {
            console.log(value);
        });
} else {
    btcValue()
        .then((value) => {
            console.log(value);
        });
}