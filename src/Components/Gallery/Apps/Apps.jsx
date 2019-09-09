import React, { Component } from 'react';
import { 
  Button,
  IconButton,
  CircularProgress,
} from '@material-ui/core';
import AndroidIcon from '@material-ui/icons/Android';
import CodeIcon from '@material-ui/icons/Code';

import './Apps.css';

const apps = {
  0: { 
    name: 'Ellipsis app', 
    url: 'https://ellipsis-earth.com/viewer?map=Gran%20Chaco&hideMenu=1',
    descriptionKey: 'EllipsisViewerDescription',
    originalUrl: 'https://ellipsis-earth.com/viewer',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.ellipsisapp',
    appStoreUrl: null,
    sourceUrl: 'https://github.com/ellipsis-earth/ellipsis-web'
  },
  1: { 
    name: 'Biodiversity monitor', 
    url: 'https://biodiversiteit.ellipsis-earth.com',
    descriptionKey: 'BiodiversityAppDescription',
    originalUrl: 'https://biodiversiteit.ellipsis-earth.com',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=com.biodiversiteitsmonitor',
    appStoreUrl: null,
    sourceUrl: 'https://github.com/ellipsis-earth/biodiversity-web'
  }
}

export class GalleryApps extends Component {

  appContainer = null;

  constructor(props) {
    super(props);

    this.appContainer = React.createRef();

    this.state = {
      app: apps[0]
    };
  }

  setAppIndex = (appIndex) => {
    let app = apps[appIndex];
    
    let scroll = () => {
      this.appContainer.current.scrollIntoView({ behavior: 'smooth' })
    }

    if (app && app.name === this.state.app.name) {
      scroll();
      return;
    }
      
    this.setState({ app: app }, scroll);
  }

  render() {
    let appElement = null;
    let app = this.state.app;

    if (app) {
      appElement = (
        <div className='app-container-sub'>
          <table className='apps-table apps-table-full'>
            <tbody>
              <tr>
                <td className='app-text-block'>
                  <h2>{app.name}</h2>
                  { app.descriptionKey ? <p>{this.props.localization[app.descriptionKey]}</p> : null }
                  { 
                    app.originalUrl ?
                      <Button className='app-text-button' variant='contained' color='primary' href={app.originalUrl} target='_blank'>
                        Full version
                      </Button> : null 
                  }
                  { 
                    app.sourceUrl ?
                      <Button className='app-text-button' variant='outlined' color='primary' href={app.sourceUrl} target='_blank'>
                        Source
                        <CodeIcon className='app-text-button-icon'/>
                      </Button> : null 
                  } 
                  { 
                    app.playStoreUrl ?
                      <a className='app-text-button' href={app.playStoreUrl}>
                        <img src='/images/download-on-the-playstore.png'/>
                      </a> : null
                  }
                  { 
                    app.appStoreUrl ?
                      <a className='app-text-button' href={app.appStoreUrl}>
                        <img src='/images/download-on-the-appstore.svg'/>
                      </a> : null
                  } 
 
                </td>
                <td className='app-iframe-block'>
                  <iframe
                    className='app-iframe'
                    src={app.url} 
                    onLoad={this.onAppLoad} 
                    allow='geolocation'
                  />
                </td>
              </tr>
            </tbody>
          </table>        
          {
            this.state.loading ? <CircularProgress className='loading-spinner' size='80px'/> : null
          }
        </div>  
      );
    }

    return (
      <div>
        <table className='apps-table app-select-table'>
          <tbody>
            <tr>
              <td className='app-button'>
                <IconButton className='clickable' color='primary'>
                  <img className='noselect' onClick={() => this.setAppIndex(0)} src='/images/ellipsis-app-logo.svg'/>
                </IconButton>
                <span className='app-button-label'>
                  Ellipsis
                </span>
              </td>
              <td className='app-button'>
                <IconButton className='clickable' color='primary'>
                  <img className='noselect' onClick={() => this.setAppIndex(1)} src='/images/biodiversity-logo.svg'/>
                </IconButton>
                <span className='app-button-label'>
                  Biodiversity
                </span>
              </td> 
            </tr>
          </tbody>
        </table>

        <div ref={this.appContainer} className='app-container'>
          {appElement}
        </div>
      </div>
    )
  }
}

export default GalleryApps;
