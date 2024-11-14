import React from 'react';
import { Card as AntdCard, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import propTypes from 'prop-types';

import noPic from '../../assets/no-pic.jpg';
import CardContent from '../card-content/card-content';
import './card.css';

export default class Card extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isPosterLoaded: false,
    };
  }

  onPosterLoaded = () => {
    this.setState({ isPosterLoaded: true });
  };

  render() {
    const { poster } = this.props;
    const { isPosterLoaded } = this.state;

    const posterLoader = (
      <div style={{ gridArea: 'poster', height: '100%' }}>
        <Spin
          indicator={<LoadingOutlined spin />}
          style={{ top: '50%', left: '50%' }}
        />
      </div>
    );

    return (
      <AntdCard hoverable className="card">
        {isPosterLoaded ? null : posterLoader}
        <img
          alt="Film poster"
          onLoad={this.onPosterLoaded}
          src={poster ?? noPic}
          className="card__cover"
          style={{ display: isPosterLoaded ? 'block' : 'none' }}
        />
        <CardContent cardData={this.props} />
      </AntdCard>
    );
  }
}

Card.propTypes = {
  poster: propTypes.string,
};

Card.defaultProps = {
  poster: null,
};
