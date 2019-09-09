import React, { Component } from 'react';
import { NavLink, Route } from 'react-router-dom';
import { 
  Button,
  IconButton,
  CircularProgress,
} from '@material-ui/core';
import NavigateNextIcon from '@material-ui/icons/NavigateNext';
import NavigateBeforeIcon from '@material-ui/icons/NavigateBefore';

import Carousel from 'react-bootstrap/Carousel';

import GalleryApps from './Apps/Apps';
import GalleryAnalysis from './Analysis/Analysis';
import { Footer } from '../Footer/Footer';

import './Gallery.css';

export class Gallery extends Component {

  appsComponent = null;

  constructor(props) {
    super(props);

    this.appsComponent = React.createRef();

    this.state = {
      mode: 0
    };
  }

  onAppChange = e => {
    window.open(e.target.value, '_blank');
  }

  onMonitoringServiceChange = e => {
    let itemValue = e.target.value;
    let contentUrl = '/markdown/' + itemValue + '.md';
    this.setState({ galleryItemUrl : contentUrl });
  }

  onAppClick = (appIndex) => {
    if (this.state.appIndex === appIndex) {
      return;
    }

    this.appsComponent.current.setAppIndex(appIndex);

    this.setState({ mode: 0 });
  }

  onModeClick = (mode) => {
    if (this.state.mode !== mode) {
      this.setState({ mode: mode });
    }
  }

  onAppLoad = () => {
    this.setState({ loading: false });
  }

  render() {
    return (
      <div>
        <div className='main-content'>
          <div className='gallery-carousel-container noselect'>        
            <Carousel
              interval={10000}
              pauseOnHover={false}
              nextIcon={
                <IconButton disableRipple={true}>
                  <NavigateNextIcon style={{ fontSize: '64px' }}/>
                </IconButton>
              }
              prevIcon={
                <IconButton disableRipple={true}>
                  <NavigateBeforeIcon style={{ fontSize: '64px' }}/>
                </IconButton>
              }
            >
              <Carousel.Item>
                <img
                  className='clickable'
                  src='/images/wwf-gallery.jpg'
                  onClick={() => this.onAppClick(1)}
                />
              </Carousel.Item>
              <Carousel.Item>
                <img
                  className='clickable'
                  src='/images/guyra-gallery.jpg'
                />
              </Carousel.Item>
              <Carousel.Item>
                <img
                  className='clickable'
                  src='/images/icco-gallery.jpg'
                />
              </Carousel.Item>
            </Carousel>
          </div>

          <div className='main-block main-block-content main-block-content-left'>
            <p className='main-center-paragraph main-center-paragraph-first'>
              Explore apps and analysis scripts demonstrating powerful use cases based only on the Ellipsis API
            </p>

            <div className='button-double-container'>
              <Button
                className='gallery-mode-button button-double noselect'
                variant={ this.state.mode === 0 ? 'contained' : 'outlined' }
                color='primary'
                onClick={() => this.onModeClick(0)}
              >
                Apps
              </Button>
              <Button
                className='gallery-mode-button button-double'
                variant={ this.state.mode === 1 ? 'contained' : 'outlined' }                
                color='primary'
                onClick={() => this.onModeClick(1)}
              >
                Analysis
              </Button>
            </div>

            <div className='gallery-mode-container'>
              {
                this.state.mode === 0 ? 
                  <GalleryApps 
                    ref={this.appsComponent} 
                    localization={this.props.localization}
                  /> : null
              }
              {
                this.state.mode === 1 ? 
                  <GalleryAnalysis
                    localization={this.props.localization}
                  /> : null
              }     
            </div>
            
          </div>
        </div>
        <Footer></Footer>
      </div>
    )
  }
}

export default Gallery;
