import React, { PureComponent } from 'react';

import Control from 'react-leaflet-control';
import LayersIcon from '@material-ui/icons/Layers';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Checkbox,
  CircularProgress,
  Collapse,
} from '@material-ui/core';


import ControlsPane from '../ControlsPane/ControlsPane';

import './LayerSelector.css';


export default class LayerSelector extends PureComponent {
  constructor(props, context) {
    super(props, context);

    this.state = {
        expand: false,
        loading: true,
        selectObjects: [],
        selectedLayers: [],
    };
  }

  createCheckbox(name, key, selectedLayers = [])
  {
    let filter = ['shea trees'];

    if(selectedLayers.length === 0){selectedLayers = this.state.selectedLayers};

    let checked = selectedLayers.indexOf(name) > -1;

    if (filter.indexOf(name) === -1)
    {
      return (
        <div key={name} className='layer-checkboxes'>
          <Checkbox
            key={name}
            classes={{ root: 'layers-control-checkbox' }}
            color='primary'
            value={name}
            name={name}
            onChange={() => {this.props.onCheckChange(key, name, checked)}}
            checked={checked}
          />
          <span>
            {name}
          </span>
        </div>
      );
    }
  }

  createCheckboxList(selectedLayers) {
    if(this.props.map && this.props.map.layers)
    {
      //console.log(this.props.map.layers);
      let selectObjects = [];
    
      let layers = this.props.map.layers;
      for (let key in layers)
      {
        let timestamps = layers[key];
        //console.log(timestamps)
  
        let filtered = timestamps.find((timestamp) => {return key === 'customPolygon' || (timestamp.timestampNumber === this.props.timestampRange.end) ? timestamp : null})
        //console.log(filtered)

        if (filtered && key === 'customPolygon')
        {
          selectObjects.push(this.createCheckbox(filtered.name, key, selectedLayers));
        }
        else if(filtered)
        {
          for (let i = 0; i < filtered.layers.length; i++)
          {
            selectObjects.push(this.createCheckbox(filtered.layers[i].name, key, selectedLayers));
          }
        }
      }
  
      return selectObjects;
    }
  }

  componentDidUpdate(prevProps) {

    let statePush = {};

    if (this.props.map !== prevProps.map)
    {
      statePush['selectObjects'] = this.createCheckboxList();
    }

    if (this.props.layers[0] !== prevProps.layers[0])
    {
      let selectedLayers = [];

      for (let i = 0; i < this.props.layers[0].length; i++)
      {
        if(this.props.layers[0][i] && this.props.layers[0][i].length)
        {
          for (let j = 0; j < this.props.layers[0][i].length; j++)
          {
            selectedLayers.push(this.props.layers[0][i][j].props.name);
          }
        }
        else if(this.props.layers[0][i])
        {
          selectedLayers.push(this.props.layers[0][i].props.name);
        }
      }

      statePush['selectedLayers'] = selectedLayers;
      statePush['selectObjects'] = this.createCheckboxList(selectedLayers);
    }

    this.setState(statePush);
  }

  render() {
    return (
      <Control
          position="topright"
          className={this.state.expand ? "LayerSelector LayerSelectorExpanded" : "LayerSelector"}
          key={'LayerSelector' + this.state.expand}
      >
      <Card>
        <CardHeader
          className='material-card-header'
          action={
            <div>
              <Button
                variant='contained'
                color='secondary'
                onClick={() => this.setState({expand: !this.state.expand})}
              >
                <LayersIcon />
              </Button>
            </div>
          }
        />
        <Collapse in={this.state.expand}>
          <CardContent className={'card-content'}>
            {/*<ControlsPane
              key={'controls-pane' + (this.props.map ? ' loaded' : '') + this.state.expand}
              ref={this.controlsPane}
              localization={this.props.localization}
              user={this.props.user}
              isOpen={this.props.isOpen}
              leafletMapViewport={this.props.leafletMapViewport}
              timestampRange={this.props.timestampRange}
              geolocation={this.props.geolocation}
              override={this.props.override}
              onSelectMap={this.props.onSelectMap}
              onDataPaneAction={this.props.onDataPaneAction}
              onLayersChange={this.props.onLayersChange}
              onFeatureClick={this.props.selectFeature}
              onFlyTo={this.props.onFlyTo}
              onDeselect={this.props.deselectCurrentElement}
              layerSelector={true}
              map={this.props.map}
            />*/}
            {
              this.state.selectObjects && this.state.selectObjects.length > 0 ?
              this.state.selectObjects : <CircularProgress className='loading-spinner'/>
            }
          </CardContent>
        </Collapse>
      </Card>
    </Control>
    )
  }
}