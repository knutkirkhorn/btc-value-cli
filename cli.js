#!/usr/bin/env node

// TODO: remove when upgrading to ESM
// eslint-disable-next-line strict, lines-around-directive
'use strict';

const btcValue = require('btc-value');
const meow = require('meow');
const fs = require('fs');
const chalk = require('chalk');
const Ora = require('ora');
const logSymbols = require('log-symbols');
const path = require('path');

const spinner = new Ora();

const defaultConfiguration = {
    default: {
        name: 'United States Dollar',
        code: 'USD',
        symbol: '$'
    },
    quantity: 1,
    autorefresh: 15,
    apiKey: '',
    provider: 'coingecko'
};
const configFile = path.join(__dirname, './config.json');
let config;

try {
    // eslint-disable-next-line global-require
    config = require('./config.json');
} catch (e) {
    // Set the config to the default if its not found in the file
    config = defaultConfiguration;
}

let defaultCurrency = config.default;
let {quantity, autorefresh, apiKey} = config;
// eslint-disable-next-line no-unused-vars
let autorefreshTimer;

const cli = meow(`
        Usage
        $ btc-value
        
        Options
          --key -k                      Set the API key (Obtain key at: https://coinmarketcap.com/api/)
          --decimal -d                  Print value as decimal
          --save -s [code]              Set the currency that will be used by default
          --currency -c [code]          Print the value in another currency         
          --list -l                     Print a list of all supported currencies
          --quantity -q [number]        Print the value of the given quantity
          --autorefresh -a [seconds]    Automatic refresh printing every x seconds
          --percentage -p [h|d|w]       Print the percentage change (h = hour, d = day, w = week)
          --reset -r                    Reset the configuration to the default
          --provider [cmc|coingecko]    Set the currency provider to retrieve Bitcoin values from

        Examples
        $ btc-value
            $16258
        $ btc-value -k <example-API-key>
            √ API key is set
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
        $ btc-value --provider coingecko
            √ Set coingecko as currency provider
`, {
    flags: {
        key: {
            type: 'string',
            alias: 'k'
        },
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
            type: 'number',
            alias: 'q'
        },
        autorefresh: {
            type: 'number',
            alias: 'a'
        },
        percentage: {
            type: 'string',
            alias: 'p'
        },
        reset: {
            type: 'boolean',
            alias: 'r'
        },
        provider: {
            type: 'string'
        }
    }
});

// Search if input currency code matches any in the currency list
function isValidCurrencyCode(currencyCode) {
    // eslint-disable-next-line no-param-reassign
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

// Helper function for printing and stopping the spinner
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

function saveConfig(newConfig) {
    return new Promise((resolve, reject) => {
        // Save new config file
        fs.writeFile(configFile, newConfig, error => {
            if (error) {
                reject();
                return;
            }

            resolve();
        });
    });
}

// For calling all functions every time in a timeout with `a` flag
async function checkAllFlags() {
    // If `s` flag is set => set currency as default
    if (cli.flags.s !== undefined) {
        defaultCurrency = isValidCurrencyCode(cli.flags.s);

        const newConfig = JSON.stringify({
            default: {
                name: defaultCurrency.name,
                code: defaultCurrency.code,
                symbol: defaultCurrency.symbol
            },
            quantity,
            autorefresh,
            apiKey
        }, null, 4);

        try {
            await saveConfig(newConfig);
            console.log(chalk.green(`${logSymbols.success} Default currency set to: ${defaultCurrency.name} (${defaultCurrency.symbol})`));
        } catch (error) {
            exitError('Something wrong happened, could not save new default currency.');
        }
    }

    let multiplier = 1;
    const printAsDecimal = cli.flags.decimal;

    if (cli.flags.q) {
        if (typeof cli.flags.q === 'number') {
            // Check if quantity is not the same as the old one
            if (quantity !== cli.flags.q) {
                // Save the new value of `quantity`
                quantity = cli.flags.q;
                const newConfig = JSON.stringify({
                    default: {
                        name: defaultCurrency.name,
                        code: defaultCurrency.code,
                        symbol: defaultCurrency.symbol
                    },
                    quantity,
                    autorefresh,
                    apiKey
                }, null, 4);

                try {
                    await saveConfig(newConfig);
                    console.log(chalk.green(`${logSymbols.success} Quantity set to: ${quantity}`));
                    console.log(`Value of ${quantity} BTC:`);
                    spinner.start();
                } catch (error) {
                    exitError('Something wrong happened, could not save new quantity.');
                }
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
            try {
                const percentage = await btcValue.getPercentageChangeLastHour();
                printPercentage(`${percentage}%`);
            } catch (e) {
                console.log(e);
                exitError('Please check your internet connection');
            }
        } else if (cli.flags.p === 'd' || cli.flags.p === '') {
            try {
                const percentage = await btcValue.getPercentageChangeLastDay();
                printPercentage(`${percentage}%`);
            } catch (e) {
                console.log(e);
                exitError('Please check your internet connection');
            }
        } else if (cli.flags.p === 'w') {
            try {
                const percentage = await btcValue.getPercentageChangeLastWeek();
                printPercentage(`${percentage}%`);
            } catch (e) {
                console.log(e);
                exitError('Please check your internet connection');
            }
        } else {
            exitError('Invalid percentage input. Check `btc-value --help`.');
        }
    } else if (cli.flags.c) {
        // If `d` flag is set => return value as decimal
        // USD is the default currency in the API
        // If `c` flag is set => convert to other currency
        // Print value of given `quantity` or just 1 BTC
        const currency = isValidCurrencyCode(cli.flags.c);

        try {
            const value = await btcValue({currencyCode: cli.flags.c, isDecimal: printAsDecimal, quantity: multiplier});
            printOutput(`${chalk.yellow(currency.symbol)}${value}`);
        } catch (e) {
            console.log(e);
            exitError('Please check your internet connection');
        }
    } else {
        try {
            const value = await btcValue({currencyCode: defaultCurrency.code, isDecimal: printAsDecimal, quantity: multiplier});
            printOutput(`${chalk.yellow(defaultCurrency.symbol)}${value}`);
        } catch (e) {
            console.log(e);
            exitError('Please check your internet connection');
        }
    }

    // If `a` flag is set => set interval for automatic refreshing value printing
    if (cli.flags.a !== undefined) {
        if (cli.flags.a !== true) {
            autorefresh = cli.flags.a;
        }

        // eslint-disable-next-line no-unused-vars
        autorefreshTimer = setTimeout(checkAllFlags, autorefresh * 1000);
        spinner.start();
    }
}

// If `l` flag is set => print list of supported currency codes
if (cli.flags.l) {
    let currencyOutprint = '  List of all supported currency codes:';

    for (let i = 0; i < btcValue.currencies.length; i++) {
        // To separate the currency codes on different lines
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

const supportedProviders = ['cmc', 'coingecko'];

(async () => {
    if (cli.flags.provider) {
        if (!supportedProviders.includes(cli.flags.provider)) {
            exitError('Please select a valid currency provider');
        }

        const newConfig = JSON.stringify({
            default: {
                name: defaultCurrency.name,
                code: defaultCurrency.code,
                symbol: defaultCurrency.symbol
            },
            quantity,
            autorefresh,
            apiKey,
            provider: cli.flags.provider
        }, null, 4);

        try {
            await saveConfig(newConfig);
            console.log(chalk.green(`${logSymbols.success} Set \`${cli.flags.provider}\` as currency provider`));
        } catch (error) {
            exitError('Something wrong happened, could not save new currency provider');
        }

        process.exit(0);
    }

    // If `r` flag is set => reset configuration file
    if (cli.flags.r) {
        const newConfig = JSON.stringify(defaultConfiguration, null, 4);

        try {
            await saveConfig(newConfig);
            console.log(chalk.green(`${logSymbols.success} Default configuration reset to: ${defaultConfiguration.default.name} (${defaultConfiguration.default.symbol})`));
        } catch (error) {
            exitError('Something wrong happened, could not reset default configuration.');
        }

        process.exit(0);
    }

    // If `k` flag is set => set the API key
    if (cli.flags.k) {
        apiKey = cli.flags.k;

        const newConfig = JSON.stringify({
            default: {
                name: defaultCurrency.name,
                code: defaultCurrency.code,
                symbol: defaultCurrency.symbol
            },
            quantity,
            autorefresh,
            apiKey
        }, null, 4);

        try {
            await saveConfig(newConfig);
            console.log(chalk.green(`${logSymbols.success} API key is set`));
        } catch (error) {
            exitError('Something wrong happened, could not save API key.');
        }

        process.exit(0);
    }

    if (config.provider === 'cmc') {
        // Ensure that the API key is set if using data from CoinMarketCap
        if (!apiKey) {
            exitError('You need to provide an API key to use CMC as a provider for the CLI. Set CoinGecko as a provider using `btc-value --provider coingecko`.\nOr go to https://coinmarketcap.com/api/ for obtaining a key.');
        } else {
            btcValue.setApiKey(apiKey);
        }
    }

    checkAllFlags();
})();
