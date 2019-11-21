import React, { Component } from 'react';
import {
    Route
} from 'react-router-dom';
import Modal from 'react-modal';
import { withRouter } from 'react-router';

import { createMuiTheme } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/styles';

import ApiManager from './ApiManager';
import ErrorHandler from './ErrorHandler';

import MainMenu from './Components/MainMenu/MainMenu';
import Viewer from './Components/Viewer/Viewer';
/*import Home from './Components/Home/Home';
import About from './Components/About/About';
import Products from './Components/Products/Products';*/
import Login from './Components/Login/Login';
/*import Sector from './Components/Sectors/Sectors';
import Gallery from './Components/Gallery/Gallery';*/
import Account from './Components/Account/Account';

import './App.css';

const localStorageUserItem = 'user';

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#ee7b15',
      contrastText: "#fff"
    },
    secondary: {
      main: '#f5f5f5',
      contrastText: "#000"
    }
  },
});

class App extends Component {

  constructor(props, context) {
    super(props, context)
    document.title = 'Shea Tree Monitor';

    this.state = {
      init: false,
      hideMenu: false,
      accountOpen: false,
      user: null,
    };

    this.accountsUrl = 'https://account.ellipsis-earth.com/';
  }

  componentDidMount() {
    Modal.setAppElement('body');
    
    let hideMenu = new URLSearchParams(window.location.search).get('hideMenu') === '1';

    this.setState({ hideMenu: hideMenu });

    this.retrieveLanguage()
      .then(() => {
        return this.retrieveUser();
      });

    window.addEventListener("message", this.receiveMessage, false);
  }

  receiveMessage = (event) => {
  if (/*event.origin === 'http://localhost:3000' ||*/ 'https://account.ellipsis-earth.com') 
    {
      if (event.data.type && event.data.type === 'login')
      {
        this.onLogin(event.data.data);
      }
      if (event.data.type && event.data.type === 'logout')
      {
        this.onLogout();
      }
      if (event.data.type && event.data.type === 'overlayClose')
      {
        this.setState({accountOpen: false}, this.setHome())
      }
    }
  }

  setHome = () => {
    let iframe = document.getElementById("account");
    iframe.contentWindow.postMessage({type: 'home'}, this.accountsUrl);
  }

  openAccounts = (open = !this.state.accountOpen) => {
    this.setState({accountOpen: open})
  }

  closeMenu = () => {
    var x = document.getElementById('main-menu');
    x.className = '';
  }

  retrieveUser = async () => {
    let user = null;
    let userJson = localStorage.getItem(localStorageUserItem);

    if (!userJson) {
      this.setState({ init: true });
      return;
    }

    user = JSON.parse(userJson);

    ApiManager.get(`/account/validateLogin`, null, user)
      .then(() => {
        if (user.username) {
          user.username = user.username.toLowerCase();
        }
        
        this.setState({ user: user, init: true });
      })
      .catch(() => {
        this.setState({ init: true });
        localStorage.removeItem(localStorageUserItem);
      });    
  }

  retrieveLanguage = async () => {
    let language = localStorage.getItem('language');
    if (!language) {
      language = 'english';
    }

    await this.setLanguage(language);
  }

  setLanguage = async (language) => {
    await fetch('/localization/' + language + '.json')
      .then(response => {
        if (response.ok) {
          return response.json();
        }
      })
      .then(json => {
        localStorage.setItem('language', language);
        this.setState({
          language: language,
          localization: json
        });
      })
      .catch(err => {
        ErrorHandler.alert(err);
      });
  }

  onLogin = (user) => {
    localStorage.setItem(localStorageUserItem, JSON.stringify(user));
    this.setState({ user: user }, () => {
      this.props.history.push('/');
    });
  }

  onLogout = () => {
    localStorage.removeItem(localStorageUserItem);
    this.setState({ user: null });
  }

  onLanguageChange = (language) => {
    if (language !== this.state.language) {
      this.setLanguage(language);
    }
  }

  render() {
    if (!this.state.init) {
      return null;
    }

    if (this.state.accountOpen)
    {
      let initObject = {type: 'init'};
      if (this.state.user){initObject.data = this.state.user}
      let iframe = document.getElementById("account");
      iframe.contentWindow.postMessage(initObject, this.accountsUrl);
    }

    let contentClassName = 'content';
    if (this.state.hideMenu) {
      contentClassName += ' content-full';
    }

    return (
      <div className='App' onClick={this.closeMenu}>
        <ThemeProvider theme={theme}>
          {
            this.state.hideMenu ? 
              null :
              <MainMenu
                user={this.state.user}
                language={this.state.language}
                localization={this.state.localization}
                onLanguageChange={this.onLanguageChange}
                openAccounts={this.openAccounts}
              />
          }

          <div className={contentClassName + (window.location.hostname === 'localhost' ? ' dev' : '')}>
            {/*<Route exact path='/'
              render={() =>
                <Home
                  language={this.state.language}
                />
              }
            />*/}
            <Route exact
              path='/'
              render={() =>
                <Viewer 
                  user={this.state.user}
                  language={this.state.language}
                  localization={this.state.localization}
                  key={this.state.user ? this.state.user.name : 'default'}
                  openAccounts={this.openAccounts}
                />
              }
            />
            {/*<Route path='/products'
              render={() =>
                <Products
                  language={this.state.language}
                  localization={this.state.localization}
                />
              }
            />
            <Route
              path='/sectors'
              render={() =>
                <Sector
                  language={this.state.language}
                  localization={this.state.localization}
                />
              }
            />
            <Route
              path='/gallery'
              render={() =>
                <Gallery
                  language={this.state.language}
                  localization={this.state.localization}
                />
              }
            />
            <Route
              path='/about'
              render={() =>
                <About
                  language={this.state.language}
                  localization={this.state.localization}
                />
            }
            />*/}
            <Route
              path='/login'
              render={() =>
                <Login
                  onLogin={this.onLogin}
                  language={this.state.language}
                  localization={this.state.localization}
                />
              }
            />
            <Route
              path='/account'
              render={() =>
                <Account
                  user={this.state.user}
                  language={this.state.language}
                  localization={this.state.localization}
                  onLogout={this.onLogout}
                />
              }
            />
            <div className={this.state.accountOpen ? 'account' : 'hidden'}>
              <iframe src={this.accountsUrl} id='account'/>
            </div>
          </div>
        </ThemeProvider>          
      </div>
    );
    
  }

}

export default withRouter(App);
