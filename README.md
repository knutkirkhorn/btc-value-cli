# btc-value-cli
Get the current Bitcoin value in command line

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
        $ btc-value -c
            kr131360
```

## Options
### `--double`, `-d`
Print value as double.

### `--save`, `-s [code]`
Set the currency that will be used by default. It will save the new default currency code and symbol in the [config.json](config.json) file. Next time ```btc-value``` is run in command line it will print the value of the new default currency.

### `--currency`, `-c [code]`
Print the value in another currency. It will print out the value of the currency code.

### `--list`, `-l`
Print a list of all available currencies.
The full list is:
```
AUD, BRL, CAD, CHF, CLP, CNY, CZK, DKK,
EUR, GBP, HKD, HUF, IDR, ILS, INR, JPY,
KRW, MXN, MYR, NOK, NZD, USD, PHP, PKR,
PLN, RUB, SEK, SGD, THB, TRY, TWD, ZAR
```

## Related
- [btc-value](https://github.com/Knutakir/btc-value) - API for this module

## Licence
MIT © [Knut Kirkhorn](LICENSE)
