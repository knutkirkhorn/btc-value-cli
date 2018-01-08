# btc-value-cli
> Get the current Bitcoin value in command line

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
          --percentage -p [h|d|w]       Print the percentage change

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
        $ btc-value -p h
            -0.08%
```

## Options
### `--double`, `-d`
Print the value as a double.

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
Print the value of the given quantity. Input quantity can be either ```double``` or ```integer```.
If the input quantity is set to a number, the given quantity is saved locally in the [config.json](config.json) file.
The `-q` flag can be used with and without a number input.

### `--autorefresh`, `-a [seconds]`
Set a timeout that print the value every `seconds` seconds. The timeout restarts after every use. If `seconds` is not set, the default timeout is used (15 seconds). This is stored in the [config.json](config.json) file. The reason a timeout is used instead of a interval, is that it might not finish before the next starts (if bad network connection) and this can use more memory than needed.

### `--percentage`, `-p [h|d|w]`
Print the percentage change the last hour, day and week. If the flag is set to `h` then percentage change last hour is printed. It is the same for `d` and days, and `w` and week.

## Related
- [btc-value](https://github.com/Knutakir/btc-value) - API for this module

## License
MIT © [Knut Kirkhorn](LICENSE)
