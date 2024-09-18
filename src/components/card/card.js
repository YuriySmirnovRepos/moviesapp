import { Card as AntdCard, Flex } from 'antd';
import React from 'react';
import { format } from 'date-fns';
import noPic from '../../assets/no-pic.jpg';
import './card.css';
const MAX_TEXT_LENGTH = 113;

export default class Card extends React.Component {
  state = {
    isLoading: true,
  };

  render() {
    const { poster } = this.props;
    return (
      <AntdCard hoverable={true} className="card">
        <Flex style={{ height: '100%' }}>
          {
            <img
              alt="Film poster"
              src={poster ?? noPic}
              className="card__cover"
            />
          }
          <CardContent cardData={this.props} />
        </Flex>
      </AntdCard>
    );
  }
}

const CardContent = ({ cardData }) => {
  const cutText = (text, size) => {
    const words = text.split(' ');
    const newText = [];
    let currSize = 0;

    for (let i = 0; i < words.length; i++) {
      if (currSize + words[i].length >= size) {
        break;
      }
      currSize += words[i].length + 1;
      newText.push(words[i]);
    }

    return newText.join(' ');
  };
  const { name, premier, genres, description } = cardData;
  return (
    <div className="card__info-container">
      <h1 className="card__title">{name}</h1>

      <p className="card__date">
        {(premier && format(new Date(premier), 'LLLL dd, yyyy')) ||
          'No premier date'}
      </p>

      <span className="card__genres">
        {genres.map((genre) => (
          <span key={genre} className="card__genre">
            {genre}
          </span>
        ))}
      </span>
      <p className="card__description">
        {description.length <= MAX_TEXT_LENGTH
          ? description
          : cutText(description, MAX_TEXT_LENGTH) + ' ...'}
      </p>
    </div>
  );
};
