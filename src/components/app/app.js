import React from 'react';
import CardList from '../card-list/card-list';

import './app.css';

export default class App extends React.Component {
  state = {
    movies: [
      {
        id: 1,
        name: 'Some film',
        premier: '2022',
        genres: ['Action', 'Comedy'],
        description: 'A former basketball all-star, who has lost his wife and family foundation in a struggle with addiction attempts to regain his soul  and salvation by becoming the coach of a disparate ethnically mixed high',
        rating: 5,
      },
      {
        id: 2,
        name: 'Some name',
        premier: '2021',
        genres: ['Some genre'],
        description:'Dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
        rating: 5,
      },
      {
        id: 3,
        name: 'Some name',
        premier: '2023',
        genres: ['Drama'],
        description:"Dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
        rating: 3,
      },
    ],
  }
  render() {
    return (
      <div className="container">
        <CardList movies={this.state.movies}/>
      </div>
    );
  }
}
