import React, { Component } from "react";
import { 
  Button,
  Tabs,
  Tab,
  TabPanel,
  CircularProgress,
} from '@material-ui/core';

import LoadUpdateUtil from '../../Utilities/LoadUpdateUtil';

import './Analysis.css';

export class GalleryAnalysis extends Component {

  constructor(props) {
    super(props);

    this.state = {
      tabIndex: 0
    };
  }

  onTabChange = (e, value) => {
    this.setState({ tabIndex: value });
  }

  render() {
    let tabIndex = this.state.tabIndex;

    return (
      <div>
        <Tabs
          className='analysis-tabs'
          value={tabIndex}
          variant='fullWidth'
          onChange={this.onTabChange} 
          textColor='primary'
          indicatorColor='primary'
        >
          <Tab className='analysis-tab' label={this.props.localization['Northern Paraguay deforestation']}/>
          <Tab className='analysis-tab' label={this.props.localization['Flora management in the Netherlands']}/>
          <Tab className='analysis-tab' label={this.props.localization['Appendix']}/>
        </Tabs>

        <div>
          <div style={{ display: tabIndex === 0 ? 'block' : 'none' }}>
            <LoadUpdateUtil
              contentUrl='/markdown/Northern Paraguay deforestation.md'
              isMarkdown={true}
            />
          </div>
          <div style={{ display: tabIndex === 1 ? 'block' : 'none' }}>
            <LoadUpdateUtil
              contentUrl='/markdown/Flora management in the Netherlands.md'
              isMarkdown={true}
            />
          </div>
          <div style={{ display: tabIndex === 2 ? 'block' : 'none' }}>
            <LoadUpdateUtil
              contentUrl='/markdown/Appendix.md'
              isMarkdown={true}
            />
          </div>
        </div>       
      </div>
    )
  }
}

export default GalleryAnalysis;
