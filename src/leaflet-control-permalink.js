/****************************************************************************
    leaflet-control-permalink.js, 

    (c) 2016, FCOO

    https://github.com/FCOO/leaflet-control-permalink
    https://github.com/FCOO

    L.Control.Permalink works like this:
    To include the setting for a given control (or other) eg. named "myControl" 
    include a function "initialize_myControl()" (must be named "initialize_...") 
    to "L.Control.Permalink" that sets up the needed calls to "this._update( obj )"
    where obj = json-object with {id:value}

    this._update( { test: 1 } ) => url get updated with "index.html#....&test=1&..."
    Ex.
    var myControl = new MyControl(...);

    L.Control.Permalink.include({
        initialize_myControl: function() {
            this._map.on('something', this._update_myControl, this);
        },
        _update_myControl: function(){
            this._update( {'myControl': myControl.getSomeValue() } ); 
        }

    L.Control.Permalink.initialize contains the setups for different 
    leaflet-controls needed to be included in Permalink

****************************************************************************/
(function ($, L, window, document, undefined) {
    "use strict";

    L.Control.Permalink = L.Control.extend({
        options: {
            position       : 'bottomright',
            useLocation    : true,
            useLocalStorage: false,
            localStorageId : 'paramsTemp',
            postfix        : '',
            urlParseOptions: { 
                convertBoolean: true, 
                convertNumber : true, 
                convertJSON   : true
            }
        },

        //Bug fix to overcome that "Deprecated include of L.Mixin.Events: this property will be removed in future releases" 
        on: function(){
            this._evented.on.apply( this._evented, arguments );
        },
        fire: function(){
            this._evented.fire.apply( this._evented, arguments );
        },

        initialize: function (options) {

            this._evented = new L.Evented();

            L.Util.setOptions(this, options);
            this._params = {};

            this._set_urlvars();

            for (var i in this) {
                if (typeof(i) === 'string' && i.indexOf('initialize_') === 0)
                    this[i]();
            }
        },

        onAdd: function (map) {
            var container = L.DomUtil.create('div', 'leaflet-control-attribution leaflet-control-permalink');
            L.DomEvent.disableClickPropagation(container);
            this._map = map;

            this._fireUpdate();
    
            window.Url.onHashchange( this._set_urlvars, this );

            this.fire('add', {map: map});
    
            return container;
        },

        _update_href: function () {
            if (this.options.useLocation)
                window.Url.updateHash( this._params, true );

            if (this.options.useLocalStorage)
                window.localStorage.setItem(this.options.localStorageId, window.Url.stringify(this._params));

        },
    
        _fireUpdate: function(){
            if (this.options.urlParseOptions)
              window.Url._parseObject( this._params, null, null, this.options.urlParseOptions );
            this.fire('update', {params: this._params});
        },

        _update: function (obj) {
            //Update parameter to include changes from other maps
            this._params = this._get_params_from_url();

            for (var i in obj) {
                if (!obj.hasOwnProperty(i)) continue;
                if (obj[i] !== null && obj[i] !== undefined)
                    this._params[i] = obj[i];
                else
                    delete this._params[i];
            }
    
            this._update_href();
        },
    

        _get_params_from_url: function(){
            var result = window.Url.parseHash();
            if (this.options.useLocalStorage)
                result = window.Url.parseQuery( window.localStorage.getItem(this.options.localStorageId) || '' );
            return result;
        },

        _set_urlvars: function (){
            //************************************************
            function eq (x, y) {
                for (var i in x)
                    if (x.hasOwnProperty(i) && x[i] !== y[i])
                        return false;
                return true;
            }
            //************************************************
                
            var new_params = this._get_params_from_url();

            if (eq(new_params, this._params) && eq(this._params, new_params))
                return;

            this._params = new_params;
            this._update_href(); 
            this._fireUpdate();
        }
    });
    
    /*****************************************************************************
    Add default object to L.Control.Permalink to save and update 
    center position and zoom of the map
    *****************************************************************************/
    L.Control.Permalink.include({
        initialize_center_and_zoom: function() {
            this.on('update', this._set_center_and_zoom, this);
            this.on('add', this._onadd_center_and_zoom, this);
        },

        _onadd_center_and_zoom: function() {
            this._map.on('moveend', this._update_center_and_zoom, this);
            this._update_center_and_zoom();
        },

        _round_latlng: function( latLng ){
            if (!this._map) return latLng;            

            //********************************
            function round(x, p) {
                if (p === 0) return x;
                var shift = 1;
                while (p < 1 && p > -1) {
                    x *= 10;
                    p *= 10;
                    shift *= 10;
                }
                return Math.floor(x)/shift;
            }
            //********************************
            var size = this._map.getSize(),
                bounds = this._map.getBounds(), 
                ne = bounds.getNorthEast(), 
                sw = bounds.getSouthWest();

            return L.latLng(
                round(latLng.lat, (ne.lat - sw.lat) / size.y), 
                round(latLng.lng, (ne.lng - sw.lng) / size.x)
            );
        },

        _update_center_and_zoom: function() {
            if (!this._map) return;
        
            var point = this._round_latlng( this._map.getCenter() ),
                postfix = this.options.postfix,
                params = {};
            params['zoom'+postfix] = String(this._map.getZoom());
            params['lat'+postfix]  = String(point.lat); 
            params['lon'+postfix]  = String(point.lng);
            this._update( params );
        },

        _set_center_and_zoom: function(e) {
            function validate( s, min, max, defaultValue ){
                if ( window.Url.validateValue(s, 'NUMBER') ){
                    var value = parseFloat( s );
                    if (( value >= min ) && ( value <= max ))
                      return value;
                }
                return defaultValue;
            }

            //Check if this._maps etc is set. Added to try to fix error in Safari 
            if (!(e && e.params && this._map && this.options))
                return;


            var _map = this._map,
                postfix = this.options.postfix || '',
                bounds = _map.options.maxBounds || L.latLngBounds([-90, -999999], [+90, +999999]),
                minLat = Math.min( bounds.getNorth(), bounds.getSouth() ),
                maxLat = Math.max( bounds.getNorth(), bounds.getSouth() ),
                minLng = Math.min( bounds.getWest(),  bounds.getEast() ),
                maxLng = Math.max( bounds.getWest(),  bounds.getEast() ),
                mapCenter = _map.getCenter(),

                //To prevent the map from panning infinitely due to rounding the map is only updated if the new position would give a new permalink-value
                mapCenterRound = this._round_latlng( _map.getCenter() ),
                newCenterRound = this._round_latlng( L.latLng( 
                                                         validate( e.params['lat'+postfix], minLat, maxLat, mapCenter.lat ), 
                                                         validate( e.params['lon'+postfix], minLng, maxLng, mapCenter.lng )
                                                     ) 
                                                   ),
                newLat = newCenterRound.lat != mapCenterRound.lat ? newCenterRound.lat : mapCenter.lat,
                newLng = newCenterRound.lng != mapCenterRound.lng ? newCenterRound.lng : mapCenter.lng;

           
            this._map.setView( 
                L.latLng( newLat, newLng ), 
                validate( e.params['zoom'+postfix], _map.getMinZoom(), _map.getMaxZoom(), _map.getZoom() )
            );
        },
    });

 
}(jQuery, L, this, document));
