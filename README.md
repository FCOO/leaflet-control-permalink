# leaflet-control-permalink
>Forked from shramov/leaflet-plugins v. 3.0.0 /controls/Permalink.js and adjusted using fcoo/url.js-extensions etc.


## Description

`L.Control.Permalink` is used to set/get settings to/from leaflet controls in the hash-tag of the url or (optional) as `localStorage` for web applications.

## Installation
### bower
`bower install https://github.com/FCOO/leaflet-control-permalink.git --save`

## Demo
http://FCOO.github.io/leaflet-control-permalink/demo/ 

## Usage

L.Control.Permalink works like this:
To include the setting for a given control (or other) eg. named "myControl" include a function "`initialize_myControl()`" (must be named "initialize_...") to "`L.Control.Permalink`" that sets up the needed calls to "`this._update( obj )`" where obj = json-object with `{id:value}`

`this._update( { test: 1 } )` => url get updated with "`index.html#....&test=1&...`"

### Example
    var myControl = new MyControl(...);
    
    L.Control.Permalink.include({
        initialize_myControl: function() {
            this._map.on('something', this._update_myControl, this);
        },
        _update_myControl: function(){
            this._update( {'myControl': myControl.getSomeValue() } ); 
        }


### Create

    var permalinkControl = new L.Control.Permalink( options });
    map.addControl(permalinkControl);

### options

| Id | Type | Default | Description |
| :--: | :--: | :-----: | --- |
| `position` | `string` | `"bottomright"` | The leaflet control position |
| `useLocation` | `boolean` | `true` | If <code>true</code> the settings are saved in the hash-tag of the url |
| `useLocalStorage` | `boolean` | `false` | If <code>true</code> the settings are saved as `localStorage`  |
| `urlParseOptions` | `object` or `null` | <code>{convertBoolean: true,</code><br><code>convertNumber: true,</code><br><code>convertJSON: true }</code> | If not <code>null</code> the settings are parsed using the [window.Url._parseObject(...)](https://github.com/FCOO/url.js-extensions#_parseobject-obj-validatorobj-defaultobj-options-) to parse `boolean`, `number` and `JSON-objects` before returned to the added controls |



## Copyright and License
This plugin is licensed under the [MIT license](https://github.com/FCOO/leaflet-control-permalink/LICENSE).

Copyright (c) 2016 [FCOO](https://github.com/FCOO)

## Contact information

Niels Holt nho@fcoo.dk


## Credits and acknowledgements
[Pavel Shramov](https://github.com/shramov)

[shramov/leaflet-plugins](https://github.com/shramov/leaflet-plugins)
