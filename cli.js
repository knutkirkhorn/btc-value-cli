#!/usr/bin/env node

import btcValue, {
	getSupportedCurrencies,
	getPercentageChangeLastHour,
	getPercentageChangeLastDay,
	getPercentageChangeLastWeek,
	setApiKey
} from 'btc-value';
import meow from 'meow';
import {writeFile, promises as fs} from 'node:fs';
import chalk from 'chalk';
import Ora from 'ora';
import logSymbols from 'log-symbols';
import path from 'node:path';
import getSymbolFromCurrency from 'currency-symbol-map';
import {fileURLToPath} from 'node:url';

const spinner = new Ora();

const defaultConfiguration = {
	default: 'USD',
	quantity: 1,
	autorefresh: 15,
	apiKey: '',
	provider: 'coingecko'
};
const directoryPath = path.dirname(fileURLToPath(import.meta.url));
const configFile = path.join(directoryPath, './config.json');
let config;

try {
	config = JSON.parse(await fs.readFile(path.join(directoryPath, './config.json')));
} catch {
	// Set the config to the default if its not found in the file
	config = defaultConfiguration;
}

let defaultCurrency = config.default;
let {
	quantity,
	autorefresh,
	apiKey, provider
} = config;
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
	  $ btc-value -k <example-API-key>
	  $ btc-value -d
	  $ btc-value -s NOK
	  $ btc-value -c NOK
	  $ btc-value -q 2.2
	  $ btc-value -p h
	  $ btc-value --provider coingecko
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
	},
	importMeta: import.meta
});

// Search if input currency code matches any in the currency list
async function isValidCurrencyCode(currencyCode) {
	// eslint-disable-next-line no-param-reassign
	currencyCode = currencyCode.toLowerCase();
	let currency;
	const supportedCurrencies = await getSupportedCurrencies();

	// eslint-disable-next-line no-restricted-syntax
	for (const supportedCurrency of supportedCurrencies) {
		if (currencyCode === supportedCurrency.toLowerCase()) {
			currency = supportedCurrency;
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
		writeFile(configFile, newConfig, error => {
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
	if (cli.flags.save !== undefined) {
		defaultCurrency = await isValidCurrencyCode(cli.flags.save);

		const newConfig = JSON.stringify({
			default: defaultCurrency,
			quantity,
			autorefresh,
			apiKey,
			provider
		}, undefined, 4);
		const defaultCurrencySymbol = getSymbolFromCurrency(defaultCurrency);

		try {
			await saveConfig(newConfig);
			console.log(chalk.green(`${logSymbols.success} Default currency set to: ${defaultCurrency} (${defaultCurrencySymbol})`));
		} catch {
			exitError('Something wrong happened, could not save new default currency.');
		}
	}

	let multiplier = 1;
	const printAsDecimal = cli.flags.decimal;

	if (cli.flags.quantity) {
		if (typeof cli.flags.quantity === 'number') {
			// Check if quantity is not the same as the old one
			if (quantity !== cli.flags.quantity) {
				// Save the new value of `quantity`
				quantity = cli.flags.quantity;
				const newConfig = JSON.stringify({
					default: defaultCurrency,
					quantity,
					autorefresh,
					apiKey,
					provider
				}, undefined, 4);

				try {
					await saveConfig(newConfig);
					console.log(chalk.green(`${logSymbols.success} Quantity set to: ${quantity}`));
					console.log(`Value of ${quantity} BTC:`);
					spinner.start();
				} catch {
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
	if (cli.flags.percentage !== undefined) {
		switch (cli.flags.percentage) {
			case 'h': {
				try {
					const percentage = await getPercentageChangeLastHour();
					printPercentage(`${percentage}%`);
				} catch (error) {
					console.log(error);
					exitError('Please check your internet connection');
				}

				break;
			}
			case 'd':
			case '': {
				try {
					const percentage = await getPercentageChangeLastDay();
					printPercentage(`${percentage}%`);
				} catch (error) {
					console.log(error);
					exitError('Please check your internet connection');
				}

				break;
			}
			case 'w': {
				try {
					const percentage = await getPercentageChangeLastWeek();
					printPercentage(`${percentage}%`);
				} catch (error) {
					console.log(error);
					exitError('Please check your internet connection');
				}

				break;
			}
			default: {
				exitError('Invalid percentage input. Check `btc-value --help`.');
			}
		}
	} else if (cli.flags.currency) {
		// If `d` flag is set => return value as decimal
		// USD is the default currency in the API
		// If `c` flag is set => convert to other currency
		// Print value of given `quantity` or just 1 BTC
		const currency = await isValidCurrencyCode(cli.flags.currency);

		try {
			const value = await btcValue({currencyCode: cli.flags.currency, isDecimal: printAsDecimal, quantity: multiplier});
			const currencySymbol = getSymbolFromCurrency(currency);
			printOutput(`${chalk.yellow(currencySymbol)}${value}`);
		} catch (error) {
			console.log(error);
			exitError('Please check your internet connection');
		}
	} else {
		try {
			const value = await btcValue({currencyCode: defaultCurrency, isDecimal: printAsDecimal, quantity: multiplier});
			const defaultCurrencySymbol = getSymbolFromCurrency(defaultCurrency);
			printOutput(`${chalk.yellow(defaultCurrencySymbol)}${value}`);
		} catch (error) {
			console.log(error);
			exitError('Please check your internet connection');
		}
	}

	// If `a` flag is set => set interval for automatic refreshing value printing
	if (cli.flags.autorefresh !== undefined) {
		if (cli.flags.autorefresh !== true) {
			autorefresh = cli.flags.autorefresh;
		}

		// eslint-disable-next-line no-unused-vars
		autorefreshTimer = setTimeout(checkAllFlags, autorefresh * 1000);
		spinner.start();
	}
}

const supportedProviders = new Set(['cmc', 'coingecko']);

// If `l` flag is set => print list of supported currency codes
if (cli.flags.list) {
	let currencyOutprint = '  List of all supported currency codes:';
	const supportedCurrencies = await getSupportedCurrencies();

	for (let index = 0; index < supportedCurrencies.length; index++) {
		// To separate the currency codes on different lines
		if (index % 9 === 0) {
			currencyOutprint += '\n      ';
		}

		currencyOutprint += supportedCurrencies[index];

		if (index !== supportedCurrencies.length - 1) {
			currencyOutprint += ', ';
		}
	}

	console.log(currencyOutprint);
	process.exit(0);
}

if (cli.flags.provider) {
	if (!supportedProviders.has(cli.flags.provider)) {
		exitError('Please select a valid currency provider');
	}

	provider = cli.flags.provider;
	const newConfig = JSON.stringify({
		default: defaultCurrency,
		quantity,
		autorefresh,
		apiKey,
		provider
	}, undefined, 4);

	try {
		await saveConfig(newConfig);
		console.log(chalk.green(`${logSymbols.success} Set \`${cli.flags.provider}\` as currency provider`));
	} catch {
		exitError('Something wrong happened, could not save new currency provider');
	}

	process.exit(0);
}

// If `r` flag is set => reset configuration file
if (cli.flags.reset) {
	const newConfig = JSON.stringify(defaultConfiguration, undefined, 4);

	try {
		await saveConfig(newConfig);
		const defaultCurrencySymbol = getSymbolFromCurrency(defaultCurrency);
		console.log(chalk.green(`${logSymbols.success} Default configuration reset to: ${defaultConfiguration.default} (${defaultCurrencySymbol})`));
	} catch {
		exitError('Something wrong happened, could not reset default configuration.');
	}

	process.exit(0);
}

// If `k` flag is set => set the API key
if (cli.flags.key) {
	apiKey = cli.flags.key;

	const newConfig = JSON.stringify({
		default: defaultCurrency,
		quantity,
		autorefresh,
		apiKey,
		provider
	}, undefined, 4);

	try {
		await saveConfig(newConfig);
		console.log(chalk.green(`${logSymbols.success} API key is set`));
	} catch {
		exitError('Something wrong happened, could not save API key.');
	}

	process.exit(0);
}

if (provider === 'cmc') {
	// Ensure that the API key is set if using data from CoinMarketCap
	if (apiKey) {
		setApiKey(apiKey);
	} else {
		exitError('You need to provide an API key to use CMC as a provider for the CLI. Set CoinGecko as a provider using `btc-value --provider coingecko`.\nOr go to https://coinmarketcap.com/api/ for obtaining a key.');
	}
}

await checkAllFlags();
