import React from 'react';
import { Col, Row } from 'antd';
import Card from '../card/card';
import propTypes from 'prop-types';
import './card-list.css';

export default class CardList extends React.Component {
  render() {
    const { movies, setRating } = this.props;
    
    const cards = movies.map((movie) => {
      return (
        <Col key={movie.id} span={12}>
          <Card
          id = {movie.id}
            name={movie.name}
            premier={movie.premier}
            genres={movie.genres ?? []}
            description={movie.description}
            poster={movie.poster}
            rating={movie.rating}
            myRating={movie.myRating}
            setRating={setRating}
          />
        </Col>
      );
    });

    return <Row gutter={[36, 36]}>{cards}</Row>;
  }
}

CardList.propTypes = {
  movies: propTypes.array,
};
