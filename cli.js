#!/usr/bin/env node
'use strict;'
const btcValue = require('btc-value');
const meow = require('meow');
const fs = require('fs');
const configFile = './config.json';
const config = require(configFile);
let defaultCurrency = config.default;

const cli = meow(`
        Usage
        $ btc-value
        
        Options
          --double -d           Print value as double
          --save -s [code]      Set the currency that will be used by default
          --currency -c [code]  Print the value in another currency         
          --list -l             Print a list of all available currencies

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
        process.exit(0);
    }
    return currency;
}

// If l flag is set => print list of currency codes
if (cli.flags.l) {
    console.log(`
    List of all available currency codes:
        AUD, BRL, CAD, CHF, CLP, CNY, CZK, DKK,
        EUR, GBP, HKD, HUF, IDR, ILS, INR, JPY,
        KRW, MXN, MYR, NOK, NZD, USD, PHP, PKR,
        PLN, RUB, SEK, SGD, THB, TRY, TWD, ZAR
    `);
    process.exit(0);
}

// If c flag is set => set currency as default
if (cli.flags.s !== undefined) {
    defaultCurrency = isValidCurrencyCode(cli.flags.s);
    console.log(defaultCurrency.code);
    console.log(defaultCurrency.symbol);

    const newConfig = JSON.stringify(
        {
            "default": {
                "code": defaultCurrency.code,
                "symbol": defaultCurrency.symbol
            }
        }, null, 4);

    fs.writeFile(configFile, newConfig, function(error) {
        if (error) {
            console.log('Something wrong happened, could not save new default currency.');
        }
    });
    
    console.log('Default currency set to: ' + defaultCurrency.code + ' (' + defaultCurrency.symbol + ')');
}

// If d flag is set => return value as double
// USD is the default currency in the API
// If c flag is set => convert to other currency
if (cli.flags.c) {
    const currency = isValidCurrencyCode(cli.flags.c);

    if (currency.code === 'USD') {
        btcValue(cli.flags.d).then((value) => {
            console.log(currency.symbol + value);
        });
    } else {
        btcValue.getConvertedValue(currency.code, cli.flags.d).then((value) => {
            console.log(currency.symbol + value);
        });
    }
} else {
    console.log(defaultCurrency);
    if (defaultCurrency.code === 'USD') {
        btcValue(cli.flags.d).then((value) => {
            console.log(defaultCurrency.symbol + value);
        });
    } else {
        btcValue.getConvertedValue(defaultCurrency.code, cli.flags.d).then((value) => {
            console.log(defaultCurrency.symbol + value);
        });
    }
}