<h1 align="center">
	<br>
	<img width="360" src="https://rawgit.com/Knutakir/btc-value-cli/master/media/logo.svg" alt="btc-value-cli">
	<br>
	<br>
	<br>
</h1>

> Get the current Bitcoin value in command line

[![Build Status](https://travis-ci.org/Knutakir/btc-value-cli.svg?branch=master)](https://travis-ci.org/Knutakir/btc-value-cli) [![Downloads](https://img.shields.io/npm/dm/btc-value-cli.svg)](https://www.npmjs.com/package/btc-value-cli)

## Installation
```
$ npm install --global btc-value-cli 
```

## Usage
```
$ btc-value --help

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
```

## Options
### `--key`, `-k`
Set the API key. This key is required for using the commands that calls the API. To obtain an API key go to the [Cryptocurrency Market Capitalizations API](https://coinmarketcap.com/api/). 

### `--decimal`, `-d`
Print the value as a decimal number.

### `--save`, `-s [code]`
Set the currency that will be used by default. It will save the new default currency code and symbol in the [config.json](config.json) file. Next time ```btc-value``` is run in command line it will print the value of the new default currency.

### `--currency`, `-c [code]`
Print the value in another currency. It will print out the value of the currency code. A list of all currency codes can be shown with the use of the `-l` flag or [here](https://github.com/Knutakir/btc-value/blob/master/currencies.json).

### `--list`, `-l`
Print a list of all supported currencies.
The full list is:
```
AUD, BRL, CAD, CHF, CLP, CNY, CZK, DKK,
EUR, GBP, HKD, HUF, IDR, ILS, INR, JPY,
KRW, MXN, MYR, NOK, NZD, USD, PHP, PKR,
PLN, RUB, SEK, SGD, THB, TRY, TWD, ZAR
```

### `--quantity`, `-q [number]`
Print the value of the given quantity. Input quantity can be either ```decimal``` or ```integer```.
If the input quantity is set to a number, the given quantity is saved locally in the [config.json](config.json) file.
The `-q` flag can be used with and without a number input.

### `--autorefresh`, `-a [seconds]`
Set a timeout that print the value every `seconds` seconds. The timeout restarts after every use. If `seconds` is not set, the default timeout is used (15 seconds). This is stored in the [config.json](config.json) file. The reason a timeout is used instead of a interval, is that it might not finish before the next starts (if bad network connection) and this can use more memory than needed.

### `--percentage`, `-p [h|d|w]`
Print the percentage change the last hour, day and week. If the flag is set to `h` then percentage change last hour is printed. It is the same for `d` and days, and `w` and week.
If the percentage is negative it is printed in bright red otherwise it is printed in green.

### `--reset`, `-r`
Reset the configuration to the default:
```
default: {
    code: "USD",
    symbol: "$"
},
quantity: 1,
autorefresh: 15
```

## Related
- [btc-value](https://github.com/Knutakir/btc-value) - API for this module

## License
MIT © [Knut Kirkhorn](LICENSE)
