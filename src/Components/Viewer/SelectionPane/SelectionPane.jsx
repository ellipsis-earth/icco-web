import React, { PureComponent } from 'react';
import { NavLink } from "react-router-dom";

import {
  Button,
  Card,
  Collapse,
  CardHeader,
  CardContent,
  CardActions,
  IconButton,
  Typography,
  CircularProgress,
  Fab,
} from '@material-ui/core';
import ClearIcon from '@material-ui/icons/Clear';
import SaveAlt from '@material-ui/icons/SaveAlt';
import AddAPhoto from '@material-ui/icons/AddAPhoto';
import Delete from '@material-ui/icons/Delete';
import Done from '@material-ui/icons/Done';
import Flag from '@material-ui/icons/Flag';

import ViewerUtility from '../ViewerUtility';

import './SelectionPane.css';
import ApiManager from '../../../ApiManager';

import { toast } from 'react-toastify';

import { readAndCompressImage } from 'browser-image-resizer';
const DELETE_CUSTOM_POLYGON_ACTION = 'delete_custom_polygon';
const IMAGE_MIME_TYPES = ['image/gif', 'image/jpeg', 'image/png'];
const MAX_IMAGE_DIMENSIONS = { width: 1920, height: 1080};
const MAX_IMAGE_SIZE = 10000000;

class SelectionPane extends PureComponent {

  constructor(props, context) {
    super(props, context);

    this.state = {
      isOpen: false,
      loading: false,
    };
  }

  componentDidUpdate(prevProps) {
    if (!this.props.map || prevProps.map !== this.props.map || !this.props.element) {
      this.setState({ isOpen: false });
    }
    else if (prevProps.element !== this.props.element) {
      this.setState({ isOpen: true });
    }
  }

  open = () => {
    this.setState({ isOpen: true });
  }

  refresh = () => {
    this.forceUpdate();
  }

  deleteCustomPolygon = () => {
    this.setState({ loading: true }, () => {
      let body = {
        mapId: this.props.map.id,
        polygonId: this.props.element.feature.properties.id
      };

      ApiManager.post('/geometry/deletePolygon', body, this.props.user)
        .then(() => {
          this.props.onDeleteCustomPolygon();
          this.props.onDeselect();
          toast.success('Shea Tree deleted, updating map...');
          this.setState({ isOpen: false, loading: false });
        })
        .catch(err => {
          console.log(err);
          this.setState({ loading: false });
        });
    });

  }

  onCloseClick = () => {
    this.props.onDeselect();

    this.setState({ isOpen: false });
  }

  onElementActionClick = (action) => {
    if (action === DELETE_CUSTOM_POLYGON_ACTION) {
      this.deleteCustomPolygon();
    }
    else if(action === 'create_custom_polygon')
    {
      let body = {
        mapId: this.props.map.id,
        timestamp: this.props.timestampRange.end,
        feature: this.props.element.feature,
        layer: 'Shea trees',
      }

      ApiManager.post('/geometry/addPolygon', body, this.props.user)
      .then((result) => {
        toast.success('Shea Tree added, updating map...');
        this.props.onDeselect();
        this.props.onDeleteCustomPolygon();
      })
      .catch(err => {
        toast.error('Error while adding Shea Tree');
      });
    }
    else
    {
      console.log(action, this.props.element)

      /*if (action === 'geoMessage')
      {
        this.onImageChange(e)
      }
      else*/ /*if(action === 'claim')
      {
        this.onShapeClaim()
      }*/

      //geomessage
      //claim
      //create_custom_polygon


      //this.props.onDataPaneAction(action);
    }
  }

  onDownload = () => {
    let element = this.props.element;

    if (!element) {
      return;
    }

    let type = element.type;
    let feature = element.feature;

    let nameComponents = [this.props.map.name];

    if (type === ViewerUtility.standardTileLayerType) {
      nameComponents.push(
        'tile',
        feature.properties.tileX,
        feature.properties.tileY,
        feature.properties.zoom
      );
    }
    else if (type === ViewerUtility.polygonLayerType) {
      nameComponents.push('polygon', feature.properties.id);
    }
    else if (type === ViewerUtility.customPolygonTileLayerType) {
      nameComponents.push('customPolygon', feature.properties.id);
    }
    else if (type === ViewerUtility.drawnPolygonLayerType) {
      nameComponents.push('drawnPolygon');
    }

    let fileName = nameComponents.join('_').replace(' ', '_') + '.geojson';

    let geoJson = {
      type: 'FeatureCollection',
      count: 1,
      features: [feature]
    };

    ViewerUtility.download(fileName, JSON.stringify(geoJson), 'application/json');
  }

  onImageChange = (e) => {
    e.preventDefault();

    let file = e.target.files[0];

    if (!file) {
      toast.warn('No file');
      return;
    }

    if (!IMAGE_MIME_TYPES.includes(file.type)) {
      toast.warn('Invalid image type.');
      return;
    }

    this.setState({ loading: true }, () => {
      const imgConfig = {
        quality: 0.8,
        maxWidth: MAX_IMAGE_DIMENSIONS.width,
        maxHeight: MAX_IMAGE_DIMENSIONS.height,
        autoRotate: true
      };

      readAndCompressImage(file, imgConfig)
        .then(image => {

          if (image.size > MAX_IMAGE_SIZE) {
            toast.warn(`Image too large (max ${(MAX_IMAGE_SIZE / 1000).toFixed(2)} MB).`);
            this.setState({ loading: false });
            return;
          }

          return new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = function() {
              resolve(reader.result);
            };
            reader.readAsDataURL(image);
          });
        })
        .then(base64 => {
          //this.uploadedImage = base64;
          this.sendPhoto(base64);
          /*toast.success('Upload successfull');
          this.setState({ loading: false });*/
        })
        .catch(err => {
          console.log(err)
          this.setState({ loading: false });
          toast.warn('Invalid image type.');
        });
    });
  }

  sendPhoto = (base64) => {
    let element = this.props.element;
    let elementProperties = element.feature.properties;
    let urlType = null;
    let body = {
      'mapId': this.props.map.id,
      timestamp: this.props.timestampRange.end,
      message: '',
      private: false,
      image: base64,
    }

    if (element.type === ViewerUtility.polygonLayerType) {
      body.polygonId = elementProperties.id;

      urlType = 'polygon';
    }
    else if (element.type === ViewerUtility.customPolygonTileLayerType) {
      body.customPolygonId = elementProperties.id;

      urlType = 'customPolygon';
    }

    ApiManager.post(`/geomessage/${urlType}/addMessage`, body, this.props.user)
    .then(result => {
      toast.success('Upload successfull');
      
      this.setState({
        expanded: false,
        loading: false,
      });
    })
    .catch(err => {
      toast.error('An error occurred while adding a GeoMessage.');
      this.setState({ loading: false });
    });
  }

  onShapeClaim = (type, add) => {
    this.setState({loading: true});
    let element = JSON.parse(JSON.stringify(this.props.element));
    let elementProperties = element.feature.properties;
    let urlType = null;
    let body = {
      'mapId': this.props.map.id,
    }

    if (element.type === ViewerUtility.polygonLayerType) {
      urlType = 'polygon';
    }
    else if (element.type === ViewerUtility.customPolygonTileLayerType) {
      body.customPolygonId = elementProperties.id;

      urlType = 'customPolygon';
    }

    if (type === 'claim')
    {
      if (add === true)
      {
        //add form reserved
        body.polygonId = elementProperties.id;
        body.timestamp = this.props.timestampRange.end;
        body.message = '';
        body.private = false;

        body.form = {
          formName: 'reserved',
          answers: {
            type: ViewerUtility.geomessageFormType.boolean,
            question: 'reserved',
            answer: true
          }
        }

        ApiManager.post(`/geomessage/${urlType}/addMessage`, body, this.props.user)
        .then(result => {
          this.setState({loading: false});

          element.feature.properties.messageID = result.id;
          element.feature.properties.status = 'reserved';
          element.feature.properties.statusOwner = this.props.user.username;

          this.props.element.feature.properties.messageID = result.id;
          this.props.element.feature.properties.status = 'reserved';
          this.props.element.feature.properties.statusOwner = this.props.user.username;

          this.props.onStatusChange(element);
        })
        .catch(err =>{
          toast.error('An error occurred while adding a reservation.');
          this.setState({ loading: false });
        })
      }
      else if (add === false)
      {
        //delete form reserved
        body.id = elementProperties.messageID;

        ApiManager.post(`/geomessage/${urlType}/deleteMessage`, body, this.props.user)
        .then(result => {
          this.setState({loading: false});

          delete element.feature.properties.messageID;
          delete element.feature.properties.status;
          delete element.feature.properties.statusOwner;

          delete this.props.element.feature.properties.messageID;
          delete this.props.element.feature.properties.status;
          delete this.props.element.feature.properties.statusOwner;

          this.props.onStatusChange(element);
        })
        .catch(err =>{
          toast.error('An error occurred while deleting a reservation.');
          this.setState({ loading: false });
        })
      }
    }
    else if (type === 'done')
    {
      if (add === true)
      {
        //delete form reserved

        if (elementProperties.messageID)
        {
          body.id = elementProperties.messageID;

          ApiManager.post(`/geomessage/${urlType}/deleteMessage`, body, this.props.user)
          .then(result => {

            //add form add
          })
          .catch(err =>{
            toast.error('An error occurred while deleting a reservation.');
            this.setState({ loading: false });
          })

          body = {
              'mapId': this.props.map.id,
              timestamp: this.props.timestampRange.end,
              polygonId: elementProperties.id,
              message: '',
              private: false,
              form : {
                formName: 'done',
                answers: {
                  type: ViewerUtility.geomessageFormType.boolean,
                  question: 'done',
                  answer: true
                }
              }
            }

            ApiManager.post(`/geomessage/${urlType}/addMessage`, body, this.props.user)
            .then(result => {
              this.setState({loading: false});

              element.feature.properties.messageID = result.id;
              element.feature.properties.status = 'done';
              element.feature.properties.statusOwner = this.props.user.username;

              this.props.element.feature.properties.messageID = result.id;
              this.props.element.feature.properties.status = 'done';
              this.props.element.feature.properties.statusOwner = this.props.user.username;

              this.props.onStatusChange(element);
            })
            .catch(err =>{
              toast.error('An error occurred while adding done.');
              this.setState({ loading: false });
            })
        }
        else
        {
          body = {
            'mapId': this.props.map.id,
            timestamp: this.props.timestampRange.end,
            polygonId: elementProperties.id,
            message: '',
            private: false,
            form : {
              formName: 'done',
              answers: {
                type: ViewerUtility.geomessageFormType.boolean,
                question: 'done',
                answer: true
              }
            }
          }

          ApiManager.post(`/geomessage/${urlType}/addMessage`, body, this.props.user)
          .then(result => {
            this.setState({loading: false});

            element.feature.properties.messageID = result.id;
            element.feature.properties.status = 'done';
            element.feature.properties.statusOwner = this.props.user.username;

            this.props.element.feature.properties.messageID = result.id;
            this.props.element.feature.properties.status = 'done';
            this.props.element.feature.properties.statusOwner = this.props.user.username;

            this.props.onStatusChange(element);
          })
          .catch(error =>{
            toast.error('An error occurred while adding done.');
            this.setState({ loading: false });
          })
        }

      }
      else if (add === false)
      {
        //delete form add
        body.id = elementProperties.messageID;

        ApiManager.post(`/geomessage/${urlType}/deleteMessage`, body, this.props.user)
        .then(result => {
          this.setState({loading: false});

          delete element.feature.properties.messageID;
          delete element.feature.properties.status;
          delete element.feature.properties.statusOwner;

          delete this.props.element.feature.properties.messageID;
          delete this.props.element.feature.properties.status;
          delete this.props.element.feature.properties.statusOwner;

          this.props.onStatusChange(element);
        })
        .catch(err =>{
          toast.error('An error occurred while deleting done.');
          this.setState({ loading: false });
        })
      }
    }
    else
    {
      console.log(type, add, this.props.element);
    }
  }

  render() {
    if (!this.state.isOpen) {
      return null;
    }

    let map = this.props.map;
    let element = this.props.element;

    if (!map || !element) {
      return null;
    }

    let title = null;

    let user = this.props.user;
    let mapAccessLevel = map.accessLevel;

    let firstRowButtons = [];
    let secondRowButtons = [];

    let buttons = [];

    /*firstRowButtons.push(
      <Button
        key='analyse'
        variant='outlined'
        size='small'
        className='selection-pane-button'
        onClick={() => this.onElementActionClick(ViewerUtility.dataPaneAction.analyse)}
        disabled={mapAccessLevel < ApiManager.accessLevels.aggregatedData}
      >
        {this.props.localization['ANALYSE']}
      </Button>
    );*/

/*    if (element.type !== ViewerUtility.drawnPolygonLayerType) {
      buttons.push((
        <Fab
          key='geoMessage'
          variant='extended'
          size='small'
          className='selection-pane-button'
          onClick={() => this.onElementActionClick(ViewerUtility.dataPaneAction.geoMessage)}
          disabled={mapAccessLevel < ApiManager.accessLevels.viewGeoMessages}
          color='primary'
        >
          {<AddAPhoto />}
        </Fab>
      ));
    }*/

    if (element.type === ViewerUtility.standardTileLayerType)
    {
      title = this.props.localization['Standard tile'];
    }
    else if (element.type === ViewerUtility.polygonLayerType)
    {
      title = element.feature.properties.layer;
      title = title.substring(0, title.length - 1);
      if (element.feature.properties.layer && element.feature.properties.layer === 'Sampled areas')
      {
        let claimDisabled = true;
        let doneDisabled = true;
        let claimAdd = true;
        let doneAdd = true;

        if(this.props.user)
        {
          if (!element.feature.properties.status && mapAccessLevel >= ApiManager.accessLevels.addGeoMessages)
          {
            claimDisabled = false;
            doneDisabled = false;
          }
          else if (element.feature.properties.status === 'reserved')
          {
            if (element.feature.properties.statusOwner === this.props.user.username || mapAccessLevel >= ApiManager.accessLevels.deleteGeomessages)
            {
              claimDisabled = false;
              doneDisabled = false;
              claimAdd = false;
            }
          }
          else if (element.feature.properties.status === 'done')
          {
            if (element.feature.properties.statusOwner === this.props.user.username || mapAccessLevel >= ApiManager.accessLevels.deleteGeomessages)
            {
              claimDisabled = true;
              doneDisabled = false;
              doneAdd = false;
            }
          }
        }

        buttons.push(
        [
          <Fab
            key='claim'
            variant='extended'
            size='small'
            className='selection-pane-button'
            onClick={() => this.onShapeClaim('claim', claimAdd)}
            disabled={claimDisabled}
            color={claimAdd ? 'primary' : 'secondary'}
          >
            <Flag />
          </Fab>,
          <Fab
            key='done'
            variant='extended'
            size='small'
            className='selection-pane-button'
            onClick={() => this.onShapeClaim('done', doneAdd)}
            disabled={doneDisabled}
            color={doneAdd ? 'primary' : 'secondary'}
          >
            <Done />
          </Fab>
        ]);
      }
      else if (element.feature.properties.layer && element.feature.properties.layer === 'Shea trees')
      {
        buttons.push([
          <input
            ref={this.fileUploadRef}
            type='file'
            accept='image/gif, image/jpeg, image/png, image/jpg, .gif, .png, .jpg, .jpeg'
            id="uploadButton"
            key='uploadInput'
            onChange={this.onImageChange}
            disabled={mapAccessLevel < ApiManager.accessLevels.addGeoMessageImage || !this.props.user}
          />,
          <label htmlFor="uploadButton" className="FeauxButton" key='uploadLabel'>
            <Fab
              key='geoMessage'
              variant='extended'
              size='small'
              className='selection-pane-button'
              //onClick={(e) => {this.onElementActionClick(ViewerUtility.dataPaneAction.geoMessage, e)}}
              disabled={mapAccessLevel < ApiManager.accessLevels.viewGeoMessages}
              color='primary'
              component="span"
              disabled={mapAccessLevel < ApiManager.accessLevels.hasAddImagePermission || !this.props.user}
            >
              {this.props.user ? <AddAPhoto /> : 'Please login'}
            </Fab>
          </label>,
          <Fab
            key='delete'
            variant='extended'
            color='primary'
            size='small'
            className='selection-pane-button'
            onClick={() => this.onElementActionClick(DELETE_CUSTOM_POLYGON_ACTION)}
            disabled={!user || mapAccessLevel < ApiManager.accessLevels.alterOrDeleteCustomPolygons}
          >
            <Delete />
          </Fab>
        ]);
      }
    }
    else if (element.type === ViewerUtility.drawnPolygonLayerType) {
      title = 'Draw Shea Tree';

      buttons.push(
        <Fab
          key='add'
          variant='extended'
          color='primary'
          size='small'
          className='selection-pane-button'
          onClick={() => this.onElementActionClick(ViewerUtility.dataPaneAction.createCustomPolygon)}
          disabled={
            !user ||
            mapAccessLevel < ApiManager.accessLevels.addCustomPolygons ||
            map.layers.polygon.filter(layer => layer.restricted === false).length === 0
          }
        >
          {this.props.localization['ADD']}
        </Fab>
      );
    }

    let elementProperties = element.feature.properties;
    let properties = [];

    let selectionPaneClass = 'selection-pane';

    for (let property in elementProperties) {

      let propertyValue = elementProperties[property];

      if (element.type === ViewerUtility.drawnPolygonLayerType && property === 'id') {
        continue;
      }
      if (element.type === ViewerUtility.customPolygonTileLayerType
        && property === ViewerUtility.isPrivateProperty) {
        if (propertyValue === true) {
          selectionPaneClass += ' selection-pane-private';
        }
        continue;
      }

      if (elementProperties.hasOwnProperty(property)) {
        properties.push((
          <div key={property}>
            {`${property}: ${propertyValue}`}
          </div>
        ))
      }
    }

    let content = null;

    if(!this.props.user)
    {
      content = 
      <Fab
        variant='extended'
        color='primary'
        size='small'
        className='selection-pane-button login'
        href="/login"
      >Please login</Fab>
      
    }
    else if (this.state.loading)
    {
      content = <CircularProgress className='loading-spinner'/>
    }
    else
    {
      content = buttons;
    }

    return (
      <div>
        <Card className={selectionPaneClass}>
          <CardHeader
            className='material-card-header'
            title={
              <Button
                onClick={() => this.props.onFlyTo({
                  type: ViewerUtility.flyToType.currentElement
                })}
              >
                <Typography variant="h6" component="h2" className='no-text-transform'>
                  {title}
                </Typography>
              </Button>
            }
            action={
              <div>
                {/*<IconButton
                  onClick={this.onDownload}
                  aria-label='Download'
                >
                  <SaveAlt />
                </IconButton>*/}
                <IconButton
                  onClick={this.onCloseClick}
                  aria-label='Close'
                >
                  <ClearIcon />
                </IconButton>
              </div>
            }
          />
          <CardContent className={'card-content'} key={element.feature.properties.status}>
            {element.feature.properties.layer === 'districts' ? properties : null}
          </CardContent>
          <CardActions className={'selection-pane-card-actions'}>
            {/*<div key='first_row_buttons'>
              {firstRowButtons}
            </div>
            <div key='secont_row_buttons' style={ {marginLeft: '0px' }}>
              {secondRowButtons}
            </div>*/}
              {content}
          </CardActions>
        </Card>
      </div>
    );
  }
}

export default SelectionPane;
