import React from 'react';
import { format } from 'date-fns';
import propTypes from 'prop-types';

import Rate from '../rate/rated';
import './card-content.css';

export default class CardContent extends React.Component {
  constructor(props) {
    super(props);
    this.descriptionRef = React.createRef();
  }

  componentDidMount() {
    this.#checkDescription();
  }

  componentDidUpdate() {
    this.#checkDescription();
  }

  #checkDescription = () => {
    const { scrollHeight, clientHeight } = this.descriptionRef.current;
    if (scrollHeight !== clientHeight) {
      this.#truncateTxt();
    }
  };

  #truncateTxt = () => {
    const delete2words = (txt) => txt.split(' ').slice(0, -2).join(' ');

    const descRef = this.descriptionRef.current;
    if (descRef.textContent.trim() === '') {
      return;
    }

    while (descRef.scrollHeight > descRef.clientHeight) {
      descRef.textContent = delete2words(descRef.textContent);
    }
    descRef.textContent = `${delete2words(descRef.textContent)}...`;
  };

  static renderVoteAverage = (ratingVal) => {
    let ratingColor = null;
    switch (true) {
      case ratingVal >= 0 && ratingVal <= 3:
        ratingColor = '#E90000';
        break;
      case ratingVal > 3 && ratingVal <= 5:
        ratingColor = '#E97E00';
        break;
      case ratingVal > 5 && ratingVal <= 7:
        ratingColor = '#E9D100';
        break;
      case ratingVal > 7:
        ratingColor = '#66E900';
        break;
      default:
        ratingColor = 'black';
        break;
    }

    return (
      <svg
        width="32"
        height="32"
        style={{ position: 'absolute', top: '10px', right: '9px' }}
      >
        <circle
          cx="16"
          cy="16"
          r="15"
          stroke={ratingColor}
          strokeWidth="2"
          fill="none"
        />
        <text x="16" y="20" textAnchor="middle" fontSize="12" fill="black">
          {parseFloat(ratingVal).toFixed(1)}
        </text>
      </svg>
    );
  };

  render() {
    const {
      cardData: { id, name, premier, genres, rating, myRating, setRating },
    } = this.props;

    let {
      cardData: { description },
    } = this.props;

    if (!description) {
      description = 'No description';
    }

    return (
      <>
        <div className="card__info-container">
          <h1 className="card__title">{name}</h1>

          {CardContent.renderVoteAverage(rating)}

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
        </div>
        <p ref={this.descriptionRef} className="card__description">
          {description}
        </p>

        <Rate value={myRating} setRating={setRating(id)} />
      </>
    );
  }
}

CardContent.propTypes = {
  cardData: propTypes.shape({
    id: propTypes.number.isRequired,
    name: propTypes.string.isRequired,
    premier: propTypes.string,
    genres: propTypes.arrayOf(propTypes.string),
    description: propTypes.string,
    rating: propTypes.number,
    myRating: propTypes.number,
    setRating: propTypes.func,
  }).isRequired,
};
