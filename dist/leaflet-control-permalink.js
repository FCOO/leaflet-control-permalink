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
        includes: L.Mixin.Events, 

        options: {
            position       : 'bottomright',
            useLocation    : true,
            useLocalStorage: false,
            urlParseOptions: { 
                convertBoolean: true, 
                convertNumber : true, 
                convertJSON   : true
            }
        },

        initialize: function (options) {
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
    
            L.DomEvent.on( window, 'hashchange', this._set_urlvars, this );

            this.fire('add', {map: map});
    
            return container;
        },

        _update_href: function () {
            var params = window.Url.stringify(this._params);

            if (this.options.useLocation)
                window.Url.updateSearchAndHash(window.location.search, params);

            if (this.options.useLocalStorage)
                window.localStorage.setItem('paramsTemp', params);

        },
    
        _fireUpdate: function(){
            if (this.options.urlParseOptions)
              window.Url._parseObject( this._params, null, null, this.options.urlParseOptions );
            this.fire('update', {params: this._params});
        },

        _update: function (obj) {
            for (var i in obj) {
                if (!obj.hasOwnProperty(i)) continue;
                if (obj[i] !== null && obj[i] !== undefined)
                    this._params[i] = obj[i];
                else
                    delete this._params[i];
            }
    
            this._update_href();
        },
    
        _set_urlvars: function (){
            var p = window.Url.parseHash();
            if (this.options.useLocalStorage)
                p = window.Url.parseQuery( window.localStorage.getItem('paramsTemp') || '' );
            
            function eq (x, y) {
                for (var i in x)
                    if (x.hasOwnProperty(i) && x[i] !== y[i])
                        return false;
                return true;
            }
                
            if (eq(p, this._params) && eq(this._params, p))
                return;

            this._params = p;
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

        _update_center_and_zoom: function() {
            if (!this._map) return;
        
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
            var bounds = this._map.getBounds(), 
                size = this._map.getSize(),
                ne = bounds.getNorthEast(), 
                sw = bounds.getSouthWest(),
                point = this._map.getCenter();

            point.lat = round(point.lat, (ne.lat - sw.lat) / size.y);
            point.lng = round(point.lng, (ne.lng - sw.lng) / size.x);
            this._update({zoom: String(this._map.getZoom()), lat: String(point.lat), lon: String(point.lng)});

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

            var _map = this._map,
                bounds = _map.options.maxBounds || L.latLngBounds([-90, -999999], [+90, +999999]),
                minLat = Math.min( bounds.getNorth(),  bounds.getSouth() ),
                maxLat = Math.max( bounds.getNorth(),  bounds.getSouth() ),
                minLng = Math.min( bounds.getWest(),  bounds.getEast() ),
                maxLng = Math.max( bounds.getWest(),  bounds.getEast() );

            this._map.setView(
                L.latLng( 
                    validate( e.params.lat, minLat, maxLat, _map.getCenter().lat ), 
                    validate( e.params.lon, minLng, maxLng, _map.getCenter().lng )
                ), 
                validate( e.params.zoom, _map.getMinZoom(), _map.getMaxZoom(), _map.getZoom() )
            );

        },
    });

 
}(jQuery, L, this, document));
