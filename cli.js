#!/usr/bin/env node
'use strict';
const btcValue = require('btc-value');
const meow = require('meow');
const fs = require('fs');
const chalk = require('chalk');
const Ora = require('ora');
const logSymbols = require('log-symbols');
const spinner = new Ora();
const configFile = __dirname + '/config.json';
const config = require(configFile);
let defaultCurrency = config.default;
let quantity = config.quantity;
let autorefresh = config.autorefresh;
let autorefreshTimer;

const cli = meow(`
        Usage
        $ btc-value
        
        Options
          --decimal -d                  Print value as decimal
          --save -s [code]              Set the currency that will be used by default
          --currency -c [code]          Print the value in another currency         
          --list -l                     Print a list of all supported currencies
          --quantity -q [number]        Print the value of the given quantity
          --autorefresh -a [seconds]    Automatic refresh printing every x seconds
          --percentage -p [h|d|w]       Print the percentage change

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
            $17273
        $ btc-value -p h
            -0.08%
`, {
    flags: {
        decimal: {
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
        autorefresh: {
            type: 'integer',
            alias: 'a'
        },
        percentage: {
            type: 'string',
            alias: 'p'
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
        spinner.stop();
        console.log(chalk.redBright(`${logSymbols.error} Please choose a valid currency code`));
        console.log('Type `btc-value -l` for a list of all valid currencies');
        process.exit(1);
    }

    return currency;
}

// Helper functon for printing and stopping the spinner
function printOutput(input) {
    spinner.stop();
    console.log(input);
}

// Helper function for printing percentage in red and green
function printPercentage(percentage) {
    if (percentage.startsWith('-')) {
        printOutput(chalk.redBright(percentage));
    } else {
        printOutput(chalk.green(percentage));
    }
}

// Helper function to print error and exit with code 1
function exitError(error) {
    spinner.stop();
    console.log(chalk.redBright(`${logSymbols.error} ${error}`));
    process.exit(1);
}

// For calling all funtions every time in a timeout with `a` flag
function checkAllFlags() {
    // If `s` flag is set => set currency as default
    if (cli.flags.s !== undefined) {
        defaultCurrency = isValidCurrencyCode(cli.flags.s);

        const newConfig = JSON.stringify(
            {
                default: {
                    code: defaultCurrency.code,
                    symbol: defaultCurrency.symbol
                },
                quantity: quantity,
                autorefresh: autorefresh
            }, null, 4);

        fs.writeFile(configFile, newConfig, function(error) {
            if (error) {
                exitError('Something wrong happened, could not save new default currency.');
            } else {
                console.log(chalk.green(`${logSymbols.success} Default currency set to: ${defaultCurrency.code} (${defaultCurrency.symbol})`));
            }
        });
    }

    let multiplier = 1;

    if (cli.flags.q) {
        if (typeof cli.flags.q === 'number') {
            // Check if quantity is not the same as the old one
            if (quantity !== cli.flags.q) {
                // Save the new value of `quantity`
                quantity = cli.flags.q;
                const newConfig = JSON.stringify(
                    {
                        default: {
                            code: defaultCurrency.code,
                            symbol: defaultCurrency.symbol
                        },
                        quantity: quantity,
                        autorefresh: autorefresh
                    }, null, 4);

                fs.writeFile(configFile, newConfig, function(error) {
                    if (error) {
                        exitError('Something wrong happened, could not save new quantity.');
                    } else {
                        console.log(chalk.green(`${logSymbols.success} Quantity set to: ${quantity}`));
                        console.log(`Value of ${quantity} BTC:`);
                        spinner.start();
                    }
                });
            }
        } else {
            console.log(`Value of ${quantity} BTC:`);
            spinner.start();
        }

        multiplier = quantity;
    }

    // If `p` flag is set => print percentage change
    if (cli.flags.p !== undefined) {
        if (cli.flags.p === 'h') {
            btcValue.getPercentageChangeLastHour().then(percentage => {
                printPercentage(percentage + '%');
            }).catch(() => {
                exitError('Please check your internet connection');
            });
        } else if (cli.flags.p === 'd' || cli.flags.p === '') {
            btcValue.getPercentageChangeLastDay().then(percentage => {
                printPercentage(percentage + '%');
            }).catch(() => {
                exitError('Please check your internet connection');
            });
        } else if (cli.flags.p === 'w') {
            btcValue.getPercentageChangeLastWeek().then(percentage => {
                printPercentage(percentage + '%');
            }).catch(() => {
                exitError('Please check your internet connection');
            });
        } else {
            exitError('Invalid percentage input. Check `btc-value --help`.');
        }
    } else {
        // If `d` flag is set => return value as decimal
        // USD is the default currency in the API
        // If `c` flag is set => convert to other currency
        // Print value of given `quantity` or just 1 BTC
        if (cli.flags.c) {
            const currency = isValidCurrencyCode(cli.flags.c);
        
            btcValue({currencyCode: cli.flags.c, isDecimal: cli.flags.d, quantity: multiplier}).then(value => {
                printOutput(`${chalk.yellow(currency.symbol)}${value}`);
            }).catch(e => {
                console.log(e);
                exitError('Please check your internet connection');
            });
        } else {
            btcValue({currencyCode: defaultCurrency.code, isDecimal: cli.flags.d, quantity: multiplier}).then(value => {
                printOutput(`${chalk.yellow(defaultCurrency.symbol)}${value}`);
            }).catch(() => {
                exitError('Please check your internet connection');
            });
        }
    }

    // If `a` flag is set => set interval for automatic refreshing value printing
    if (cli.flags.a !== undefined) {
        if (cli.flags.a !== true) {
            autorefresh = cli.flags.a;
        }

        autorefreshTimer = setTimeout(checkAllFlags, autorefresh * 1000);
        spinner.start();
    }
}

// If `l` flag is set => print list of supported currency codes
if (cli.flags.l) {
    let currencyOutprint = '  List of all supported currency codes:';

    for (let i = 0; i < btcValue.currencies.length; i++) {
        // To seperate the currency codes on different lines
        if (i % 9 === 0) {
            currencyOutprint += '\n      ';
        }
        
        currencyOutprint += btcValue.currencies[i].code;
        if (i !== btcValue.currencies.length - 1) {
            currencyOutprint += ', ';
        }
    }

    console.log(currencyOutprint);
    process.exit(0);
}

checkAllFlags();