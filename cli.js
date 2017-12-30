#!/usr/bin/env node
'use strict;'
const btcValue = require('btc-value');
const meow = require('meow');
const fs = require('fs');
const configFile = __dirname + '/config.json';
const config = require(configFile);
let defaultCurrency = config.default;
let myQuantity = config.my_quantity;
let countdownTimer = config.countdown;

const cli = meow(`
        Usage
        $ btc-value
        
        Options
          --double -d                   Print value as double
          --save -s [code]              Set the currency that will be used by default
          --currency -c [code]          Print the value in another currency         
          --list -l                     Print a list of all available currencies
          --quantity -q [number]        Print the value of the given quantity
          --myquantity -m [number]      Set my quantity, or print it if [number] is nothing
          --autorefresh -a [seconds]    Automatic refresh printing every x seconds

        Examples
        $ btc-value
            $16258
        $ btc-value -d
            $16258.2
        $ btc-value -s NOK
            Default currency set as: NOK (kr)
            kr158053
        $ btc-value -c NOK
            kr129640
        $ btc-value -q 2.2
`, {
    flags: {
        double: {
            type: 'boolean',
            alias: 'd'
        },
        save: {
            type: 'string',
            alias: 's'
        },
        currency: {
            type: 'string',
            alias: 'c'
        },
        list: {
            type: 'boolean',
            alias: 'l'
        },
        quantity: {
            type: 'double',
            alias: 'q'
        },
        myquantity: {
            type: 'double',
            alias: 'm'
        },
        autorefresh: {
            type: 'integer',
            alias: 'a'
        }
    }
});

// Search currency list if input currency code matches any 
function isValidCurrencyCode(currencyCode) {
    currencyCode = currencyCode.toUpperCase();
    let currency;
    for (let i = 0; i < btcValue.currencies.length; i++) {
        if (currencyCode === btcValue.currencies[i].code) {
            currency = btcValue.currencies[i];
            break;
        }
    }

    if (!currency) {
        console.log('Please choose a valid currency code');
        console.log('Type `btc-value -l` for a list of valid currencies');
        process.exit(1);
    }
    return currency;
}

// If `l` flag is set => print list of supported currency codes
if (cli.flags.l) {
    let currencyOutprint = '    List of all supported currency codes:';
    for (let i = 0; i < btcValue.currencies.length; i++) {
        // To seperate the currency codes on different lines
        if (i % 9 === 0) {
            currencyOutprint += '\n        ';
        }
        
        if (i !== btcValue.currencies.length - 1) {
            currencyOutprint += btcValue.currencies[i].code + ', ';
        } else {
            currencyOutprint += btcValue.currencies[i].code;
        }
    }
    console.log(currencyOutprint);
    process.exit(0);
}

// If `q` flag is set, but not assigned any value 
if (cli.flags.q === true) {
    console.log('Please choose a valid quantity for the q flag');
    console.log('Type `btc-value --help` to see how to use the flag');
    process.exit(1);
}

let intervalTimer;
// If `a` flag is set => set interval for automatic refreshing value printing
if (cli.flags.a !== undefined) {
    if (cli.flags.a !== true) {
        countdownTimer = cli.flags.a;
    }
    intervalTimer = setInterval(checkAllFlags, countdownTimer * 1000);
}
checkAllFlags();

// For calling all funtions every time in a interval with `a` flag
function checkAllFlags() {
    // If `c` flag is set => set currency as default
    if (cli.flags.s !== undefined) {
        defaultCurrency = isValidCurrencyCode(cli.flags.s);

        const newConfig = JSON.stringify(
            {
                "default": {
                    "code": defaultCurrency.code,
                    "symbol": defaultCurrency.symbol
                },
                "my_quantity": myQuantity,
                "countdown": countdownTimer
            }, null, 4);

        fs.writeFile(configFile, newConfig, function(error) {
            if (error) {
                console.log('Something wrong happened, could not save new default currency.');
                process.exit(1);
            } else {
                console.log('Default currency set to: ' + defaultCurrency.code + ' (' + defaultCurrency.symbol + ')');
            }
        });
    }

    if (cli.flags.m) {
        if (cli.flags.q) {
            console.log('Can not write both m and q flag');
            console.log('Type `btc-value --help` to see how to use the flags');
            process.exit(1);
        }

        if (typeof cli.flags.m === 'number') {
            // Set new value of `myQuantity`
            myQuantity = cli.flags.m;
            const newConfig = JSON.stringify(
                {
                    "default": {
                        "code": defaultCurrency.code,
                        "symbol": defaultCurrency.symbol
                    },
                    "my_quantity": myQuantity,
                    "countdown": countdownTimer
                }, null, 4);

            fs.writeFile(configFile, newConfig, function(error) {
                if (error) {
                    console.log('Something wrong happened, could not save new quantity.');
                    process.exit(1);
                } else {
                    console.log('My quantity set to: ' + myQuantity);
                }
            });
        }
        console.log('Value of ' + myQuantity + ' BTC:');

        // Print value of `myQuantity`
        if (cli.flags.c) {
            const currency = isValidCurrencyCode(cli.flags.c);
        
            if (currency.code === 'USD') {
                btcValue(cli.flags.d, myQuantity).then((value) => {
                    console.log(currency.symbol + value);
                });
            } else {
                btcValue.getConvertedValue(currency.code, cli.flags.d, myQuantity).then((value) => {
                    console.log(currency.symbol + value);
                });
            }
        } else {
            if (defaultCurrency.code === 'USD') {
                btcValue(cli.flags.d, myQuantity).then((value) => {
                    console.log(defaultCurrency.symbol + value);
                });
            } else {
                btcValue.getConvertedValue(defaultCurrency.code, cli.flags.d, myQuantity).then((value) => {
                    console.log(defaultCurrency.symbol + value);
                });
            }
        }
    } else {
        checkForMoreFlags();
    }
}

// If `d` flag is set => return value as double
// USD is the default currency in the API
// If `c` flag is set => convert to other currency
function checkForMoreFlags() {
    if (cli.flags.q) {
        console.log('Value of ' + cli.flags.q + ' BTC:');
    }

    if (cli.flags.c) {
        const currency = isValidCurrencyCode(cli.flags.c);
    
        if (currency.code === 'USD') {
            btcValue(cli.flags.d, cli.flags.q).then((value) => {
                console.log(currency.symbol + value);
            });
        } else {
            btcValue.getConvertedValue(currency.code, cli.flags.d, cli.flags.q).then((value) => {
                console.log(currency.symbol + value);
            });
        }
    } else {
        if (defaultCurrency.code === 'USD') {
            btcValue(cli.flags.d, cli.flags.q).then((value) => {
                console.log(defaultCurrency.symbol + value);
            });
        } else {
            btcValue.getConvertedValue(defaultCurrency.code, cli.flags.d, cli.flags.q).then((value) => {
                console.log(defaultCurrency.symbol + value);
            });
        }
    }
}