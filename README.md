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
          --double -d                   Print value as double
          --save -s [code]              Set the currency that will be used by default
          --currency -c [code]          Print the value in another currency         
          --list -l                     Print a list of all supported currencies
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
Print a list of all supported currencies.
The full list is:
```
AUD, BRL, CAD, CHF, CLP, CNY, CZK, DKK,
EUR, GBP, HKD, HUF, IDR, ILS, INR, JPY,
KRW, MXN, MYR, NOK, NZD, USD, PHP, PKR,
PLN, RUB, SEK, SGD, THB, TRY, TWD, ZAR
```

### `--quantity`, `-q [number]`
Print the value of the given quantity. Input quantity can be either ```double``` or ```integer```.

### `--myquantity`, `-m [number]`
Set my quantity if `number` is a number. Otherwise print the value of the locally stored `my_quantity` in the [config.json](config.json) file.

### `--autorefresh`, `-a [seconds]`
Set a interval that print the value every `seconds` seconds. If `seconds` is not set the default interval time is used (15s). This is stored in the [config.json](config.json) file.

## Related
- [btc-value](https://github.com/Knutakir/btc-value) - API for this module

## Licence
MIT © [Knut Kirkhorn](LICENSE)
