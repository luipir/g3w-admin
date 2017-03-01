(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var PluginService = require('../pluginservice');
var CalcoloComponent = require('./vue/calcolo');
var GUI = g3wsdk.gui.GUI;
function CduService() {
  this.cleanAll = function() {
    PluginService.cleanAll();
  };
  this.calcola = function(urls, catastoFields) {
    PluginService.clearIntersectLayer();
    PluginService.calcola(urls.api)
    .then(function(response) {
      GUI.pushContent({
        content: new CalcoloComponent({
          state: response,
          catastoFields: catastoFields,
          urls: urls
        }),
        backonclose: true,
        closable: false,
        perc:50,
        title: "Crea Report"
      });
    })
  }
}

module.exports = CduService;

},{"../pluginservice":7,"./vue/calcolo":3}],2:[function(require,module,exports){
module.exports = "<div id=\"cdu-calcolo\">\n  <div class=\"text-right\">\n    <button class=\"btn btn-primary\" @click=\"createDoc()\">\n      <span class=\"glyphicon glyphicon-download-alt\"></span>\n      <b style=\"font-family: 'Source Sans Pro', 'Helvetica Neue', Helvetica, Arial, sans-serif;\"> Scarica ODT</b>\n    </button>\n  </div>\n  <div class=\"results nano\">\n    <div class=\"nano-content\">\n      <div v-for=\"particella, idParticella in state\">\n        <div class=\"cdu-calcolo-header\" style=\"background:#3c8dbc; padding:5px;\">\n          <span v-for=\"field in getCatastoFieldsFromResults(particella)\">\n            <b> {{ field.label }} : {{ field.value }} </b>\n          </span>\n        </div>\n        <div v-if=\"!particella.results.length\">\n          Non ci sono intesezioni\n        </div>\n        <div v-else>\n          <table class=\"table table-hover\">\n            <thead>\n            <tr>\n              <th>\n              </th>\n              <th>\n                <input :id=\"idParticella\" type=\"checkbox\" v-model=\"parentCheckBoxes[idParticella].checked\" class=\"checkbox pull-right\">\n                <label :for=\"idParticella\">Accetta</label>\n              </th>\n              <th>\n                Confronto\n              </th>\n              <th>\n                Tipo\n              </th>\n              <th>\n                Campi\n              </th>\n              <th>\n                Area | %\n              </th>\n            </tr>\n            </thead>\n            <tbody>\n            <tr v-for=\"intersection in particella.results\">\n              <td>\n                <span @click=\"highLightIntersection(intersection.geometry)\" class=\"action-button-icon glyphicon glyphicon-map-marker\"></span>\n              </td>\n              <td>\n                <input :id=\"'intersection_'+intersection.id\" class=\"checkbox intersection\" v-model=\"parentCheckBoxes[idParticella].childs[intersection.id]\" type=\"checkbox\">\n                <label :for=\"'intersection_'+intersection.id\"></label>\n              </td>\n              <td>\n                {{intersection.alias }}\n              </td>\n              <td>\n                {{intersection.geometry.type }}\n              </td>\n              <td>\n                <p v-for=\"field in intersection.fields\">\n                  {{ field.alias }} : {{ field.value }}\n                </p>\n              </td>\n              <td>\n                {{ intersection.area }} mq | {{ intersection.perc }} %\n              </td>\n            </tr>\n            </tbody>\n          </table>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>";

},{}],3:[function(require,module,exports){
var inherit = g3wsdk.core.utils.inherit;
var base = g3wsdk.core.utils.base;
var Component = g3wsdk.gui.vue.Component;
var PluginService = require('../../pluginservice');
var watchObj = {};

var calcoloComponent =  Vue.extend({
  template: require('./calcolo.html'),
  data: function() {
    return {
      state: this.$options.state,
      catastoFields: this.$options.catastoFields,
      docurl: this.$options.urls.docurl,
      parentCheckBoxes: this.$options.parentCheckBoxes
    }
  },
  methods: {
    getCatastoFieldsFromResults: function(results) {
      var LabelValues = [];
      _.forEach(this.catastoFields, function(catastoField) {
        LabelValues.push({
          label: catastoField.label,
          value: results[catastoField.field]
        })
      });
      return LabelValues
    },

    highLightIntersection: function(geometry) {
      PluginService.highLightIntersectFeature(geometry);
    },
    
    getIdsChecked: function() {
      var ids = [];
      _.forEach(this.parentCheckBoxes, function(parentCheckBox) {
        _.forEach(parentCheckBox.childs, function(value, child) {
          if (value) ids.push(1*child);
        })
      });
      return ids
    },

    hasChildCheck: function(idParticella) {
      var checked = false;
      _.forEach(this.parentCheckBoxes[idParticella].childs, function(value, child) {
        if (value) checked= true
      });
      return checked;
    },

    createDoc: function() {
      var ids = this.getIdsChecked();
      $.fileDownload(this.docurl, {
        successCallback: function (url) {
          //TODO
        },
        failCallback: function (html, url) {
          //TODO
        },
        httpMethod: "POST",
        data: {id: JSON.stringify(ids.join())}
      })
    }
  },
  watch: watchObj,
  created: function() {
    Vue.nextTick(function() {
      $(".nano").nanoScroller();
    })
  }
});

function CalcoloComponent(options) {

  options = options || {};
  base(this, options);
  var state = options.state || {};
  var catastoFields = options.catastoFields;
  var urls = options.urls;
  var parentCheckBoxes = {};

  _.forEach(state, function(v,idParticella) {
    parentCheckBoxes[idParticella] = {
      checked: true,
      childs: {}
    };
    _.forEach(v.results, function(result) {
      parentCheckBoxes[idParticella].childs[result.id] = true;
    });
    // creo il watch object
    watchObj['parentCheckBoxes.'+idParticella+'.checked'] = (function(idParticella) {
      return function(nV, old) {
        _.forEach(parentCheckBoxes[idParticella].childs, function(v, k) {
          parentCheckBoxes[idParticella].childs[k] = nV;
        })
      }
    })(idParticella);
  });

  this.setInternalComponent(new calcoloComponent({
    state: state,
    catastoFields: catastoFields,
    urls: urls,
    parentCheckBoxes: parentCheckBoxes

  }));
}

inherit(CalcoloComponent, Component);

module.exports = CalcoloComponent;
},{"../../pluginservice":7,"./calcolo.html":2}],4:[function(require,module,exports){
module.exports = "<div id=\"cdu\">\n  <div id=\"cdu-tools\">\n    <button :disabled=\"!particelle.length\" @click=\"calcola()\" title=\"Calcola\" type=\"button\" class=\"btn btn-default \">\n      <i class=\"fa fa-calculator\" aria-hidden=\"true\"></i>\n      <b>CALCOLA</b>\n    </button>\n    <button @click=\"activeInteraction('modify')\" :class=\"{'toggled' : 'modify' == buttonToggled }\" title=\"Vertici\" type=\"button\" class=\"btn btn-default  pull-right cdu-tools\">\n      <span  class=\"glyphicon glyphicon-option-horizontal\" aria-hidden=\"true\"></span>\n    </button>\n    <button @click=\"activeInteraction('rotate')\" :class=\"{'toggled' : 'rotate' == buttonToggled }\" title=\"Ruota Feature\" type=\"button\" class=\"btn btn-default  pull-right cdu-tools\">\n      <span  class=\"glyphicon glyphicon-repeat\" aria-hidden=\"true\"></span>\n    </button>\n    <button @click=\"activeInteraction('rotateall')\" :class=\"{'toggled' : 'rotateall' == buttonToggled }\" title=\"Ruota tutte le features\" type=\"button\" class=\"btn btn-default  pull-right cdu-tools\">\n      <span  class=\"glyphicon glyphicon-refresh\" aria-hidden=\"true\"></span>\n    </button>\n    <button @click=\"activeInteraction('move')\" :class=\"{'toggled' : 'move' == buttonToggled }\" title=\"Muovi Feature\" type=\"button\" class=\"btn btn-default  pull-right cdu-tools\">\n      <span  class=\"glyphicon glyphicon-move\" aria-hidden=\"true\"></span>\n    </button>\n    <button @click=\"activeInteraction('moveall')\" :class=\"{'toggled' : 'moveall' == buttonToggled }\" title=\"Sposta tutte le features\" type=\"button\" class=\"btn btn-default  pull-right cdu-tools\">\n      <span  class=\"glyphicon glyphicon-align-justify\" aria-hidden=\"true\"></span>\n    </button>\n  </div>\n  <div class=\"nano\">\n    <div v-if=\"particelle.length\" class=\"nano-content\">\n        <table class=\"particelle table table-hover\">\n          <thead>\n          <tr>\n            <th></th>\n            <th v-for=\"catastoField in catastoFields\">{{ catastoField.label }}</th>\n            <th></th>\n          </tr>\n          </thead>\n          <tbody>\n            <tr v-for=\"particella in particelle\">\n              <td>\n                <span @click=\"hightLightGeometry(particella.getGeometry())\" class=\"action-button-icon glyphicon glyphicon-map-marker\"></span>\n              </td>\n              <td v-if=\"isCatastoField(key)\" v-for=\"value, key in particella.getProperties()\">\n                {{ value }}\n              </td>\n              <td>\n                <i @click=\"deleteParticella(particella)\" class=\"glyphicon glyphicon glyphicon-trash link trash pull-right\"></i>\n              </td>\n            </tr>\n          </tbody>\n        </table>\n      </div>\n  </div>\n</div>";

},{}],5:[function(require,module,exports){
var inherit = g3wsdk.core.utils.inherit;
var base = g3wsdk.core.utils.base;
var Component = g3wsdk.gui.vue.Component;
var Service = require('../cduservice');
var PluginService = require('../../pluginservice');

var cduComponent =  Vue.extend({
  template: require('./cdu.html'),
  data: function() {
    return {
      particelle: this.$options.particelle,
      buttonToggled: null,
      catastoFields: this.$options.catastoFields
    }
  },
  methods: {
    calcola: function() {
      this.$options.service.calcola(this.$options.urls, this.catastoFields);
    },
    deleteParticella: function(particella) {
      self = this;
      _.forEach(this.particelle, function(addedParticella, index) {
        if (particella == addedParticella) {
          self.particelle.splice(index,1);
        }
      });
      PluginService.deleteParticella(particella);
    },
    activeInteraction: function(name) {
      if (this.buttonToggled == name) {
        this.buttonToggled = null;
      } else {
        this.buttonToggled = name;
      }
      PluginService.activeInteraction(name);
    },
    cleanAll: function() {
      var self = this;
      _.forEach(this.particelle, function(particella, index) {
        self.particelle.splice(index,1);
      });
    },
    isCatastoField: function(field) {
      var show = false;
      _.forEach(this.catastoFields, function(catastoField) {
        if (field == catastoField.field) {
          show = true;
          return false;
        }
      });
      return show;
    },
    hightLightGeometry: function(geometry) {
      PluginService.hightLightGeometry(geometry);
    }
  },
  created: function() {
    Vue.nextTick(function() {
      $(".nano").nanoScroller();
    })
  }
});

function CduComponent(options) {
  options = options || {};
  options.id = 'cdu';
  base(this, options);
  var particelle = options.particelle || [];
  var urls = options.urls;
  var catastoFields = options.catastoFields;
  var service = new Service();
  this.setService(service);
  base(this, options);
  this.setInternalComponent(new cduComponent({
    urls: urls,
    service: service,
    particelle: particelle,
    catastoFields: catastoFields
  }));
  this.setService(new Service());
  this.unmount = function() {
    this.internalComponent.cleanAll();
    service.cleanAll();
    return base(this, 'unmount');
  };
}

inherit(CduComponent, Component);

module.exports = CduComponent;
},{"../../pluginservice":7,"../cduservice":1,"./cdu.html":4}],6:[function(require,module,exports){
var inherit = g3wsdk.core.utils.inherit;
var base = g3wsdk.core.utils.base;
var Plugin = g3wsdk.core.Plugin;
var GUI = g3wsdk.gui.GUI;
var Service = require('./pluginservice');
var SearchPanel = require('./search/vue/seachpanel');

var _Plugin = function(){
  base(this);
  this.name = 'cdu';
  this.init = function() {
    //setto il servizio
    this.setService(Service);
    //recupero configurazione del plugin
    this.config = this.getConfig();
    //regitro il plugin
    if (this.registerPlugin(this.config.gid)) {
      if (!GUI.ready) {
        GUI.on('ready',_.bind(this.setupGui, this));
      }
      else {
        this.setupGui();
      }
      //inizializzo il servizio. Il servizio è l'istanza della classe servizio
      this.service.init(this.config);
    }
  };
  //metto su l'interfaccia del plugin
  this.setupGui = function(){
    var self = this;
    var toolsComponent = GUI.getComponent('tools');
    var toolsService = toolsComponent.getService();
    //add Tools (ordine, Nome gruppo, tools)
    _.forEach(this.config.configs, function(config) {
      toolsService.addTools(1, 'CDU', [
        {
          name: config.name,
          action: _.bind(self.showSearchPanel, this, config)
        }
      ])
    });
  };

  // funzione che permette di visualizzare il pannello search stabilito
  this.showSearchPanel = function(config) {
    // creao istanza del search panele passando i parametri della configurazione del cdu in questione
    var panel = new SearchPanel(config);
    GUI.showPanel(panel);
  }
};

inherit(_Plugin, Plugin);

(function(plugin){
  plugin.init();
})(new _Plugin);


},{"./pluginservice":7,"./search/vue/seachpanel":10}],7:[function(require,module,exports){
var inherit = g3wsdk.core.utils.inherit;
var base = g3wsdk.core.utils.base;
var G3WObject = g3wsdk.core.G3WObject;
var GUI = g3wsdk.gui.GUI;
var PluginService = g3wsdk.core.PluginService;

function CduPluginService() {
  base(this)
  //qui vado  a settare il mapservice
  this._mapService = null;
  this._interactions = {};
  this._layer = {};
  this._map = null;
  this._activeInteraction = null;
  // inizializzazione del plugin
  // chiamto dall $script(url) del plugin registry
  this.init = function(config) {
    var self = this;
    this.config = config;
    // setto il mapservice che mi permette di ineragire con la mappa
    this._mapService = GUI.getComponent('map').getService();
    var layerCatastoCrs = this._mapService.getProjectLayer(config.configs[0].layerCatasto).state.crs;
    this._map = this._mapService.getMap();
    // setto il layer
    this._layer =  new ol.layer.Vector({
      title: 'CDUCatasto',
      source: new ol.source.Vector({
        projection: 'EPSG:'+layerCatastoCrs,
        format: new ol.format.GeoJSON()
      }),
      style: new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: '#f00',
          width: 1
        }),
        fill: new ol.style.Fill({
          color: 'rgba(255,0,0,0.1)'
        })
      })
    });

    this._intersectLayer =  new ol.layer.Vector({
      title: 'CDUOverlay',
      source: new ol.source.Vector({
        projection: 'EPSG:'+layerCatastoCrs,
        format: new ol.format.GeoJSON()
      }),
      style: new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: '#1cc223',
          width: 1
        }),
        fill: new ol.style.Fill({
          color: 'rgba(0,255,0,0.9)'
        })
      })
    });
    // aggiungo il layer alla mappa
    this._map.addLayer(this._layer);
    //aggiungo il layer intersect alla mappa
    this._map.addLayer(this._intersectLayer);
    // setto e aggiungo le interazioni alla mappa
    this._selectInteraction = new ol.interaction.Select({
      layers: [this._layer],
      style: new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: '#f00',
          width: 2
        }),
        fill: new ol.style.Fill({
          color: 'rgba(255,0,0,0.5)'
        })
      })
    });

    this._interactions = {
      rotate: new ol.interaction.RotateFeature({
        features: self._selectInteraction.getFeatures(),
        angle: 0
      }),
      move: new ol.interaction.Translate({
        features: self._selectInteraction.getFeatures()
      }),
      modify: new ol.interaction.Modify({
        features: self._selectInteraction.getFeatures()
      }),
      snap: new ol.interaction.Snap({
        source: this._layer.getSource()
      }),
      rotateall:new ol.interaction.RotateFeature({
        features: self._selectInteraction.getFeatures(),
        angle: 0
      }),
      moveall: new ol.interaction.Translate({
        features: self._selectInteraction.getFeatures()
      })
    };

    // vado ad aggiungere le interazioni alla mappa
    this._map.addInteraction(this._selectInteraction);
    this._selectInteraction.setActive(false);
    _.forEach(this._interactions, function(interaction) {
      self._map.addInteraction(interaction);
      interaction.setActive(false);
    });
  };

  // funzione che verifica se la feature è stat già aggiunta o meno
  this.checkIfFeaturesAreAlreadyAdded = function(features) {
    var self = this;
    var foundFeature = false;
    _.forEach(features, function(feature) {
        if (feature.attributes.tipo == 'T') {
          _.forEach(self._layer.getSource().getFeatures(), function(layerFeature) {
            if (feature.attributes.gid == layerFeature.get('gid')) {
              foundFeature = true;
              return false
            }
          });
          if (foundFeature) return false
        }
    });
    return foundFeature
  };

  // funzione che cancella la feature
  this.deleteParticella = function(particella) {
    this._layer.getSource().removeFeature(particella);
    this._layer.setVisible(false);
    this._layer.setVisible(true);
  };

  // funzione che aggiunge la feature particella sul layer cdu particelle
  this.addParticella  = function(particella) {
    this._layer.getSource().addFeature(particella)
  };

  //funzione che aggiunge particelle (features)
  this.addParticelle = function(particelle) {
    var self = this;
    var features = [];
    _.forEach(particelle, function(particella) {
     if (particella.attributes.tipo == 'T') {
       var feature = new ol.Feature({
         geometry: particella.geometry
       });
       _.forEach(particella.attributes, function(value, key) {
         feature.set(key, value)
       });
       self._layer.getSource().addFeature(feature);
       if (self._activeInteraction && self._activeInteraction.indexOf('all') > -1) {
         self._selectInteraction.getFeatures().push(feature)
       }
       self._mapService.highlightGeometry(particella.geometry,{duration: 1000});
       features.push(feature);
       return false
     }
    });
    return features
  };

  // fa il clean di tutto
  // 1) rimuove tutte le feature del layer
  // 2) disattiva le interactions
  this.cleanAll = function() {
    this._layer.getSource().clear();
    _.forEach(this._interactions, function(interaction) {
      interaction.setActive(false);
    });
    this._selectInteraction.setActive(false);
  };

  //recupare un'iteractions
  this._getInteraction = function(name) {
    return this._interactions[name];
  };

  this._selectAllFeatures = function() {
    var selectColletions = this._selectInteraction.getFeatures();
    _.forEach(this._layer.getSource().getFeatures(), function(feature) {
      selectColletions.push(feature);
    });
  };

  // attiva una singola interactions
  this.activeInteraction = function(name) {
    var activeInteraction;
    if (this._activeInteraction == name) {
      this.disableInteractions();
      this._selectInteraction.getFeatures().clear();
      return;
    } else {
      this._activeInteraction = name;
    }

    this._selectInteraction.setActive(false);
    this._selectInteraction.getFeatures().clear();
    _.forEach(this._interactions, function(interaction) {
      activeInteraction = interaction;
      interaction.setActive(false);
    });
    var interaction = this._getInteraction(name);

    switch (name) {
      case 'modify':
        this._interactions.snap.setActive(true);
        break;
      case 'moveall':
        this._selectAllFeatures();
        break;
      case 'rotateall':
        this._selectAllFeatures();
        break;
    }
    this._selectInteraction.setActive(true);
    interaction.setActive(true);
  };

  // disabilita tutte le interactions
  this.disableInteractions = function() {
    _.forEach(this._interactions, function(interaction) {
      interaction.setActive(false);
    });
    this._selectInteraction.setActive(false);
  };

  this.clearIntersectLayer = function() {
    this._intersectLayer.getSource().clear();
  };

  this.hightLightGeometry = function(geometry) {
    this._mapService.highlightGeometry(geometry,{duration: 1000 });
  };

  this.highLightIntersectFeature = function(geometry) {
    var geojson = new ol.format.GeoJSON();
    var feature = geojson.readFeature(geometry);
    this._mapService.highlightGeometry(feature.getGeometry(),{duration: 1000 });
  };

  this.calcola = function(url) {
    var geojson = new ol.format.GeoJSON({
      geometryName: "geometry"
    });
    var geojsonFeatures = geojson.writeFeatures(this._layer.getSource().getFeatures());
    return $.post(url, {
      features: geojsonFeatures
    })
  }

}

inherit(CduPluginService, PluginService);

module.exports = new CduPluginService;
},{}],8:[function(require,module,exports){
var inherit = g3wsdk.core.utils.inherit;
var G3WObject = g3wsdk.core.G3WObject;
var GUI = g3wsdk.gui.GUI;
var QueryService = g3wsdk.core.QueryService;
var PluginService = require('../pluginservice');
var CudComponent = require('../cdu/vue/cdu');

function PanelService(options) {
  options = options || {};
  this.state = {
    added: false,
    featuresFound: true,
    isValidForm: true,
    particelle: []
  };
  var urls = options.urls;
  var catastoFields = options.catastoFields;
  //add particelle
  this.addParticelle = function(features) {
    return PluginService.addParticelle(features);
  };

  // funzione che verifica se la feature è stata già aggiunta
  this._featuresAlreadyAdded = function(features) {
    return PluginService.checkIfFeaturesAreAlreadyAdded(features);
  };

  // funzione che fa vedere il contentuo
  this._showContent = function(features) {
    // aggiungo nuova particella
    this.state.particelle.push(features[0]);
    var contentsComponent = GUI.getComponent('contents');
    if (!contentsComponent.getOpen() || !contentsComponent.getComponentById('cdu')) {
      GUI.setContent({
        content: new CudComponent({
          urls: urls,
          catastoFields: catastoFields,
          particelle: this.state.particelle
        }),
        title: 'Calcola CDU'
      });
    }
  };

  // funzione che in base al filtro passato effettua la chiamata al wms
  this.getResults = function(filter) {
    var self = this;
    QueryService.queryByFilter(filter)
      .then(function(results) {
        self._parseQueryResults(results);
      })
      .fail(function() {
        self.state.featuresFound = false;
      })
  };

  // funzione che parsa i risultati del wms
  this._parseQueryResults = function(results) {
    if (results) {
      var queryService = GUI.getComponent('queryresults').getService();
      var digestResults = queryService._digestFeaturesForLayers(results.data);
      var features = digestResults.length ? digestResults[0].features: digestResults;
      if (features.length && !this._featuresAlreadyAdded(features)) {
        this.state.featuresFound = true;
        this.state.added = false;
        // restituisce solo le feature terreno
        features = this.addParticelle(features);
        this._showContent(features);
      } else {
        if (this._featuresAlreadyAdded(features)) {
          // già stata aggiunta
          this.state.featuresFound = true;
          this.state.added = true
        } else {
          // nessuna feature trovata
          this.state.added = false;
          this.state.featuresFound = false;
        }
      }
    }
  };

  //ripulisce tutto
  this.closeContent = function() {
    GUI.closeContent();
  };

}

inherit(PanelService, G3WObject);
module.exports = PanelService;
},{"../cdu/vue/cdu":5,"../pluginservice":7}],9:[function(require,module,exports){
module.exports = "<div class=\"cdu-search-panel form-group\">\n  <h4>{{title}}</h4>\n  <form id=\"cdu-search-form\">\n    <template v-for=\"(forminput, index) in forminputs\">\n      <div v-if=\"forminput.input.type == 'numberfield'\" class=\"form-group numeric\">\n        <label :for=\"forminput.id + ' '\">{{ forminput.label }}</label>\n        <input type=\"number\" v-model=\"formInputValues[index].value\" class=\"form-control\" :id=\"forminput.id\">\n      </div>\n      <div v-if=\"forminput.input.type == 'textfield' || forminput.input.type == 'textField'\" class=\"form-group text\">\n        <label :for=\"forminput.id\">{{ forminput.label }}</label>\n        <input type=\"text\" v-model=\"formInputValues[index].value\" class=\"form-control\" :id=\"forminput.id\">\n      </div>\n    </template>\n    <div class=\"form-group\">\n      <button class=\"btn btn-primary btn-block pull-right\" @click=\"addParticella($event)\">Aggiungi</button>\n    </div>\n  </form>\n  <div id=\"cdu-search-messages\" style=\"color:#ec971f\">\n    <div v-if=\"state.added\">\n      <b>La particella è stata già aggiunta</b>\n    </div>\n    <div v-if=\"!state.featuresFound\">\n      <b>Nessuna particella trovata</b>\n    </div>\n    <div v-if=\"!state.isValidForm\">\n      <b>Compila la ricerca in tutti i suoi campi</b>\n    </div>\n  </div>\n</div>\n\n";

},{}],10:[function(require,module,exports){
var inherit = g3wsdk.core.utils.inherit;
var base = g3wsdk.core.utils.base;
var SearchPanel = g3wsdk.gui.vue.SearchPanel;
var Service = require('../searchpanelservice');

//componente vue pannello search
var CduSearchPanelComponent = Vue.extend({
  template: require('./seachpanel.html'),
  data: function() {
    return {
      title: "",
      forminputs: [],
      filterObject: {},
      formInputValues : [],
      state: null
    }
  },
  methods: {
    addParticella: function(event) {
      var isValidForm = true;
      event.preventDefault();
      // vado a verificare se gli input sono stati riempiti nel senso
      // che non contengono valori nulli
      _.forEach(this.formInputValues, function(inputObj) {
        if (_.isNil(inputObj.value)) {
          isValidForm = false;
          return false;
        }
      });
      // setto il valore del vaild Form per visualizzare o meno il messaggio
      this.state.isValidForm = isValidForm;
      // faccio una verifica se il form è stato completato correttamente
      if (this.state.isValidForm) {
        this.filterObject = this.fillFilterInputsWithValues(this.filterObject, this.formInputValues);
        this.$options.service.getResults([this.filterObject]);
      }
    }
  }
});

function CduSeachPanel(options) {
  //le option sono il config di quella specifica cdu
  options = options || {};
  options.id = "cdu-search-panel";
  options.name = options.name;
  var api = options.api;
  var docurl = options.docurl;
  var searchConfig = options.search;
  // ricavo i fields del catasto
  var castastoFields = [];
  _.forEach(searchConfig.options.filter.AND, function(field) {
    castastoFields.push({
      field: field.attribute,
      label: field.label
    })
  });
  var service = options.service || new Service({
    urls: {
      api: api,
      docurl: docurl
    },
    catastoFields: castastoFields
  });
  base(this, options);
  this.setInternalPanel(new CduSearchPanelComponent({
    service: service
  }));
  this.internalPanel.state = service.state;
  // vado ad inizializzare il pannello della search
  this.init(searchConfig);

  this.unmount = function() {
    service.closeContent();
    return base(this, 'unmount');

  }
}

inherit(CduSeachPanel, SearchPanel);

module.exports = CduSeachPanel;

},{"../searchpanelservice":8,"./seachpanel.html":9}]},{},[6])


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJjZHUvY2R1c2VydmljZS5qcyIsImNkdS92dWUvY2FsY29sby5odG1sIiwiY2R1L3Z1ZS9jYWxjb2xvLmpzIiwiY2R1L3Z1ZS9jZHUuaHRtbCIsImNkdS92dWUvY2R1LmpzIiwiaW5kZXguanMiLCJwbHVnaW5zZXJ2aWNlLmpzIiwic2VhcmNoL3NlYXJjaHBhbmVsc2VydmljZS5qcyIsInNlYXJjaC92dWUvc2VhY2hwYW5lbC5odG1sIiwic2VhcmNoL3Z1ZS9zZWFjaHBhbmVsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlHQTtBQUNBOztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUZBO0FBQ0E7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiYnVpbGQuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBQbHVnaW5TZXJ2aWNlID0gcmVxdWlyZSgnLi4vcGx1Z2luc2VydmljZScpO1xudmFyIENhbGNvbG9Db21wb25lbnQgPSByZXF1aXJlKCcuL3Z1ZS9jYWxjb2xvJyk7XG52YXIgR1VJID0gZzN3c2RrLmd1aS5HVUk7XG5mdW5jdGlvbiBDZHVTZXJ2aWNlKCkge1xuICB0aGlzLmNsZWFuQWxsID0gZnVuY3Rpb24oKSB7XG4gICAgUGx1Z2luU2VydmljZS5jbGVhbkFsbCgpO1xuICB9O1xuICB0aGlzLmNhbGNvbGEgPSBmdW5jdGlvbih1cmxzLCBjYXRhc3RvRmllbGRzKSB7XG4gICAgUGx1Z2luU2VydmljZS5jbGVhckludGVyc2VjdExheWVyKCk7XG4gICAgUGx1Z2luU2VydmljZS5jYWxjb2xhKHVybHMuYXBpKVxuICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICBHVUkucHVzaENvbnRlbnQoe1xuICAgICAgICBjb250ZW50OiBuZXcgQ2FsY29sb0NvbXBvbmVudCh7XG4gICAgICAgICAgc3RhdGU6IHJlc3BvbnNlLFxuICAgICAgICAgIGNhdGFzdG9GaWVsZHM6IGNhdGFzdG9GaWVsZHMsXG4gICAgICAgICAgdXJsczogdXJsc1xuICAgICAgICB9KSxcbiAgICAgICAgYmFja29uY2xvc2U6IHRydWUsXG4gICAgICAgIGNsb3NhYmxlOiBmYWxzZSxcbiAgICAgICAgcGVyYzo1MCxcbiAgICAgICAgdGl0bGU6IFwiQ3JlYSBSZXBvcnRcIlxuICAgICAgfSk7XG4gICAgfSlcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENkdVNlcnZpY2U7XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFwiPGRpdiBpZD1cXFwiY2R1LWNhbGNvbG9cXFwiPlxcbiAgPGRpdiBjbGFzcz1cXFwidGV4dC1yaWdodFxcXCI+XFxuICAgIDxidXR0b24gY2xhc3M9XFxcImJ0biBidG4tcHJpbWFyeVxcXCIgQGNsaWNrPVxcXCJjcmVhdGVEb2MoKVxcXCI+XFxuICAgICAgPHNwYW4gY2xhc3M9XFxcImdseXBoaWNvbiBnbHlwaGljb24tZG93bmxvYWQtYWx0XFxcIj48L3NwYW4+XFxuICAgICAgPGIgc3R5bGU9XFxcImZvbnQtZmFtaWx5OiAnU291cmNlIFNhbnMgUHJvJywgJ0hlbHZldGljYSBOZXVlJywgSGVsdmV0aWNhLCBBcmlhbCwgc2Fucy1zZXJpZjtcXFwiPiBTY2FyaWNhIE9EVDwvYj5cXG4gICAgPC9idXR0b24+XFxuICA8L2Rpdj5cXG4gIDxkaXYgY2xhc3M9XFxcInJlc3VsdHMgbmFub1xcXCI+XFxuICAgIDxkaXYgY2xhc3M9XFxcIm5hbm8tY29udGVudFxcXCI+XFxuICAgICAgPGRpdiB2LWZvcj1cXFwicGFydGljZWxsYSwgaWRQYXJ0aWNlbGxhIGluIHN0YXRlXFxcIj5cXG4gICAgICAgIDxkaXYgY2xhc3M9XFxcImNkdS1jYWxjb2xvLWhlYWRlclxcXCIgc3R5bGU9XFxcImJhY2tncm91bmQ6IzNjOGRiYzsgcGFkZGluZzo1cHg7XFxcIj5cXG4gICAgICAgICAgPHNwYW4gdi1mb3I9XFxcImZpZWxkIGluIGdldENhdGFzdG9GaWVsZHNGcm9tUmVzdWx0cyhwYXJ0aWNlbGxhKVxcXCI+XFxuICAgICAgICAgICAgPGI+IHt7IGZpZWxkLmxhYmVsIH19IDoge3sgZmllbGQudmFsdWUgfX0gPC9iPlxcbiAgICAgICAgICA8L3NwYW4+XFxuICAgICAgICA8L2Rpdj5cXG4gICAgICAgIDxkaXYgdi1pZj1cXFwiIXBhcnRpY2VsbGEucmVzdWx0cy5sZW5ndGhcXFwiPlxcbiAgICAgICAgICBOb24gY2kgc29ubyBpbnRlc2V6aW9uaVxcbiAgICAgICAgPC9kaXY+XFxuICAgICAgICA8ZGl2IHYtZWxzZT5cXG4gICAgICAgICAgPHRhYmxlIGNsYXNzPVxcXCJ0YWJsZSB0YWJsZS1ob3ZlclxcXCI+XFxuICAgICAgICAgICAgPHRoZWFkPlxcbiAgICAgICAgICAgIDx0cj5cXG4gICAgICAgICAgICAgIDx0aD5cXG4gICAgICAgICAgICAgIDwvdGg+XFxuICAgICAgICAgICAgICA8dGg+XFxuICAgICAgICAgICAgICAgIDxpbnB1dCA6aWQ9XFxcImlkUGFydGljZWxsYVxcXCIgdHlwZT1cXFwiY2hlY2tib3hcXFwiIHYtbW9kZWw9XFxcInBhcmVudENoZWNrQm94ZXNbaWRQYXJ0aWNlbGxhXS5jaGVja2VkXFxcIiBjbGFzcz1cXFwiY2hlY2tib3ggcHVsbC1yaWdodFxcXCI+XFxuICAgICAgICAgICAgICAgIDxsYWJlbCA6Zm9yPVxcXCJpZFBhcnRpY2VsbGFcXFwiPkFjY2V0dGE8L2xhYmVsPlxcbiAgICAgICAgICAgICAgPC90aD5cXG4gICAgICAgICAgICAgIDx0aD5cXG4gICAgICAgICAgICAgICAgQ29uZnJvbnRvXFxuICAgICAgICAgICAgICA8L3RoPlxcbiAgICAgICAgICAgICAgPHRoPlxcbiAgICAgICAgICAgICAgICBUaXBvXFxuICAgICAgICAgICAgICA8L3RoPlxcbiAgICAgICAgICAgICAgPHRoPlxcbiAgICAgICAgICAgICAgICBDYW1waVxcbiAgICAgICAgICAgICAgPC90aD5cXG4gICAgICAgICAgICAgIDx0aD5cXG4gICAgICAgICAgICAgICAgQXJlYSB8ICVcXG4gICAgICAgICAgICAgIDwvdGg+XFxuICAgICAgICAgICAgPC90cj5cXG4gICAgICAgICAgICA8L3RoZWFkPlxcbiAgICAgICAgICAgIDx0Ym9keT5cXG4gICAgICAgICAgICA8dHIgdi1mb3I9XFxcImludGVyc2VjdGlvbiBpbiBwYXJ0aWNlbGxhLnJlc3VsdHNcXFwiPlxcbiAgICAgICAgICAgICAgPHRkPlxcbiAgICAgICAgICAgICAgICA8c3BhbiBAY2xpY2s9XFxcImhpZ2hMaWdodEludGVyc2VjdGlvbihpbnRlcnNlY3Rpb24uZ2VvbWV0cnkpXFxcIiBjbGFzcz1cXFwiYWN0aW9uLWJ1dHRvbi1pY29uIGdseXBoaWNvbiBnbHlwaGljb24tbWFwLW1hcmtlclxcXCI+PC9zcGFuPlxcbiAgICAgICAgICAgICAgPC90ZD5cXG4gICAgICAgICAgICAgIDx0ZD5cXG4gICAgICAgICAgICAgICAgPGlucHV0IDppZD1cXFwiJ2ludGVyc2VjdGlvbl8nK2ludGVyc2VjdGlvbi5pZFxcXCIgY2xhc3M9XFxcImNoZWNrYm94IGludGVyc2VjdGlvblxcXCIgdi1tb2RlbD1cXFwicGFyZW50Q2hlY2tCb3hlc1tpZFBhcnRpY2VsbGFdLmNoaWxkc1tpbnRlcnNlY3Rpb24uaWRdXFxcIiB0eXBlPVxcXCJjaGVja2JveFxcXCI+XFxuICAgICAgICAgICAgICAgIDxsYWJlbCA6Zm9yPVxcXCInaW50ZXJzZWN0aW9uXycraW50ZXJzZWN0aW9uLmlkXFxcIj48L2xhYmVsPlxcbiAgICAgICAgICAgICAgPC90ZD5cXG4gICAgICAgICAgICAgIDx0ZD5cXG4gICAgICAgICAgICAgICAge3tpbnRlcnNlY3Rpb24uYWxpYXMgfX1cXG4gICAgICAgICAgICAgIDwvdGQ+XFxuICAgICAgICAgICAgICA8dGQ+XFxuICAgICAgICAgICAgICAgIHt7aW50ZXJzZWN0aW9uLmdlb21ldHJ5LnR5cGUgfX1cXG4gICAgICAgICAgICAgIDwvdGQ+XFxuICAgICAgICAgICAgICA8dGQ+XFxuICAgICAgICAgICAgICAgIDxwIHYtZm9yPVxcXCJmaWVsZCBpbiBpbnRlcnNlY3Rpb24uZmllbGRzXFxcIj5cXG4gICAgICAgICAgICAgICAgICB7eyBmaWVsZC5hbGlhcyB9fSA6IHt7IGZpZWxkLnZhbHVlIH19XFxuICAgICAgICAgICAgICAgIDwvcD5cXG4gICAgICAgICAgICAgIDwvdGQ+XFxuICAgICAgICAgICAgICA8dGQ+XFxuICAgICAgICAgICAgICAgIHt7IGludGVyc2VjdGlvbi5hcmVhIH19IG1xIHwge3sgaW50ZXJzZWN0aW9uLnBlcmMgfX0gJVxcbiAgICAgICAgICAgICAgPC90ZD5cXG4gICAgICAgICAgICA8L3RyPlxcbiAgICAgICAgICAgIDwvdGJvZHk+XFxuICAgICAgICAgIDwvdGFibGU+XFxuICAgICAgICA8L2Rpdj5cXG4gICAgICA8L2Rpdj5cXG4gICAgPC9kaXY+XFxuICA8L2Rpdj5cXG48L2Rpdj5cIjtcbiIsInZhciBpbmhlcml0ID0gZzN3c2RrLmNvcmUudXRpbHMuaW5oZXJpdDtcbnZhciBiYXNlID0gZzN3c2RrLmNvcmUudXRpbHMuYmFzZTtcbnZhciBDb21wb25lbnQgPSBnM3dzZGsuZ3VpLnZ1ZS5Db21wb25lbnQ7XG52YXIgUGx1Z2luU2VydmljZSA9IHJlcXVpcmUoJy4uLy4uL3BsdWdpbnNlcnZpY2UnKTtcbnZhciB3YXRjaE9iaiA9IHt9O1xuXG52YXIgY2FsY29sb0NvbXBvbmVudCA9ICBWdWUuZXh0ZW5kKHtcbiAgdGVtcGxhdGU6IHJlcXVpcmUoJy4vY2FsY29sby5odG1sJyksXG4gIGRhdGE6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICBzdGF0ZTogdGhpcy4kb3B0aW9ucy5zdGF0ZSxcbiAgICAgIGNhdGFzdG9GaWVsZHM6IHRoaXMuJG9wdGlvbnMuY2F0YXN0b0ZpZWxkcyxcbiAgICAgIGRvY3VybDogdGhpcy4kb3B0aW9ucy51cmxzLmRvY3VybCxcbiAgICAgIHBhcmVudENoZWNrQm94ZXM6IHRoaXMuJG9wdGlvbnMucGFyZW50Q2hlY2tCb3hlc1xuICAgIH1cbiAgfSxcbiAgbWV0aG9kczoge1xuICAgIGdldENhdGFzdG9GaWVsZHNGcm9tUmVzdWx0czogZnVuY3Rpb24ocmVzdWx0cykge1xuICAgICAgdmFyIExhYmVsVmFsdWVzID0gW107XG4gICAgICBfLmZvckVhY2godGhpcy5jYXRhc3RvRmllbGRzLCBmdW5jdGlvbihjYXRhc3RvRmllbGQpIHtcbiAgICAgICAgTGFiZWxWYWx1ZXMucHVzaCh7XG4gICAgICAgICAgbGFiZWw6IGNhdGFzdG9GaWVsZC5sYWJlbCxcbiAgICAgICAgICB2YWx1ZTogcmVzdWx0c1tjYXRhc3RvRmllbGQuZmllbGRdXG4gICAgICAgIH0pXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBMYWJlbFZhbHVlc1xuICAgIH0sXG5cbiAgICBoaWdoTGlnaHRJbnRlcnNlY3Rpb246IGZ1bmN0aW9uKGdlb21ldHJ5KSB7XG4gICAgICBQbHVnaW5TZXJ2aWNlLmhpZ2hMaWdodEludGVyc2VjdEZlYXR1cmUoZ2VvbWV0cnkpO1xuICAgIH0sXG4gICAgXG4gICAgZ2V0SWRzQ2hlY2tlZDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaWRzID0gW107XG4gICAgICBfLmZvckVhY2godGhpcy5wYXJlbnRDaGVja0JveGVzLCBmdW5jdGlvbihwYXJlbnRDaGVja0JveCkge1xuICAgICAgICBfLmZvckVhY2gocGFyZW50Q2hlY2tCb3guY2hpbGRzLCBmdW5jdGlvbih2YWx1ZSwgY2hpbGQpIHtcbiAgICAgICAgICBpZiAodmFsdWUpIGlkcy5wdXNoKDEqY2hpbGQpO1xuICAgICAgICB9KVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gaWRzXG4gICAgfSxcblxuICAgIGhhc0NoaWxkQ2hlY2s6IGZ1bmN0aW9uKGlkUGFydGljZWxsYSkge1xuICAgICAgdmFyIGNoZWNrZWQgPSBmYWxzZTtcbiAgICAgIF8uZm9yRWFjaCh0aGlzLnBhcmVudENoZWNrQm94ZXNbaWRQYXJ0aWNlbGxhXS5jaGlsZHMsIGZ1bmN0aW9uKHZhbHVlLCBjaGlsZCkge1xuICAgICAgICBpZiAodmFsdWUpIGNoZWNrZWQ9IHRydWVcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGNoZWNrZWQ7XG4gICAgfSxcblxuICAgIGNyZWF0ZURvYzogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgaWRzID0gdGhpcy5nZXRJZHNDaGVja2VkKCk7XG4gICAgICAkLmZpbGVEb3dubG9hZCh0aGlzLmRvY3VybCwge1xuICAgICAgICBzdWNjZXNzQ2FsbGJhY2s6IGZ1bmN0aW9uICh1cmwpIHtcbiAgICAgICAgICAvL1RPRE9cbiAgICAgICAgfSxcbiAgICAgICAgZmFpbENhbGxiYWNrOiBmdW5jdGlvbiAoaHRtbCwgdXJsKSB7XG4gICAgICAgICAgLy9UT0RPXG4gICAgICAgIH0sXG4gICAgICAgIGh0dHBNZXRob2Q6IFwiUE9TVFwiLFxuICAgICAgICBkYXRhOiB7aWQ6IEpTT04uc3RyaW5naWZ5KGlkcy5qb2luKCkpfVxuICAgICAgfSlcbiAgICB9XG4gIH0sXG4gIHdhdGNoOiB3YXRjaE9iaixcbiAgY3JlYXRlZDogZnVuY3Rpb24oKSB7XG4gICAgVnVlLm5leHRUaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgJChcIi5uYW5vXCIpLm5hbm9TY3JvbGxlcigpO1xuICAgIH0pXG4gIH1cbn0pO1xuXG5mdW5jdGlvbiBDYWxjb2xvQ29tcG9uZW50KG9wdGlvbnMpIHtcblxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgYmFzZSh0aGlzLCBvcHRpb25zKTtcbiAgdmFyIHN0YXRlID0gb3B0aW9ucy5zdGF0ZSB8fCB7fTtcbiAgdmFyIGNhdGFzdG9GaWVsZHMgPSBvcHRpb25zLmNhdGFzdG9GaWVsZHM7XG4gIHZhciB1cmxzID0gb3B0aW9ucy51cmxzO1xuICB2YXIgcGFyZW50Q2hlY2tCb3hlcyA9IHt9O1xuXG4gIF8uZm9yRWFjaChzdGF0ZSwgZnVuY3Rpb24odixpZFBhcnRpY2VsbGEpIHtcbiAgICBwYXJlbnRDaGVja0JveGVzW2lkUGFydGljZWxsYV0gPSB7XG4gICAgICBjaGVja2VkOiB0cnVlLFxuICAgICAgY2hpbGRzOiB7fVxuICAgIH07XG4gICAgXy5mb3JFYWNoKHYucmVzdWx0cywgZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICBwYXJlbnRDaGVja0JveGVzW2lkUGFydGljZWxsYV0uY2hpbGRzW3Jlc3VsdC5pZF0gPSB0cnVlO1xuICAgIH0pO1xuICAgIC8vIGNyZW8gaWwgd2F0Y2ggb2JqZWN0XG4gICAgd2F0Y2hPYmpbJ3BhcmVudENoZWNrQm94ZXMuJytpZFBhcnRpY2VsbGErJy5jaGVja2VkJ10gPSAoZnVuY3Rpb24oaWRQYXJ0aWNlbGxhKSB7XG4gICAgICByZXR1cm4gZnVuY3Rpb24oblYsIG9sZCkge1xuICAgICAgICBfLmZvckVhY2gocGFyZW50Q2hlY2tCb3hlc1tpZFBhcnRpY2VsbGFdLmNoaWxkcywgZnVuY3Rpb24odiwgaykge1xuICAgICAgICAgIHBhcmVudENoZWNrQm94ZXNbaWRQYXJ0aWNlbGxhXS5jaGlsZHNba10gPSBuVjtcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9KShpZFBhcnRpY2VsbGEpO1xuICB9KTtcblxuICB0aGlzLnNldEludGVybmFsQ29tcG9uZW50KG5ldyBjYWxjb2xvQ29tcG9uZW50KHtcbiAgICBzdGF0ZTogc3RhdGUsXG4gICAgY2F0YXN0b0ZpZWxkczogY2F0YXN0b0ZpZWxkcyxcbiAgICB1cmxzOiB1cmxzLFxuICAgIHBhcmVudENoZWNrQm94ZXM6IHBhcmVudENoZWNrQm94ZXNcblxuICB9KSk7XG59XG5cbmluaGVyaXQoQ2FsY29sb0NvbXBvbmVudCwgQ29tcG9uZW50KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDYWxjb2xvQ29tcG9uZW50OyIsIm1vZHVsZS5leHBvcnRzID0gXCI8ZGl2IGlkPVxcXCJjZHVcXFwiPlxcbiAgPGRpdiBpZD1cXFwiY2R1LXRvb2xzXFxcIj5cXG4gICAgPGJ1dHRvbiA6ZGlzYWJsZWQ9XFxcIiFwYXJ0aWNlbGxlLmxlbmd0aFxcXCIgQGNsaWNrPVxcXCJjYWxjb2xhKClcXFwiIHRpdGxlPVxcXCJDYWxjb2xhXFxcIiB0eXBlPVxcXCJidXR0b25cXFwiIGNsYXNzPVxcXCJidG4gYnRuLWRlZmF1bHQgXFxcIj5cXG4gICAgICA8aSBjbGFzcz1cXFwiZmEgZmEtY2FsY3VsYXRvclxcXCIgYXJpYS1oaWRkZW49XFxcInRydWVcXFwiPjwvaT5cXG4gICAgICA8Yj5DQUxDT0xBPC9iPlxcbiAgICA8L2J1dHRvbj5cXG4gICAgPGJ1dHRvbiBAY2xpY2s9XFxcImFjdGl2ZUludGVyYWN0aW9uKCdtb2RpZnknKVxcXCIgOmNsYXNzPVxcXCJ7J3RvZ2dsZWQnIDogJ21vZGlmeScgPT0gYnV0dG9uVG9nZ2xlZCB9XFxcIiB0aXRsZT1cXFwiVmVydGljaVxcXCIgdHlwZT1cXFwiYnV0dG9uXFxcIiBjbGFzcz1cXFwiYnRuIGJ0bi1kZWZhdWx0ICBwdWxsLXJpZ2h0IGNkdS10b29sc1xcXCI+XFxuICAgICAgPHNwYW4gIGNsYXNzPVxcXCJnbHlwaGljb24gZ2x5cGhpY29uLW9wdGlvbi1ob3Jpem9udGFsXFxcIiBhcmlhLWhpZGRlbj1cXFwidHJ1ZVxcXCI+PC9zcGFuPlxcbiAgICA8L2J1dHRvbj5cXG4gICAgPGJ1dHRvbiBAY2xpY2s9XFxcImFjdGl2ZUludGVyYWN0aW9uKCdyb3RhdGUnKVxcXCIgOmNsYXNzPVxcXCJ7J3RvZ2dsZWQnIDogJ3JvdGF0ZScgPT0gYnV0dG9uVG9nZ2xlZCB9XFxcIiB0aXRsZT1cXFwiUnVvdGEgRmVhdHVyZVxcXCIgdHlwZT1cXFwiYnV0dG9uXFxcIiBjbGFzcz1cXFwiYnRuIGJ0bi1kZWZhdWx0ICBwdWxsLXJpZ2h0IGNkdS10b29sc1xcXCI+XFxuICAgICAgPHNwYW4gIGNsYXNzPVxcXCJnbHlwaGljb24gZ2x5cGhpY29uLXJlcGVhdFxcXCIgYXJpYS1oaWRkZW49XFxcInRydWVcXFwiPjwvc3Bhbj5cXG4gICAgPC9idXR0b24+XFxuICAgIDxidXR0b24gQGNsaWNrPVxcXCJhY3RpdmVJbnRlcmFjdGlvbigncm90YXRlYWxsJylcXFwiIDpjbGFzcz1cXFwieyd0b2dnbGVkJyA6ICdyb3RhdGVhbGwnID09IGJ1dHRvblRvZ2dsZWQgfVxcXCIgdGl0bGU9XFxcIlJ1b3RhIHR1dHRlIGxlIGZlYXR1cmVzXFxcIiB0eXBlPVxcXCJidXR0b25cXFwiIGNsYXNzPVxcXCJidG4gYnRuLWRlZmF1bHQgIHB1bGwtcmlnaHQgY2R1LXRvb2xzXFxcIj5cXG4gICAgICA8c3BhbiAgY2xhc3M9XFxcImdseXBoaWNvbiBnbHlwaGljb24tcmVmcmVzaFxcXCIgYXJpYS1oaWRkZW49XFxcInRydWVcXFwiPjwvc3Bhbj5cXG4gICAgPC9idXR0b24+XFxuICAgIDxidXR0b24gQGNsaWNrPVxcXCJhY3RpdmVJbnRlcmFjdGlvbignbW92ZScpXFxcIiA6Y2xhc3M9XFxcInsndG9nZ2xlZCcgOiAnbW92ZScgPT0gYnV0dG9uVG9nZ2xlZCB9XFxcIiB0aXRsZT1cXFwiTXVvdmkgRmVhdHVyZVxcXCIgdHlwZT1cXFwiYnV0dG9uXFxcIiBjbGFzcz1cXFwiYnRuIGJ0bi1kZWZhdWx0ICBwdWxsLXJpZ2h0IGNkdS10b29sc1xcXCI+XFxuICAgICAgPHNwYW4gIGNsYXNzPVxcXCJnbHlwaGljb24gZ2x5cGhpY29uLW1vdmVcXFwiIGFyaWEtaGlkZGVuPVxcXCJ0cnVlXFxcIj48L3NwYW4+XFxuICAgIDwvYnV0dG9uPlxcbiAgICA8YnV0dG9uIEBjbGljaz1cXFwiYWN0aXZlSW50ZXJhY3Rpb24oJ21vdmVhbGwnKVxcXCIgOmNsYXNzPVxcXCJ7J3RvZ2dsZWQnIDogJ21vdmVhbGwnID09IGJ1dHRvblRvZ2dsZWQgfVxcXCIgdGl0bGU9XFxcIlNwb3N0YSB0dXR0ZSBsZSBmZWF0dXJlc1xcXCIgdHlwZT1cXFwiYnV0dG9uXFxcIiBjbGFzcz1cXFwiYnRuIGJ0bi1kZWZhdWx0ICBwdWxsLXJpZ2h0IGNkdS10b29sc1xcXCI+XFxuICAgICAgPHNwYW4gIGNsYXNzPVxcXCJnbHlwaGljb24gZ2x5cGhpY29uLWFsaWduLWp1c3RpZnlcXFwiIGFyaWEtaGlkZGVuPVxcXCJ0cnVlXFxcIj48L3NwYW4+XFxuICAgIDwvYnV0dG9uPlxcbiAgPC9kaXY+XFxuICA8ZGl2IGNsYXNzPVxcXCJuYW5vXFxcIj5cXG4gICAgPGRpdiB2LWlmPVxcXCJwYXJ0aWNlbGxlLmxlbmd0aFxcXCIgY2xhc3M9XFxcIm5hbm8tY29udGVudFxcXCI+XFxuICAgICAgICA8dGFibGUgY2xhc3M9XFxcInBhcnRpY2VsbGUgdGFibGUgdGFibGUtaG92ZXJcXFwiPlxcbiAgICAgICAgICA8dGhlYWQ+XFxuICAgICAgICAgIDx0cj5cXG4gICAgICAgICAgICA8dGg+PC90aD5cXG4gICAgICAgICAgICA8dGggdi1mb3I9XFxcImNhdGFzdG9GaWVsZCBpbiBjYXRhc3RvRmllbGRzXFxcIj57eyBjYXRhc3RvRmllbGQubGFiZWwgfX08L3RoPlxcbiAgICAgICAgICAgIDx0aD48L3RoPlxcbiAgICAgICAgICA8L3RyPlxcbiAgICAgICAgICA8L3RoZWFkPlxcbiAgICAgICAgICA8dGJvZHk+XFxuICAgICAgICAgICAgPHRyIHYtZm9yPVxcXCJwYXJ0aWNlbGxhIGluIHBhcnRpY2VsbGVcXFwiPlxcbiAgICAgICAgICAgICAgPHRkPlxcbiAgICAgICAgICAgICAgICA8c3BhbiBAY2xpY2s9XFxcImhpZ2h0TGlnaHRHZW9tZXRyeShwYXJ0aWNlbGxhLmdldEdlb21ldHJ5KCkpXFxcIiBjbGFzcz1cXFwiYWN0aW9uLWJ1dHRvbi1pY29uIGdseXBoaWNvbiBnbHlwaGljb24tbWFwLW1hcmtlclxcXCI+PC9zcGFuPlxcbiAgICAgICAgICAgICAgPC90ZD5cXG4gICAgICAgICAgICAgIDx0ZCB2LWlmPVxcXCJpc0NhdGFzdG9GaWVsZChrZXkpXFxcIiB2LWZvcj1cXFwidmFsdWUsIGtleSBpbiBwYXJ0aWNlbGxhLmdldFByb3BlcnRpZXMoKVxcXCI+XFxuICAgICAgICAgICAgICAgIHt7IHZhbHVlIH19XFxuICAgICAgICAgICAgICA8L3RkPlxcbiAgICAgICAgICAgICAgPHRkPlxcbiAgICAgICAgICAgICAgICA8aSBAY2xpY2s9XFxcImRlbGV0ZVBhcnRpY2VsbGEocGFydGljZWxsYSlcXFwiIGNsYXNzPVxcXCJnbHlwaGljb24gZ2x5cGhpY29uIGdseXBoaWNvbi10cmFzaCBsaW5rIHRyYXNoIHB1bGwtcmlnaHRcXFwiPjwvaT5cXG4gICAgICAgICAgICAgIDwvdGQ+XFxuICAgICAgICAgICAgPC90cj5cXG4gICAgICAgICAgPC90Ym9keT5cXG4gICAgICAgIDwvdGFibGU+XFxuICAgICAgPC9kaXY+XFxuICA8L2Rpdj5cXG48L2Rpdj5cIjtcbiIsInZhciBpbmhlcml0ID0gZzN3c2RrLmNvcmUudXRpbHMuaW5oZXJpdDtcbnZhciBiYXNlID0gZzN3c2RrLmNvcmUudXRpbHMuYmFzZTtcbnZhciBDb21wb25lbnQgPSBnM3dzZGsuZ3VpLnZ1ZS5Db21wb25lbnQ7XG52YXIgU2VydmljZSA9IHJlcXVpcmUoJy4uL2NkdXNlcnZpY2UnKTtcbnZhciBQbHVnaW5TZXJ2aWNlID0gcmVxdWlyZSgnLi4vLi4vcGx1Z2luc2VydmljZScpO1xuXG52YXIgY2R1Q29tcG9uZW50ID0gIFZ1ZS5leHRlbmQoe1xuICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi9jZHUuaHRtbCcpLFxuICBkYXRhOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcGFydGljZWxsZTogdGhpcy4kb3B0aW9ucy5wYXJ0aWNlbGxlLFxuICAgICAgYnV0dG9uVG9nZ2xlZDogbnVsbCxcbiAgICAgIGNhdGFzdG9GaWVsZHM6IHRoaXMuJG9wdGlvbnMuY2F0YXN0b0ZpZWxkc1xuICAgIH1cbiAgfSxcbiAgbWV0aG9kczoge1xuICAgIGNhbGNvbGE6IGZ1bmN0aW9uKCkge1xuICAgICAgdGhpcy4kb3B0aW9ucy5zZXJ2aWNlLmNhbGNvbGEodGhpcy4kb3B0aW9ucy51cmxzLCB0aGlzLmNhdGFzdG9GaWVsZHMpO1xuICAgIH0sXG4gICAgZGVsZXRlUGFydGljZWxsYTogZnVuY3Rpb24ocGFydGljZWxsYSkge1xuICAgICAgc2VsZiA9IHRoaXM7XG4gICAgICBfLmZvckVhY2godGhpcy5wYXJ0aWNlbGxlLCBmdW5jdGlvbihhZGRlZFBhcnRpY2VsbGEsIGluZGV4KSB7XG4gICAgICAgIGlmIChwYXJ0aWNlbGxhID09IGFkZGVkUGFydGljZWxsYSkge1xuICAgICAgICAgIHNlbGYucGFydGljZWxsZS5zcGxpY2UoaW5kZXgsMSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgUGx1Z2luU2VydmljZS5kZWxldGVQYXJ0aWNlbGxhKHBhcnRpY2VsbGEpO1xuICAgIH0sXG4gICAgYWN0aXZlSW50ZXJhY3Rpb246IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIGlmICh0aGlzLmJ1dHRvblRvZ2dsZWQgPT0gbmFtZSkge1xuICAgICAgICB0aGlzLmJ1dHRvblRvZ2dsZWQgPSBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5idXR0b25Ub2dnbGVkID0gbmFtZTtcbiAgICAgIH1cbiAgICAgIFBsdWdpblNlcnZpY2UuYWN0aXZlSW50ZXJhY3Rpb24obmFtZSk7XG4gICAgfSxcbiAgICBjbGVhbkFsbDogZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICBfLmZvckVhY2godGhpcy5wYXJ0aWNlbGxlLCBmdW5jdGlvbihwYXJ0aWNlbGxhLCBpbmRleCkge1xuICAgICAgICBzZWxmLnBhcnRpY2VsbGUuc3BsaWNlKGluZGV4LDEpO1xuICAgICAgfSk7XG4gICAgfSxcbiAgICBpc0NhdGFzdG9GaWVsZDogZnVuY3Rpb24oZmllbGQpIHtcbiAgICAgIHZhciBzaG93ID0gZmFsc2U7XG4gICAgICBfLmZvckVhY2godGhpcy5jYXRhc3RvRmllbGRzLCBmdW5jdGlvbihjYXRhc3RvRmllbGQpIHtcbiAgICAgICAgaWYgKGZpZWxkID09IGNhdGFzdG9GaWVsZC5maWVsZCkge1xuICAgICAgICAgIHNob3cgPSB0cnVlO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gc2hvdztcbiAgICB9LFxuICAgIGhpZ2h0TGlnaHRHZW9tZXRyeTogZnVuY3Rpb24oZ2VvbWV0cnkpIHtcbiAgICAgIFBsdWdpblNlcnZpY2UuaGlnaHRMaWdodEdlb21ldHJ5KGdlb21ldHJ5KTtcbiAgICB9XG4gIH0sXG4gIGNyZWF0ZWQ6IGZ1bmN0aW9uKCkge1xuICAgIFZ1ZS5uZXh0VGljayhmdW5jdGlvbigpIHtcbiAgICAgICQoXCIubmFub1wiKS5uYW5vU2Nyb2xsZXIoKTtcbiAgICB9KVxuICB9XG59KTtcblxuZnVuY3Rpb24gQ2R1Q29tcG9uZW50KG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIG9wdGlvbnMuaWQgPSAnY2R1JztcbiAgYmFzZSh0aGlzLCBvcHRpb25zKTtcbiAgdmFyIHBhcnRpY2VsbGUgPSBvcHRpb25zLnBhcnRpY2VsbGUgfHwgW107XG4gIHZhciB1cmxzID0gb3B0aW9ucy51cmxzO1xuICB2YXIgY2F0YXN0b0ZpZWxkcyA9IG9wdGlvbnMuY2F0YXN0b0ZpZWxkcztcbiAgdmFyIHNlcnZpY2UgPSBuZXcgU2VydmljZSgpO1xuICB0aGlzLnNldFNlcnZpY2Uoc2VydmljZSk7XG4gIGJhc2UodGhpcywgb3B0aW9ucyk7XG4gIHRoaXMuc2V0SW50ZXJuYWxDb21wb25lbnQobmV3IGNkdUNvbXBvbmVudCh7XG4gICAgdXJsczogdXJscyxcbiAgICBzZXJ2aWNlOiBzZXJ2aWNlLFxuICAgIHBhcnRpY2VsbGU6IHBhcnRpY2VsbGUsXG4gICAgY2F0YXN0b0ZpZWxkczogY2F0YXN0b0ZpZWxkc1xuICB9KSk7XG4gIHRoaXMuc2V0U2VydmljZShuZXcgU2VydmljZSgpKTtcbiAgdGhpcy51bm1vdW50ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5pbnRlcm5hbENvbXBvbmVudC5jbGVhbkFsbCgpO1xuICAgIHNlcnZpY2UuY2xlYW5BbGwoKTtcbiAgICByZXR1cm4gYmFzZSh0aGlzLCAndW5tb3VudCcpO1xuICB9O1xufVxuXG5pbmhlcml0KENkdUNvbXBvbmVudCwgQ29tcG9uZW50KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDZHVDb21wb25lbnQ7IiwidmFyIGluaGVyaXQgPSBnM3dzZGsuY29yZS51dGlscy5pbmhlcml0O1xudmFyIGJhc2UgPSBnM3dzZGsuY29yZS51dGlscy5iYXNlO1xudmFyIFBsdWdpbiA9IGczd3Nkay5jb3JlLlBsdWdpbjtcbnZhciBHVUkgPSBnM3dzZGsuZ3VpLkdVSTtcbnZhciBTZXJ2aWNlID0gcmVxdWlyZSgnLi9wbHVnaW5zZXJ2aWNlJyk7XG52YXIgU2VhcmNoUGFuZWwgPSByZXF1aXJlKCcuL3NlYXJjaC92dWUvc2VhY2hwYW5lbCcpO1xuXG52YXIgX1BsdWdpbiA9IGZ1bmN0aW9uKCl7XG4gIGJhc2UodGhpcyk7XG4gIHRoaXMubmFtZSA9ICdjZHUnO1xuICB0aGlzLmluaXQgPSBmdW5jdGlvbigpIHtcbiAgICAvL3NldHRvIGlsIHNlcnZpemlvXG4gICAgdGhpcy5zZXRTZXJ2aWNlKFNlcnZpY2UpO1xuICAgIC8vcmVjdXBlcm8gY29uZmlndXJhemlvbmUgZGVsIHBsdWdpblxuICAgIHRoaXMuY29uZmlnID0gdGhpcy5nZXRDb25maWcoKTtcbiAgICAvL3JlZ2l0cm8gaWwgcGx1Z2luXG4gICAgaWYgKHRoaXMucmVnaXN0ZXJQbHVnaW4odGhpcy5jb25maWcuZ2lkKSkge1xuICAgICAgaWYgKCFHVUkucmVhZHkpIHtcbiAgICAgICAgR1VJLm9uKCdyZWFkeScsXy5iaW5kKHRoaXMuc2V0dXBHdWksIHRoaXMpKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICB0aGlzLnNldHVwR3VpKCk7XG4gICAgICB9XG4gICAgICAvL2luaXppYWxpenpvIGlsIHNlcnZpemlvLiBJbCBzZXJ2aXppbyDDqCBsJ2lzdGFuemEgZGVsbGEgY2xhc3NlIHNlcnZpemlvXG4gICAgICB0aGlzLnNlcnZpY2UuaW5pdCh0aGlzLmNvbmZpZyk7XG4gICAgfVxuICB9O1xuICAvL21ldHRvIHN1IGwnaW50ZXJmYWNjaWEgZGVsIHBsdWdpblxuICB0aGlzLnNldHVwR3VpID0gZnVuY3Rpb24oKXtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIHRvb2xzQ29tcG9uZW50ID0gR1VJLmdldENvbXBvbmVudCgndG9vbHMnKTtcbiAgICB2YXIgdG9vbHNTZXJ2aWNlID0gdG9vbHNDb21wb25lbnQuZ2V0U2VydmljZSgpO1xuICAgIC8vYWRkIFRvb2xzIChvcmRpbmUsIE5vbWUgZ3J1cHBvLCB0b29scylcbiAgICBfLmZvckVhY2godGhpcy5jb25maWcuY29uZmlncywgZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICB0b29sc1NlcnZpY2UuYWRkVG9vbHMoMSwgJ0NEVScsIFtcbiAgICAgICAge1xuICAgICAgICAgIG5hbWU6IGNvbmZpZy5uYW1lLFxuICAgICAgICAgIGFjdGlvbjogXy5iaW5kKHNlbGYuc2hvd1NlYXJjaFBhbmVsLCB0aGlzLCBjb25maWcpXG4gICAgICAgIH1cbiAgICAgIF0pXG4gICAgfSk7XG4gIH07XG5cbiAgLy8gZnVuemlvbmUgY2hlIHBlcm1ldHRlIGRpIHZpc3VhbGl6emFyZSBpbCBwYW5uZWxsbyBzZWFyY2ggc3RhYmlsaXRvXG4gIHRoaXMuc2hvd1NlYXJjaFBhbmVsID0gZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgLy8gY3JlYW8gaXN0YW56YSBkZWwgc2VhcmNoIHBhbmVsZSBwYXNzYW5kbyBpIHBhcmFtZXRyaSBkZWxsYSBjb25maWd1cmF6aW9uZSBkZWwgY2R1IGluIHF1ZXN0aW9uZVxuICAgIHZhciBwYW5lbCA9IG5ldyBTZWFyY2hQYW5lbChjb25maWcpO1xuICAgIEdVSS5zaG93UGFuZWwocGFuZWwpO1xuICB9XG59O1xuXG5pbmhlcml0KF9QbHVnaW4sIFBsdWdpbik7XG5cbihmdW5jdGlvbihwbHVnaW4pe1xuICBwbHVnaW4uaW5pdCgpO1xufSkobmV3IF9QbHVnaW4pO1xuXG4iLCJ2YXIgaW5oZXJpdCA9IGczd3Nkay5jb3JlLnV0aWxzLmluaGVyaXQ7XG52YXIgYmFzZSA9IGczd3Nkay5jb3JlLnV0aWxzLmJhc2U7XG52YXIgRzNXT2JqZWN0ID0gZzN3c2RrLmNvcmUuRzNXT2JqZWN0O1xudmFyIEdVSSA9IGczd3Nkay5ndWkuR1VJO1xudmFyIFBsdWdpblNlcnZpY2UgPSBnM3dzZGsuY29yZS5QbHVnaW5TZXJ2aWNlO1xuXG5mdW5jdGlvbiBDZHVQbHVnaW5TZXJ2aWNlKCkge1xuICBiYXNlKHRoaXMpXG4gIC8vcXVpIHZhZG8gIGEgc2V0dGFyZSBpbCBtYXBzZXJ2aWNlXG4gIHRoaXMuX21hcFNlcnZpY2UgPSBudWxsO1xuICB0aGlzLl9pbnRlcmFjdGlvbnMgPSB7fTtcbiAgdGhpcy5fbGF5ZXIgPSB7fTtcbiAgdGhpcy5fbWFwID0gbnVsbDtcbiAgdGhpcy5fYWN0aXZlSW50ZXJhY3Rpb24gPSBudWxsO1xuICAvLyBpbml6aWFsaXp6YXppb25lIGRlbCBwbHVnaW5cbiAgLy8gY2hpYW10byBkYWxsICRzY3JpcHQodXJsKSBkZWwgcGx1Z2luIHJlZ2lzdHJ5XG4gIHRoaXMuaW5pdCA9IGZ1bmN0aW9uKGNvbmZpZykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLmNvbmZpZyA9IGNvbmZpZztcbiAgICAvLyBzZXR0byBpbCBtYXBzZXJ2aWNlIGNoZSBtaSBwZXJtZXR0ZSBkaSBpbmVyYWdpcmUgY29uIGxhIG1hcHBhXG4gICAgdGhpcy5fbWFwU2VydmljZSA9IEdVSS5nZXRDb21wb25lbnQoJ21hcCcpLmdldFNlcnZpY2UoKTtcbiAgICB2YXIgbGF5ZXJDYXRhc3RvQ3JzID0gdGhpcy5fbWFwU2VydmljZS5nZXRQcm9qZWN0TGF5ZXIoY29uZmlnLmNvbmZpZ3NbMF0ubGF5ZXJDYXRhc3RvKS5zdGF0ZS5jcnM7XG4gICAgdGhpcy5fbWFwID0gdGhpcy5fbWFwU2VydmljZS5nZXRNYXAoKTtcbiAgICAvLyBzZXR0byBpbCBsYXllclxuICAgIHRoaXMuX2xheWVyID0gIG5ldyBvbC5sYXllci5WZWN0b3Ioe1xuICAgICAgdGl0bGU6ICdDRFVDYXRhc3RvJyxcbiAgICAgIHNvdXJjZTogbmV3IG9sLnNvdXJjZS5WZWN0b3Ioe1xuICAgICAgICBwcm9qZWN0aW9uOiAnRVBTRzonK2xheWVyQ2F0YXN0b0NycyxcbiAgICAgICAgZm9ybWF0OiBuZXcgb2wuZm9ybWF0Lkdlb0pTT04oKVxuICAgICAgfSksXG4gICAgICBzdHlsZTogbmV3IG9sLnN0eWxlLlN0eWxlKHtcbiAgICAgICAgc3Ryb2tlOiBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcbiAgICAgICAgICBjb2xvcjogJyNmMDAnLFxuICAgICAgICAgIHdpZHRoOiAxXG4gICAgICAgIH0pLFxuICAgICAgICBmaWxsOiBuZXcgb2wuc3R5bGUuRmlsbCh7XG4gICAgICAgICAgY29sb3I6ICdyZ2JhKDI1NSwwLDAsMC4xKSdcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfSk7XG5cbiAgICB0aGlzLl9pbnRlcnNlY3RMYXllciA9ICBuZXcgb2wubGF5ZXIuVmVjdG9yKHtcbiAgICAgIHRpdGxlOiAnQ0RVT3ZlcmxheScsXG4gICAgICBzb3VyY2U6IG5ldyBvbC5zb3VyY2UuVmVjdG9yKHtcbiAgICAgICAgcHJvamVjdGlvbjogJ0VQU0c6JytsYXllckNhdGFzdG9DcnMsXG4gICAgICAgIGZvcm1hdDogbmV3IG9sLmZvcm1hdC5HZW9KU09OKClcbiAgICAgIH0pLFxuICAgICAgc3R5bGU6IG5ldyBvbC5zdHlsZS5TdHlsZSh7XG4gICAgICAgIHN0cm9rZTogbmV3IG9sLnN0eWxlLlN0cm9rZSh7XG4gICAgICAgICAgY29sb3I6ICcjMWNjMjIzJyxcbiAgICAgICAgICB3aWR0aDogMVxuICAgICAgICB9KSxcbiAgICAgICAgZmlsbDogbmV3IG9sLnN0eWxlLkZpbGwoe1xuICAgICAgICAgIGNvbG9yOiAncmdiYSgwLDI1NSwwLDAuOSknXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH0pO1xuICAgIC8vIGFnZ2l1bmdvIGlsIGxheWVyIGFsbGEgbWFwcGFcbiAgICB0aGlzLl9tYXAuYWRkTGF5ZXIodGhpcy5fbGF5ZXIpO1xuICAgIC8vYWdnaXVuZ28gaWwgbGF5ZXIgaW50ZXJzZWN0IGFsbGEgbWFwcGFcbiAgICB0aGlzLl9tYXAuYWRkTGF5ZXIodGhpcy5faW50ZXJzZWN0TGF5ZXIpO1xuICAgIC8vIHNldHRvIGUgYWdnaXVuZ28gbGUgaW50ZXJhemlvbmkgYWxsYSBtYXBwYVxuICAgIHRoaXMuX3NlbGVjdEludGVyYWN0aW9uID0gbmV3IG9sLmludGVyYWN0aW9uLlNlbGVjdCh7XG4gICAgICBsYXllcnM6IFt0aGlzLl9sYXllcl0sXG4gICAgICBzdHlsZTogbmV3IG9sLnN0eWxlLlN0eWxlKHtcbiAgICAgICAgc3Ryb2tlOiBuZXcgb2wuc3R5bGUuU3Ryb2tlKHtcbiAgICAgICAgICBjb2xvcjogJyNmMDAnLFxuICAgICAgICAgIHdpZHRoOiAyXG4gICAgICAgIH0pLFxuICAgICAgICBmaWxsOiBuZXcgb2wuc3R5bGUuRmlsbCh7XG4gICAgICAgICAgY29sb3I6ICdyZ2JhKDI1NSwwLDAsMC41KSdcbiAgICAgICAgfSlcbiAgICAgIH0pXG4gICAgfSk7XG5cbiAgICB0aGlzLl9pbnRlcmFjdGlvbnMgPSB7XG4gICAgICByb3RhdGU6IG5ldyBvbC5pbnRlcmFjdGlvbi5Sb3RhdGVGZWF0dXJlKHtcbiAgICAgICAgZmVhdHVyZXM6IHNlbGYuX3NlbGVjdEludGVyYWN0aW9uLmdldEZlYXR1cmVzKCksXG4gICAgICAgIGFuZ2xlOiAwXG4gICAgICB9KSxcbiAgICAgIG1vdmU6IG5ldyBvbC5pbnRlcmFjdGlvbi5UcmFuc2xhdGUoe1xuICAgICAgICBmZWF0dXJlczogc2VsZi5fc2VsZWN0SW50ZXJhY3Rpb24uZ2V0RmVhdHVyZXMoKVxuICAgICAgfSksXG4gICAgICBtb2RpZnk6IG5ldyBvbC5pbnRlcmFjdGlvbi5Nb2RpZnkoe1xuICAgICAgICBmZWF0dXJlczogc2VsZi5fc2VsZWN0SW50ZXJhY3Rpb24uZ2V0RmVhdHVyZXMoKVxuICAgICAgfSksXG4gICAgICBzbmFwOiBuZXcgb2wuaW50ZXJhY3Rpb24uU25hcCh7XG4gICAgICAgIHNvdXJjZTogdGhpcy5fbGF5ZXIuZ2V0U291cmNlKClcbiAgICAgIH0pLFxuICAgICAgcm90YXRlYWxsOm5ldyBvbC5pbnRlcmFjdGlvbi5Sb3RhdGVGZWF0dXJlKHtcbiAgICAgICAgZmVhdHVyZXM6IHNlbGYuX3NlbGVjdEludGVyYWN0aW9uLmdldEZlYXR1cmVzKCksXG4gICAgICAgIGFuZ2xlOiAwXG4gICAgICB9KSxcbiAgICAgIG1vdmVhbGw6IG5ldyBvbC5pbnRlcmFjdGlvbi5UcmFuc2xhdGUoe1xuICAgICAgICBmZWF0dXJlczogc2VsZi5fc2VsZWN0SW50ZXJhY3Rpb24uZ2V0RmVhdHVyZXMoKVxuICAgICAgfSlcbiAgICB9O1xuXG4gICAgLy8gdmFkbyBhZCBhZ2dpdW5nZXJlIGxlIGludGVyYXppb25pIGFsbGEgbWFwcGFcbiAgICB0aGlzLl9tYXAuYWRkSW50ZXJhY3Rpb24odGhpcy5fc2VsZWN0SW50ZXJhY3Rpb24pO1xuICAgIHRoaXMuX3NlbGVjdEludGVyYWN0aW9uLnNldEFjdGl2ZShmYWxzZSk7XG4gICAgXy5mb3JFYWNoKHRoaXMuX2ludGVyYWN0aW9ucywgZnVuY3Rpb24oaW50ZXJhY3Rpb24pIHtcbiAgICAgIHNlbGYuX21hcC5hZGRJbnRlcmFjdGlvbihpbnRlcmFjdGlvbik7XG4gICAgICBpbnRlcmFjdGlvbi5zZXRBY3RpdmUoZmFsc2UpO1xuICAgIH0pO1xuICB9O1xuXG4gIC8vIGZ1bnppb25lIGNoZSB2ZXJpZmljYSBzZSBsYSBmZWF0dXJlIMOoIHN0YXQgZ2nDoCBhZ2dpdW50YSBvIG1lbm9cbiAgdGhpcy5jaGVja0lmRmVhdHVyZXNBcmVBbHJlYWR5QWRkZWQgPSBmdW5jdGlvbihmZWF0dXJlcykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgZm91bmRGZWF0dXJlID0gZmFsc2U7XG4gICAgXy5mb3JFYWNoKGZlYXR1cmVzLCBmdW5jdGlvbihmZWF0dXJlKSB7XG4gICAgICAgIGlmIChmZWF0dXJlLmF0dHJpYnV0ZXMudGlwbyA9PSAnVCcpIHtcbiAgICAgICAgICBfLmZvckVhY2goc2VsZi5fbGF5ZXIuZ2V0U291cmNlKCkuZ2V0RmVhdHVyZXMoKSwgZnVuY3Rpb24obGF5ZXJGZWF0dXJlKSB7XG4gICAgICAgICAgICBpZiAoZmVhdHVyZS5hdHRyaWJ1dGVzLmdpZCA9PSBsYXllckZlYXR1cmUuZ2V0KCdnaWQnKSkge1xuICAgICAgICAgICAgICBmb3VuZEZlYXR1cmUgPSB0cnVlO1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICBpZiAoZm91bmRGZWF0dXJlKSByZXR1cm4gZmFsc2VcbiAgICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBmb3VuZEZlYXR1cmVcbiAgfTtcblxuICAvLyBmdW56aW9uZSBjaGUgY2FuY2VsbGEgbGEgZmVhdHVyZVxuICB0aGlzLmRlbGV0ZVBhcnRpY2VsbGEgPSBmdW5jdGlvbihwYXJ0aWNlbGxhKSB7XG4gICAgdGhpcy5fbGF5ZXIuZ2V0U291cmNlKCkucmVtb3ZlRmVhdHVyZShwYXJ0aWNlbGxhKTtcbiAgICB0aGlzLl9sYXllci5zZXRWaXNpYmxlKGZhbHNlKTtcbiAgICB0aGlzLl9sYXllci5zZXRWaXNpYmxlKHRydWUpO1xuICB9O1xuXG4gIC8vIGZ1bnppb25lIGNoZSBhZ2dpdW5nZSBsYSBmZWF0dXJlIHBhcnRpY2VsbGEgc3VsIGxheWVyIGNkdSBwYXJ0aWNlbGxlXG4gIHRoaXMuYWRkUGFydGljZWxsYSAgPSBmdW5jdGlvbihwYXJ0aWNlbGxhKSB7XG4gICAgdGhpcy5fbGF5ZXIuZ2V0U291cmNlKCkuYWRkRmVhdHVyZShwYXJ0aWNlbGxhKVxuICB9O1xuXG4gIC8vZnVuemlvbmUgY2hlIGFnZ2l1bmdlIHBhcnRpY2VsbGUgKGZlYXR1cmVzKVxuICB0aGlzLmFkZFBhcnRpY2VsbGUgPSBmdW5jdGlvbihwYXJ0aWNlbGxlKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBmZWF0dXJlcyA9IFtdO1xuICAgIF8uZm9yRWFjaChwYXJ0aWNlbGxlLCBmdW5jdGlvbihwYXJ0aWNlbGxhKSB7XG4gICAgIGlmIChwYXJ0aWNlbGxhLmF0dHJpYnV0ZXMudGlwbyA9PSAnVCcpIHtcbiAgICAgICB2YXIgZmVhdHVyZSA9IG5ldyBvbC5GZWF0dXJlKHtcbiAgICAgICAgIGdlb21ldHJ5OiBwYXJ0aWNlbGxhLmdlb21ldHJ5XG4gICAgICAgfSk7XG4gICAgICAgXy5mb3JFYWNoKHBhcnRpY2VsbGEuYXR0cmlidXRlcywgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgICAgZmVhdHVyZS5zZXQoa2V5LCB2YWx1ZSlcbiAgICAgICB9KTtcbiAgICAgICBzZWxmLl9sYXllci5nZXRTb3VyY2UoKS5hZGRGZWF0dXJlKGZlYXR1cmUpO1xuICAgICAgIGlmIChzZWxmLl9hY3RpdmVJbnRlcmFjdGlvbiAmJiBzZWxmLl9hY3RpdmVJbnRlcmFjdGlvbi5pbmRleE9mKCdhbGwnKSA+IC0xKSB7XG4gICAgICAgICBzZWxmLl9zZWxlY3RJbnRlcmFjdGlvbi5nZXRGZWF0dXJlcygpLnB1c2goZmVhdHVyZSlcbiAgICAgICB9XG4gICAgICAgc2VsZi5fbWFwU2VydmljZS5oaWdobGlnaHRHZW9tZXRyeShwYXJ0aWNlbGxhLmdlb21ldHJ5LHtkdXJhdGlvbjogMTAwMH0pO1xuICAgICAgIGZlYXR1cmVzLnB1c2goZmVhdHVyZSk7XG4gICAgICAgcmV0dXJuIGZhbHNlXG4gICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gZmVhdHVyZXNcbiAgfTtcblxuICAvLyBmYSBpbCBjbGVhbiBkaSB0dXR0b1xuICAvLyAxKSByaW11b3ZlIHR1dHRlIGxlIGZlYXR1cmUgZGVsIGxheWVyXG4gIC8vIDIpIGRpc2F0dGl2YSBsZSBpbnRlcmFjdGlvbnNcbiAgdGhpcy5jbGVhbkFsbCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX2xheWVyLmdldFNvdXJjZSgpLmNsZWFyKCk7XG4gICAgXy5mb3JFYWNoKHRoaXMuX2ludGVyYWN0aW9ucywgZnVuY3Rpb24oaW50ZXJhY3Rpb24pIHtcbiAgICAgIGludGVyYWN0aW9uLnNldEFjdGl2ZShmYWxzZSk7XG4gICAgfSk7XG4gICAgdGhpcy5fc2VsZWN0SW50ZXJhY3Rpb24uc2V0QWN0aXZlKGZhbHNlKTtcbiAgfTtcblxuICAvL3JlY3VwYXJlIHVuJ2l0ZXJhY3Rpb25zXG4gIHRoaXMuX2dldEludGVyYWN0aW9uID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHJldHVybiB0aGlzLl9pbnRlcmFjdGlvbnNbbmFtZV07XG4gIH07XG5cbiAgdGhpcy5fc2VsZWN0QWxsRmVhdHVyZXMgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgc2VsZWN0Q29sbGV0aW9ucyA9IHRoaXMuX3NlbGVjdEludGVyYWN0aW9uLmdldEZlYXR1cmVzKCk7XG4gICAgXy5mb3JFYWNoKHRoaXMuX2xheWVyLmdldFNvdXJjZSgpLmdldEZlYXR1cmVzKCksIGZ1bmN0aW9uKGZlYXR1cmUpIHtcbiAgICAgIHNlbGVjdENvbGxldGlvbnMucHVzaChmZWF0dXJlKTtcbiAgICB9KTtcbiAgfTtcblxuICAvLyBhdHRpdmEgdW5hIHNpbmdvbGEgaW50ZXJhY3Rpb25zXG4gIHRoaXMuYWN0aXZlSW50ZXJhY3Rpb24gPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIGFjdGl2ZUludGVyYWN0aW9uO1xuICAgIGlmICh0aGlzLl9hY3RpdmVJbnRlcmFjdGlvbiA9PSBuYW1lKSB7XG4gICAgICB0aGlzLmRpc2FibGVJbnRlcmFjdGlvbnMoKTtcbiAgICAgIHRoaXMuX3NlbGVjdEludGVyYWN0aW9uLmdldEZlYXR1cmVzKCkuY2xlYXIoKTtcbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fYWN0aXZlSW50ZXJhY3Rpb24gPSBuYW1lO1xuICAgIH1cblxuICAgIHRoaXMuX3NlbGVjdEludGVyYWN0aW9uLnNldEFjdGl2ZShmYWxzZSk7XG4gICAgdGhpcy5fc2VsZWN0SW50ZXJhY3Rpb24uZ2V0RmVhdHVyZXMoKS5jbGVhcigpO1xuICAgIF8uZm9yRWFjaCh0aGlzLl9pbnRlcmFjdGlvbnMsIGZ1bmN0aW9uKGludGVyYWN0aW9uKSB7XG4gICAgICBhY3RpdmVJbnRlcmFjdGlvbiA9IGludGVyYWN0aW9uO1xuICAgICAgaW50ZXJhY3Rpb24uc2V0QWN0aXZlKGZhbHNlKTtcbiAgICB9KTtcbiAgICB2YXIgaW50ZXJhY3Rpb24gPSB0aGlzLl9nZXRJbnRlcmFjdGlvbihuYW1lKTtcblxuICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgY2FzZSAnbW9kaWZ5JzpcbiAgICAgICAgdGhpcy5faW50ZXJhY3Rpb25zLnNuYXAuc2V0QWN0aXZlKHRydWUpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ21vdmVhbGwnOlxuICAgICAgICB0aGlzLl9zZWxlY3RBbGxGZWF0dXJlcygpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3JvdGF0ZWFsbCc6XG4gICAgICAgIHRoaXMuX3NlbGVjdEFsbEZlYXR1cmVzKCk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICB0aGlzLl9zZWxlY3RJbnRlcmFjdGlvbi5zZXRBY3RpdmUodHJ1ZSk7XG4gICAgaW50ZXJhY3Rpb24uc2V0QWN0aXZlKHRydWUpO1xuICB9O1xuXG4gIC8vIGRpc2FiaWxpdGEgdHV0dGUgbGUgaW50ZXJhY3Rpb25zXG4gIHRoaXMuZGlzYWJsZUludGVyYWN0aW9ucyA9IGZ1bmN0aW9uKCkge1xuICAgIF8uZm9yRWFjaCh0aGlzLl9pbnRlcmFjdGlvbnMsIGZ1bmN0aW9uKGludGVyYWN0aW9uKSB7XG4gICAgICBpbnRlcmFjdGlvbi5zZXRBY3RpdmUoZmFsc2UpO1xuICAgIH0pO1xuICAgIHRoaXMuX3NlbGVjdEludGVyYWN0aW9uLnNldEFjdGl2ZShmYWxzZSk7XG4gIH07XG5cbiAgdGhpcy5jbGVhckludGVyc2VjdExheWVyID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5faW50ZXJzZWN0TGF5ZXIuZ2V0U291cmNlKCkuY2xlYXIoKTtcbiAgfTtcblxuICB0aGlzLmhpZ2h0TGlnaHRHZW9tZXRyeSA9IGZ1bmN0aW9uKGdlb21ldHJ5KSB7XG4gICAgdGhpcy5fbWFwU2VydmljZS5oaWdobGlnaHRHZW9tZXRyeShnZW9tZXRyeSx7ZHVyYXRpb246IDEwMDAgfSk7XG4gIH07XG5cbiAgdGhpcy5oaWdoTGlnaHRJbnRlcnNlY3RGZWF0dXJlID0gZnVuY3Rpb24oZ2VvbWV0cnkpIHtcbiAgICB2YXIgZ2VvanNvbiA9IG5ldyBvbC5mb3JtYXQuR2VvSlNPTigpO1xuICAgIHZhciBmZWF0dXJlID0gZ2VvanNvbi5yZWFkRmVhdHVyZShnZW9tZXRyeSk7XG4gICAgdGhpcy5fbWFwU2VydmljZS5oaWdobGlnaHRHZW9tZXRyeShmZWF0dXJlLmdldEdlb21ldHJ5KCkse2R1cmF0aW9uOiAxMDAwIH0pO1xuICB9O1xuXG4gIHRoaXMuY2FsY29sYSA9IGZ1bmN0aW9uKHVybCkge1xuICAgIHZhciBnZW9qc29uID0gbmV3IG9sLmZvcm1hdC5HZW9KU09OKHtcbiAgICAgIGdlb21ldHJ5TmFtZTogXCJnZW9tZXRyeVwiXG4gICAgfSk7XG4gICAgdmFyIGdlb2pzb25GZWF0dXJlcyA9IGdlb2pzb24ud3JpdGVGZWF0dXJlcyh0aGlzLl9sYXllci5nZXRTb3VyY2UoKS5nZXRGZWF0dXJlcygpKTtcbiAgICByZXR1cm4gJC5wb3N0KHVybCwge1xuICAgICAgZmVhdHVyZXM6IGdlb2pzb25GZWF0dXJlc1xuICAgIH0pXG4gIH1cblxufVxuXG5pbmhlcml0KENkdVBsdWdpblNlcnZpY2UsIFBsdWdpblNlcnZpY2UpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBDZHVQbHVnaW5TZXJ2aWNlOyIsInZhciBpbmhlcml0ID0gZzN3c2RrLmNvcmUudXRpbHMuaW5oZXJpdDtcbnZhciBHM1dPYmplY3QgPSBnM3dzZGsuY29yZS5HM1dPYmplY3Q7XG52YXIgR1VJID0gZzN3c2RrLmd1aS5HVUk7XG52YXIgUXVlcnlTZXJ2aWNlID0gZzN3c2RrLmNvcmUuUXVlcnlTZXJ2aWNlO1xudmFyIFBsdWdpblNlcnZpY2UgPSByZXF1aXJlKCcuLi9wbHVnaW5zZXJ2aWNlJyk7XG52YXIgQ3VkQ29tcG9uZW50ID0gcmVxdWlyZSgnLi4vY2R1L3Z1ZS9jZHUnKTtcblxuZnVuY3Rpb24gUGFuZWxTZXJ2aWNlKG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIHRoaXMuc3RhdGUgPSB7XG4gICAgYWRkZWQ6IGZhbHNlLFxuICAgIGZlYXR1cmVzRm91bmQ6IHRydWUsXG4gICAgaXNWYWxpZEZvcm06IHRydWUsXG4gICAgcGFydGljZWxsZTogW11cbiAgfTtcbiAgdmFyIHVybHMgPSBvcHRpb25zLnVybHM7XG4gIHZhciBjYXRhc3RvRmllbGRzID0gb3B0aW9ucy5jYXRhc3RvRmllbGRzO1xuICAvL2FkZCBwYXJ0aWNlbGxlXG4gIHRoaXMuYWRkUGFydGljZWxsZSA9IGZ1bmN0aW9uKGZlYXR1cmVzKSB7XG4gICAgcmV0dXJuIFBsdWdpblNlcnZpY2UuYWRkUGFydGljZWxsZShmZWF0dXJlcyk7XG4gIH07XG5cbiAgLy8gZnVuemlvbmUgY2hlIHZlcmlmaWNhIHNlIGxhIGZlYXR1cmUgw6ggc3RhdGEgZ2nDoCBhZ2dpdW50YVxuICB0aGlzLl9mZWF0dXJlc0FscmVhZHlBZGRlZCA9IGZ1bmN0aW9uKGZlYXR1cmVzKSB7XG4gICAgcmV0dXJuIFBsdWdpblNlcnZpY2UuY2hlY2tJZkZlYXR1cmVzQXJlQWxyZWFkeUFkZGVkKGZlYXR1cmVzKTtcbiAgfTtcblxuICAvLyBmdW56aW9uZSBjaGUgZmEgdmVkZXJlIGlsIGNvbnRlbnR1b1xuICB0aGlzLl9zaG93Q29udGVudCA9IGZ1bmN0aW9uKGZlYXR1cmVzKSB7XG4gICAgLy8gYWdnaXVuZ28gbnVvdmEgcGFydGljZWxsYVxuICAgIHRoaXMuc3RhdGUucGFydGljZWxsZS5wdXNoKGZlYXR1cmVzWzBdKTtcbiAgICB2YXIgY29udGVudHNDb21wb25lbnQgPSBHVUkuZ2V0Q29tcG9uZW50KCdjb250ZW50cycpO1xuICAgIGlmICghY29udGVudHNDb21wb25lbnQuZ2V0T3BlbigpIHx8ICFjb250ZW50c0NvbXBvbmVudC5nZXRDb21wb25lbnRCeUlkKCdjZHUnKSkge1xuICAgICAgR1VJLnNldENvbnRlbnQoe1xuICAgICAgICBjb250ZW50OiBuZXcgQ3VkQ29tcG9uZW50KHtcbiAgICAgICAgICB1cmxzOiB1cmxzLFxuICAgICAgICAgIGNhdGFzdG9GaWVsZHM6IGNhdGFzdG9GaWVsZHMsXG4gICAgICAgICAgcGFydGljZWxsZTogdGhpcy5zdGF0ZS5wYXJ0aWNlbGxlXG4gICAgICAgIH0pLFxuICAgICAgICB0aXRsZTogJ0NhbGNvbGEgQ0RVJ1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG4gIC8vIGZ1bnppb25lIGNoZSBpbiBiYXNlIGFsIGZpbHRybyBwYXNzYXRvIGVmZmV0dHVhIGxhIGNoaWFtYXRhIGFsIHdtc1xuICB0aGlzLmdldFJlc3VsdHMgPSBmdW5jdGlvbihmaWx0ZXIpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgUXVlcnlTZXJ2aWNlLnF1ZXJ5QnlGaWx0ZXIoZmlsdGVyKVxuICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzdWx0cykge1xuICAgICAgICBzZWxmLl9wYXJzZVF1ZXJ5UmVzdWx0cyhyZXN1bHRzKTtcbiAgICAgIH0pXG4gICAgICAuZmFpbChmdW5jdGlvbigpIHtcbiAgICAgICAgc2VsZi5zdGF0ZS5mZWF0dXJlc0ZvdW5kID0gZmFsc2U7XG4gICAgICB9KVxuICB9O1xuXG4gIC8vIGZ1bnppb25lIGNoZSBwYXJzYSBpIHJpc3VsdGF0aSBkZWwgd21zXG4gIHRoaXMuX3BhcnNlUXVlcnlSZXN1bHRzID0gZnVuY3Rpb24ocmVzdWx0cykge1xuICAgIGlmIChyZXN1bHRzKSB7XG4gICAgICB2YXIgcXVlcnlTZXJ2aWNlID0gR1VJLmdldENvbXBvbmVudCgncXVlcnlyZXN1bHRzJykuZ2V0U2VydmljZSgpO1xuICAgICAgdmFyIGRpZ2VzdFJlc3VsdHMgPSBxdWVyeVNlcnZpY2UuX2RpZ2VzdEZlYXR1cmVzRm9yTGF5ZXJzKHJlc3VsdHMuZGF0YSk7XG4gICAgICB2YXIgZmVhdHVyZXMgPSBkaWdlc3RSZXN1bHRzLmxlbmd0aCA/IGRpZ2VzdFJlc3VsdHNbMF0uZmVhdHVyZXM6IGRpZ2VzdFJlc3VsdHM7XG4gICAgICBpZiAoZmVhdHVyZXMubGVuZ3RoICYmICF0aGlzLl9mZWF0dXJlc0FscmVhZHlBZGRlZChmZWF0dXJlcykpIHtcbiAgICAgICAgdGhpcy5zdGF0ZS5mZWF0dXJlc0ZvdW5kID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5zdGF0ZS5hZGRlZCA9IGZhbHNlO1xuICAgICAgICAvLyByZXN0aXR1aXNjZSBzb2xvIGxlIGZlYXR1cmUgdGVycmVub1xuICAgICAgICBmZWF0dXJlcyA9IHRoaXMuYWRkUGFydGljZWxsZShmZWF0dXJlcyk7XG4gICAgICAgIHRoaXMuX3Nob3dDb250ZW50KGZlYXR1cmVzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0aGlzLl9mZWF0dXJlc0FscmVhZHlBZGRlZChmZWF0dXJlcykpIHtcbiAgICAgICAgICAvLyBnacOgIHN0YXRhIGFnZ2l1bnRhXG4gICAgICAgICAgdGhpcy5zdGF0ZS5mZWF0dXJlc0ZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLnN0YXRlLmFkZGVkID0gdHJ1ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIG5lc3N1bmEgZmVhdHVyZSB0cm92YXRhXG4gICAgICAgICAgdGhpcy5zdGF0ZS5hZGRlZCA9IGZhbHNlO1xuICAgICAgICAgIHRoaXMuc3RhdGUuZmVhdHVyZXNGb3VuZCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIC8vcmlwdWxpc2NlIHR1dHRvXG4gIHRoaXMuY2xvc2VDb250ZW50ID0gZnVuY3Rpb24oKSB7XG4gICAgR1VJLmNsb3NlQ29udGVudCgpO1xuICB9O1xuXG59XG5cbmluaGVyaXQoUGFuZWxTZXJ2aWNlLCBHM1dPYmplY3QpO1xubW9kdWxlLmV4cG9ydHMgPSBQYW5lbFNlcnZpY2U7IiwibW9kdWxlLmV4cG9ydHMgPSBcIjxkaXYgY2xhc3M9XFxcImNkdS1zZWFyY2gtcGFuZWwgZm9ybS1ncm91cFxcXCI+XFxuICA8aDQ+e3t0aXRsZX19PC9oND5cXG4gIDxmb3JtIGlkPVxcXCJjZHUtc2VhcmNoLWZvcm1cXFwiPlxcbiAgICA8dGVtcGxhdGUgdi1mb3I9XFxcIihmb3JtaW5wdXQsIGluZGV4KSBpbiBmb3JtaW5wdXRzXFxcIj5cXG4gICAgICA8ZGl2IHYtaWY9XFxcImZvcm1pbnB1dC5pbnB1dC50eXBlID09ICdudW1iZXJmaWVsZCdcXFwiIGNsYXNzPVxcXCJmb3JtLWdyb3VwIG51bWVyaWNcXFwiPlxcbiAgICAgICAgPGxhYmVsIDpmb3I9XFxcImZvcm1pbnB1dC5pZCArICcgJ1xcXCI+e3sgZm9ybWlucHV0LmxhYmVsIH19PC9sYWJlbD5cXG4gICAgICAgIDxpbnB1dCB0eXBlPVxcXCJudW1iZXJcXFwiIHYtbW9kZWw9XFxcImZvcm1JbnB1dFZhbHVlc1tpbmRleF0udmFsdWVcXFwiIGNsYXNzPVxcXCJmb3JtLWNvbnRyb2xcXFwiIDppZD1cXFwiZm9ybWlucHV0LmlkXFxcIj5cXG4gICAgICA8L2Rpdj5cXG4gICAgICA8ZGl2IHYtaWY9XFxcImZvcm1pbnB1dC5pbnB1dC50eXBlID09ICd0ZXh0ZmllbGQnIHx8IGZvcm1pbnB1dC5pbnB1dC50eXBlID09ICd0ZXh0RmllbGQnXFxcIiBjbGFzcz1cXFwiZm9ybS1ncm91cCB0ZXh0XFxcIj5cXG4gICAgICAgIDxsYWJlbCA6Zm9yPVxcXCJmb3JtaW5wdXQuaWRcXFwiPnt7IGZvcm1pbnB1dC5sYWJlbCB9fTwvbGFiZWw+XFxuICAgICAgICA8aW5wdXQgdHlwZT1cXFwidGV4dFxcXCIgdi1tb2RlbD1cXFwiZm9ybUlucHV0VmFsdWVzW2luZGV4XS52YWx1ZVxcXCIgY2xhc3M9XFxcImZvcm0tY29udHJvbFxcXCIgOmlkPVxcXCJmb3JtaW5wdXQuaWRcXFwiPlxcbiAgICAgIDwvZGl2PlxcbiAgICA8L3RlbXBsYXRlPlxcbiAgICA8ZGl2IGNsYXNzPVxcXCJmb3JtLWdyb3VwXFxcIj5cXG4gICAgICA8YnV0dG9uIGNsYXNzPVxcXCJidG4gYnRuLXByaW1hcnkgYnRuLWJsb2NrIHB1bGwtcmlnaHRcXFwiIEBjbGljaz1cXFwiYWRkUGFydGljZWxsYSgkZXZlbnQpXFxcIj5BZ2dpdW5naTwvYnV0dG9uPlxcbiAgICA8L2Rpdj5cXG4gIDwvZm9ybT5cXG4gIDxkaXYgaWQ9XFxcImNkdS1zZWFyY2gtbWVzc2FnZXNcXFwiIHN0eWxlPVxcXCJjb2xvcjojZWM5NzFmXFxcIj5cXG4gICAgPGRpdiB2LWlmPVxcXCJzdGF0ZS5hZGRlZFxcXCI+XFxuICAgICAgPGI+TGEgcGFydGljZWxsYSDDqCBzdGF0YSBnacOgIGFnZ2l1bnRhPC9iPlxcbiAgICA8L2Rpdj5cXG4gICAgPGRpdiB2LWlmPVxcXCIhc3RhdGUuZmVhdHVyZXNGb3VuZFxcXCI+XFxuICAgICAgPGI+TmVzc3VuYSBwYXJ0aWNlbGxhIHRyb3ZhdGE8L2I+XFxuICAgIDwvZGl2PlxcbiAgICA8ZGl2IHYtaWY9XFxcIiFzdGF0ZS5pc1ZhbGlkRm9ybVxcXCI+XFxuICAgICAgPGI+Q29tcGlsYSBsYSByaWNlcmNhIGluIHR1dHRpIGkgc3VvaSBjYW1waTwvYj5cXG4gICAgPC9kaXY+XFxuICA8L2Rpdj5cXG48L2Rpdj5cXG5cXG5cIjtcbiIsInZhciBpbmhlcml0ID0gZzN3c2RrLmNvcmUudXRpbHMuaW5oZXJpdDtcbnZhciBiYXNlID0gZzN3c2RrLmNvcmUudXRpbHMuYmFzZTtcbnZhciBTZWFyY2hQYW5lbCA9IGczd3Nkay5ndWkudnVlLlNlYXJjaFBhbmVsO1xudmFyIFNlcnZpY2UgPSByZXF1aXJlKCcuLi9zZWFyY2hwYW5lbHNlcnZpY2UnKTtcblxuLy9jb21wb25lbnRlIHZ1ZSBwYW5uZWxsbyBzZWFyY2hcbnZhciBDZHVTZWFyY2hQYW5lbENvbXBvbmVudCA9IFZ1ZS5leHRlbmQoe1xuICB0ZW1wbGF0ZTogcmVxdWlyZSgnLi9zZWFjaHBhbmVsLmh0bWwnKSxcbiAgZGF0YTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRpdGxlOiBcIlwiLFxuICAgICAgZm9ybWlucHV0czogW10sXG4gICAgICBmaWx0ZXJPYmplY3Q6IHt9LFxuICAgICAgZm9ybUlucHV0VmFsdWVzIDogW10sXG4gICAgICBzdGF0ZTogbnVsbFxuICAgIH1cbiAgfSxcbiAgbWV0aG9kczoge1xuICAgIGFkZFBhcnRpY2VsbGE6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICB2YXIgaXNWYWxpZEZvcm0gPSB0cnVlO1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIC8vIHZhZG8gYSB2ZXJpZmljYXJlIHNlIGdsaSBpbnB1dCBzb25vIHN0YXRpIHJpZW1waXRpIG5lbCBzZW5zb1xuICAgICAgLy8gY2hlIG5vbiBjb250ZW5nb25vIHZhbG9yaSBudWxsaVxuICAgICAgXy5mb3JFYWNoKHRoaXMuZm9ybUlucHV0VmFsdWVzLCBmdW5jdGlvbihpbnB1dE9iaikge1xuICAgICAgICBpZiAoXy5pc05pbChpbnB1dE9iai52YWx1ZSkpIHtcbiAgICAgICAgICBpc1ZhbGlkRm9ybSA9IGZhbHNlO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICAvLyBzZXR0byBpbCB2YWxvcmUgZGVsIHZhaWxkIEZvcm0gcGVyIHZpc3VhbGl6emFyZSBvIG1lbm8gaWwgbWVzc2FnZ2lvXG4gICAgICB0aGlzLnN0YXRlLmlzVmFsaWRGb3JtID0gaXNWYWxpZEZvcm07XG4gICAgICAvLyBmYWNjaW8gdW5hIHZlcmlmaWNhIHNlIGlsIGZvcm0gw6ggc3RhdG8gY29tcGxldGF0byBjb3JyZXR0YW1lbnRlXG4gICAgICBpZiAodGhpcy5zdGF0ZS5pc1ZhbGlkRm9ybSkge1xuICAgICAgICB0aGlzLmZpbHRlck9iamVjdCA9IHRoaXMuZmlsbEZpbHRlcklucHV0c1dpdGhWYWx1ZXModGhpcy5maWx0ZXJPYmplY3QsIHRoaXMuZm9ybUlucHV0VmFsdWVzKTtcbiAgICAgICAgdGhpcy4kb3B0aW9ucy5zZXJ2aWNlLmdldFJlc3VsdHMoW3RoaXMuZmlsdGVyT2JqZWN0XSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59KTtcblxuZnVuY3Rpb24gQ2R1U2VhY2hQYW5lbChvcHRpb25zKSB7XG4gIC8vbGUgb3B0aW9uIHNvbm8gaWwgY29uZmlnIGRpIHF1ZWxsYSBzcGVjaWZpY2EgY2R1XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICBvcHRpb25zLmlkID0gXCJjZHUtc2VhcmNoLXBhbmVsXCI7XG4gIG9wdGlvbnMubmFtZSA9IG9wdGlvbnMubmFtZTtcbiAgdmFyIGFwaSA9IG9wdGlvbnMuYXBpO1xuICB2YXIgZG9jdXJsID0gb3B0aW9ucy5kb2N1cmw7XG4gIHZhciBzZWFyY2hDb25maWcgPSBvcHRpb25zLnNlYXJjaDtcbiAgLy8gcmljYXZvIGkgZmllbGRzIGRlbCBjYXRhc3RvXG4gIHZhciBjYXN0YXN0b0ZpZWxkcyA9IFtdO1xuICBfLmZvckVhY2goc2VhcmNoQ29uZmlnLm9wdGlvbnMuZmlsdGVyLkFORCwgZnVuY3Rpb24oZmllbGQpIHtcbiAgICBjYXN0YXN0b0ZpZWxkcy5wdXNoKHtcbiAgICAgIGZpZWxkOiBmaWVsZC5hdHRyaWJ1dGUsXG4gICAgICBsYWJlbDogZmllbGQubGFiZWxcbiAgICB9KVxuICB9KTtcbiAgdmFyIHNlcnZpY2UgPSBvcHRpb25zLnNlcnZpY2UgfHwgbmV3IFNlcnZpY2Uoe1xuICAgIHVybHM6IHtcbiAgICAgIGFwaTogYXBpLFxuICAgICAgZG9jdXJsOiBkb2N1cmxcbiAgICB9LFxuICAgIGNhdGFzdG9GaWVsZHM6IGNhc3Rhc3RvRmllbGRzXG4gIH0pO1xuICBiYXNlKHRoaXMsIG9wdGlvbnMpO1xuICB0aGlzLnNldEludGVybmFsUGFuZWwobmV3IENkdVNlYXJjaFBhbmVsQ29tcG9uZW50KHtcbiAgICBzZXJ2aWNlOiBzZXJ2aWNlXG4gIH0pKTtcbiAgdGhpcy5pbnRlcm5hbFBhbmVsLnN0YXRlID0gc2VydmljZS5zdGF0ZTtcbiAgLy8gdmFkbyBhZCBpbml6aWFsaXp6YXJlIGlsIHBhbm5lbGxvIGRlbGxhIHNlYXJjaFxuICB0aGlzLmluaXQoc2VhcmNoQ29uZmlnKTtcblxuICB0aGlzLnVubW91bnQgPSBmdW5jdGlvbigpIHtcbiAgICBzZXJ2aWNlLmNsb3NlQ29udGVudCgpO1xuICAgIHJldHVybiBiYXNlKHRoaXMsICd1bm1vdW50Jyk7XG5cbiAgfVxufVxuXG5pbmhlcml0KENkdVNlYWNoUGFuZWwsIFNlYXJjaFBhbmVsKTtcblxubW9kdWxlLmV4cG9ydHMgPSBDZHVTZWFjaFBhbmVsO1xuIl19
