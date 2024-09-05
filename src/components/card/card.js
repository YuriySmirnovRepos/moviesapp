import { Card as AntdCard } from 'antd';
import React from 'react';
import coverImg from '../../assets/filmPic.png';
import './card.css';

export default class Card extends React.Component {
  #cutText(text, size) {
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
  }

  render() {
    const { name, premier, genres, description } = this.props;
    return (
      <AntdCard hoverable={true} className="card">
        <AntdCard.Grid hoverable={false} className='card__cover-container'>
          {
            <img
              alt="example"
              src={coverImg}
              className="card__cover"
            />
          }
        </AntdCard.Grid>
        <AntdCard.Grid hoverable={false} className="card__info-container">
          <h1 className="card__title">{name}</h1>
          <time className="card__date" dateTime={premier}>
            {premier}
          </time>
          <span className="card__genres">
            {genres.map((genre) => (
              <span key={genre} className="card__genre">
                {genre}
              </span>
            ))}
          </span>
          <p className="card__description">{this.#cutText(description, 200)}</p>
        </AntdCard.Grid>
      </AntdCard>
    );
  }
}
