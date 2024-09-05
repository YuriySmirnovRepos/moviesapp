import React from 'react';
import { Col, Row } from 'antd';
import Card from '../card/card';
import propTypes from 'prop-types';
import './card-list.css';

export default class CardList extends React.Component {
    render() {

        const { movies } = this.props;
        
        const cards = movies.map((movie) => {
            return (
                <Col key={movie.id} span={12}>
                    <Card name={movie.name} premier={movie.premier} genres={movie.genres} description={movie.description}/>
                </Col>
            )
        });
        
    return (
      <Row gutter={[36, 36]}>
        {cards}
      </Row>
    );
  }
}

CardList.propTypes = {
    movies: propTypes.array
}