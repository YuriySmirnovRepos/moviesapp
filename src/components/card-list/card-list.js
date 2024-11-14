import React from 'react';
import { Col, Row } from 'antd';
import propTypes from 'prop-types';

import Card from '../card/card';
import './card-list.css';

export default function CardList({ movies, setRating }) {
  const style = movies.length === 0 ? { marginTop: 0 } : { marginTop: 34 };
  const cards = movies.map((movie) => {
    return (
      <Col
        xs={{ span: 24 }}
        md={{ span: 12 }}
        lg={{ span: 12 }}
        key={movie.id}
        span={12}
      >
        <Card
          id={movie.id}
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
  return (
    <Row
      gutter={[
        { xs: 20, sm: 25, md: 25, lg: 36 },
        { xs: 20, sm: 25, md: 25, lg: 36 },
      ]}
      style={style}
    >
      {cards}
    </Row>
  );
}

CardList.propTypes = {
  movies: propTypes.oneOfType([propTypes.array, propTypes.object]),
  setRating: propTypes.func,
};

CardList.defaultProps = {
  movies: [],
  setRating: () => {},
};
