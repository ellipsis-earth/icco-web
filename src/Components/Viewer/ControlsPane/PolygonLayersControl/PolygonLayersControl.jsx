import React, { PureComponent } from 'react';
import { GeoJSON } from 'react-leaflet';

import {
  Card,
  Checkbox,
  CardHeader,
  CardContent,
  Collapse,
  IconButton,
  Typography
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import SaveAlt from '@material-ui/icons/SaveAlt';

import Utility from '../../../../Utility';
import ViewerUtility from '../../ViewerUtility';

import './PolygonLayersControl.css';

import ApiManager from '../../../../ApiManager';

const MAX_POLYGONS = 500;

class PolygonLayersControl extends PureComponent {

  layerGeoJsons = {}

  constructor(props, context) {
    super(props, context);

    this.state = {
      availableLayers: [],
      selectedLayers: [],

      options: [],

      expanded: true,

      count: {}
    };

    this.INIT_SELECTED = ['Sampled areas', 'Shea trees']
  }

  componentDidMount() {
    this.props.onLayersChange([]);
  }

  componentDidUpdate(prevProps) {
    if (!this.props.map || !this.props.timestampRange) {
      this.props.onLayersChange([]);
      return;
    }

    let differentMap = this.props.map !== prevProps.map;

    let differentTimestamp = !prevProps.timestampRange ||
      this.props.timestampRange.start !== prevProps.timestampRange.start ||
      this.props.timestampRange.end !== prevProps.timestampRange.end;

    let differentBounds = !prevProps.leafletMapViewport ||
      this.props.leafletMapViewport.bounds.xMin !== prevProps.leafletMapViewport.bounds.xMin ||
      this.props.leafletMapViewport.bounds.xMax !== prevProps.leafletMapViewport.bounds.xMax ||
      this.props.leafletMapViewport.bounds.yMin !== prevProps.leafletMapViewport.bounds.yMin ||
      this.props.leafletMapViewport.bounds.yMax !== prevProps.leafletMapViewport.bounds.yMax;

    if (differentMap || differentTimestamp || differentBounds ) {

      let availableLayers = this.state.availableLayers;
      let selectedLayers = this.state.selectedLayers;

      if (differentMap) {
        availableLayers = this.getAvailableLayers(this.props.map);
        selectedLayers = [...availableLayers].filter(x => {return this.INIT_SELECTED.indexOf(x.name) > -1 ? x : null});
        this.layerGeoJsons = {};

        this.setState({
          availableLayers: availableLayers,
          selectedLayers: selectedLayers,
          count: {}
        });
      }

      this.prepareLayers(this.props.map, this.props.timestampRange, availableLayers, selectedLayers)
        .then(leafletLayers => {
          this.props.onLayersChange(leafletLayers);
        });
    }
  }

  refresh = () => {
    this.prepareLayers(this.props.map, this.props.timestampRange, this.state.availableLayers, this.state.selectedLayers)
    .then(leafletLayers => {
      this.props.onLayersChange(leafletLayers);
    });
  }

  selectLayer = (layer) => {
    let availableLayer = this.state.availableLayers.find(x => x.name === layer);
    if (availableLayer && !this.state.selectedLayers.find(x => x.name === layer)) {
      this.setState({ selectedLayers: [...this.state.selectedLayers, availableLayer] });
    }
  }

  getAvailableLayers = (map) => {
    return map.layers.polygon;
    
    /*let availableLayers = [];

    for (let i = 0; i < map.layers.polygon.length; i++) {

      let mapTimestampPolygonLayers = map.layers.polygon[i];

      for (let y = 0; y < mapTimestampPolygonLayers.layers.length; y++) {
        let layer = mapTimestampPolygonLayers.layers[y];

        let availableLayer = availableLayers.find(x => x.name === layer.name);

        if (!availableLayer) {
          availableLayers.push({
            name: layer.name,
            color: layer.color,
            hasAggregatedData: layer.hasAggregatedData
          });
        }
      }
    }

    return availableLayers;*/
  }

  createLayerCheckboxes = () => {
    let options = [];

    let availableLayers = this.state.availableLayers;
    let selectedLayers = this.state.selectedLayers;

    for (let i = 0; i < availableLayers.length; i++) {

      let availableLayer = availableLayers[i];
      let checked = selectedLayers.find(x => x === availableLayer) ? true : false;

      let counter = null;
      let count = this.state.count[availableLayer.name];
      if (checked && count !== undefined) {
        let className = '';
        let downloadButton = null;

        if (count > MAX_POLYGONS) {
          className = 'geometry-limit-exceeded';
        }
        else {
          downloadButton = (
            <IconButton
              className='download-geometry-button'
              onClick={() => this.onDownload(availableLayer.name)}
            >
              <SaveAlt className='download-geometry-button-icon'/>
            </IconButton>
          );
        }

        counter = (
          <span className='geometry-counter'>
            <span className={className}>{count}</span>
            <span>/{MAX_POLYGONS}</span>
            {downloadButton}
          </span>
        )
      }

      let option = (
        <div key={availableLayer.name} className='layer-checkboxes'>
          <Checkbox
            key={availableLayer.name}
            classes={{ root: 'layers-control-checkbox' }}
            color='primary'
            value={availableLayer.name}
            name={availableLayer.name}
            onChange={this.onLayerChange}
            checked={checked}
          />
          <span>
            {availableLayer.name}
          </span>
          {counter}
        </div>
      )

      options.push(option);
    }

    return options;
  }

  prepareLayers = async (map, timestampRange, availableLayers, selectedLayers) => {
    let promises = [];

    for (let i = 0; i < availableLayers.length; i++) {

      let polygonLayer = availableLayers[i]

      if (!selectedLayers.find(x => x.name === polygonLayer.name)) {
        continue;
      }

      let bounds = this.props.leafletMapViewport.bounds;

      let body = {
        mapId: map.id,
        timestamp: map.timestamps[timestampRange.end].timestampNumber,
        layer: polygonLayer.name,
        xMin: bounds.xMin,
        xMax: bounds.xMax,
        yMin: bounds.yMin,
        yMax: bounds.yMax,
        zoom: map.zoom,
        limit: MAX_POLYGONS
      }

      let leafletGeojsonLayerPromise = ApiManager.post('/metadata/polygons', body, this.props.user)
        .then(async (polygonIds) => {
          let count = {
            ...this.state.count,
          };
          count[polygonLayer.name] = polygonIds.count;

          this.setState({ count: count });

          if (!polygonIds || polygonIds.count === 0 || polygonIds.count > MAX_POLYGONS) {
            this.layerGeoJsons[polygonLayer.name] = null;
            return null;
          }

          let ids = {reserved: [], done: [], ids:polygonIds.ids};
          let properties = {};

          if (polygonLayer.name === 'Sampled areas')
          {
            body = {
              mapId: map.id,
              filters: {forms: ['reserved', 'done'], types: ['polygon'], polygonIds: polygonIds.ids}
            }


            let formMessagesPromises = [];

            for (let j = 1; j < 5; j++)
            {
              body.page = j;
              formMessagesPromises.push(ApiManager.post('/geoMessage/feed', body, this.props.user));
            }

            let messagesArray = await Promise.all(formMessagesPromises);
            let messages = Array.prototype.concat.apply([], messagesArray);

            if(messages.length && messages.length > 0)
            {

              for (let k = 0; k < messages.length; k++)
              {
                ids[messages[k].form.formName] ? ids[messages[k].form.formName].push(messages[k].elementId) : ids[messages[k].form.formName] = [messages[k].elementId];
                properties[messages[k].elementId] = {};
                properties[messages[k].elementId].user = messages[k].user;
                properties[messages[k].elementId].messageID = messages[k].id;
              }

              ids['reserved'] = ids['reserved'].filter((x) => {return ids['done'].indexOf(x) === -1});

              let allFilter = [...ids['reserved'], ...ids['done']];

              ids['ids'] = polygonIds.ids.filter((x) => {return allFilter.indexOf(x) === -1});
            }
          }


          /*let formMessages = await ApiManager.post('/geoMessage/feed', body, this.props.user);

          while (formMessages.length > 0)
          {
            for (let i = 0; i < formMessages.length; i++)
            {
              formMessages[i].form.formName === 'reserved' ? reserved.push(formMessages[i].elementId) : done.push(formMessages[i].elementId);
              properties[formMessages[i].elementId] = {};
              properties[formMessages[i].elementId].user = formMessages[i].user;
              properties[formMessages[i].elementId].messageID = formMessages[i].id;
            }

            body.page = body.page + 1;
            formMessages = await ApiManager.post('/geoMessage/feed', body, this.props.user)
          }*/

          /*reserved = reserved.filter((x) => {return done.indexOf(x) === -1});

          let allFilter = [...reserved, ...done];

          polygonIds.ids = polygonIds.ids.filter((x) => {return allFilter.indexOf(x) === -1});*/
          let geometriesPromises = [];

          for(let key in ids)
          {
            if(ids[key].length && ids[key].length > 0)
            {
              body = {
                mapId: map.id,
                timestamp: map.timestamps[timestampRange.end].timestampNumber,
                polygonIds: ids[key]
              }

              geometriesPromises.push(body.polygonIds.length > 0 ? ApiManager.post('/geometry/polygons', body, this.props.user) : null);
            }
          }

          let geometries = await Promise.all(geometriesPromises);

          let keys = Object.keys(ids);
          let returnObject = {};

          for (let l = 0; l < keys.length; l++)
          {
            let key = keys[l];
            if (key !== 'ids' && geometries[l])
            {
              for (let m = 0; m < geometries[l].features.length; m++)
              {
                let feature = geometries[l].features[m];
                if (properties[feature.id])
                {
                  feature.properties.status = key;
                  feature.properties.statusOwner = properties[feature.id].user;
                  feature.properties.messageID = properties[feature.id].messageID;
                }
              }
            }

            returnObject[key] = geometries[l];
          }


          //let ids = body.polygonIds.length > 0 ? await ApiManager.post('/geometry/polygons', body, this.props.user) : [];

          /*body.polygonIds = reserved;
          let reservedIds = body.polygonIds.length > 0 ? await ApiManager.post('/geometry/polygons', body, this.props.user) : [];

          body.polygonIds = done;
          let doneIds = body.polygonIds.length > 0 ? await ApiManager.post('/geometry/polygons', body, this.props.user) : [];

          for (let i = 0; i < reservedIds.features.length; i++)
          {
            reservedIds.features[i].properties.status = 'reserved';
            reservedIds.features[i].properties.statusOwner = properties[reservedIds.features[i].id].user;
            reservedIds.features[i].properties.messageID = properties[reservedIds.features[i].id].messageID;
          }

          for (let i = 0; i < doneIds.features.length; i++)
          {
            doneIds.features[i].properties.status = 'done';
            doneIds.features[i].properties.statusOwner = properties[doneIds.features[i].id].user;
            doneIds.features[i].properties.messageID = properties[doneIds.features[i].id].messageID;
          }

          let returnObject = {ids: ids, reserved: reservedIds, done: doneIds};*/

          return returnObject;
        })
        .then(polygonsGeoJson => {
          if (!polygonsGeoJson) {
            this.layerGeoJsons[polygonLayer.name] = null;
            return null;
          }

          let geoJsons = [];

          let i = 1;

          for(let key in polygonsGeoJson)
          {
            this.layerGeoJsons[polygonLayer.name] = {
              geoJson: polygonsGeoJson[key],
              bounds: bounds
            };

            let color = '#' + polygonLayer.color;
            if(key === 'reserved')
            {
              color = '#ff7f00ff';
            }
            else if(key === 'done')
            {
              color = '#00ff00ff';
            }

            geoJsons.push(
              <GeoJSON
                key={Math.random()}
                name={polygonLayer.name}
                data={polygonsGeoJson[key]}
                style={ViewerUtility.createGeoJsonLayerStyle(color)}
                zIndex={ViewerUtility.polygonLayerZIndex + i}
                onEachFeature={(feature, layer) => layer.on({ click: () => this.onFeatureClick(feature, polygonLayer.hasAggregatedData) })}
              />
            );

            i++;
          }

          return geoJsons;
        });

      promises.push(leafletGeojsonLayerPromise);
    }

    let leafletGeoJsonLayers = await Promise.all(promises);

    return leafletGeoJsonLayers;
  }

  onLayerChange = (e) => {

    let layerName = e.target.value;
    let checked = e.target.checked;

    let isSelected = this.state.selectedLayers.find(x => x.name === layerName);

    let newSelectedLayers = null;
    let changed = false;

    if (checked && !isSelected) {
      let availableLayer = this.state.availableLayers.find(x => x.name === layerName);

      newSelectedLayers = [...this.state.selectedLayers, availableLayer];

      changed = true;
    }
    else if (!checked && isSelected) {
      newSelectedLayers = Utility.arrayRemove(this.state.selectedLayers, isSelected);

      newSelectedLayers = [...newSelectedLayers];

      changed = true;
    }

    if (changed) {
      this.setState({ selectedLayers: newSelectedLayers });

      this.prepareLayers(this.props.map, this.props.timestampRange, this.state.availableLayers, newSelectedLayers)
        .then(polygonsGeoJson => {
          this.props.onLayersChange(polygonsGeoJson);
        });
    }
  }

  onExpandClick = () => {
    this.setState({ expanded: !this.state.expanded });
  }

  onFeatureClick = (feature, hasAggregatedData) => {
    this.props.onFeatureClick(feature, hasAggregatedData);
  }

  onDownload = (layerName) => {
    let data = this.layerGeoJsons[layerName];

    if (!data) {
      return;
    }

    let bounds = data.bounds;

    let decimals = 4;

    let nameComponents = [
      this.props.map.name,
      'polygons',
      layerName,
      bounds.xMin.toFixed(decimals),
      bounds.xMax.toFixed(decimals),
      bounds.yMin.toFixed(decimals),
      bounds.yMax.toFixed(decimals)
    ];

    let fileName = nameComponents.join('_').replace(' ', '_') + '.geojson';

    ViewerUtility.download(fileName, JSON.stringify(data.geoJson), 'application/json');
  }

  render() {

    if (!this.props.map || this.state.availableLayers.length === 0) {
      return null;
    }

    return (
      <Card className='layers-contol'>
        <CardHeader
          className='material-card-header'
          title={
            <Typography gutterBottom variant="h6" component="h2">
              {this.props.localization['Polygons']}
            </Typography>
          }
          action={
            <IconButton
              className={this.state.expanded ? 'expand-icon expanded' : 'expand-icon'}
              onClick={this.onExpandClick}
              aria-expanded={this.state.expanded}
              aria-label='Show'
            >
              <ExpandMoreIcon />
            </IconButton>
          }
        />
        <Collapse in={this.state.expanded}>
          <CardContent
            className={'card-content'}
          >
            {
              !this.props.override ?
                this.createLayerCheckboxes() :
                <div className='controls-pane-background-text'>Controlled by feed</div>
            }
          </CardContent>
        </Collapse>
      </Card>
    );
  }
}

export default PolygonLayersControl;
