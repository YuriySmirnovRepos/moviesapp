import React from 'react';
import CardList from '../card-list/card-list';
import MoviesApiService from '../../services/movies-api-service';
import { Pagination, Input } from 'antd';
import './app.css';

export default class App extends React.Component {
  state = {
    totalPages: 0,
    movies: [],
  };

  loadData = (page = 1, title = 'return') => {
    const moviesApiService = new MoviesApiService();
    moviesApiService.getMoviesData(page).then(
      (data) => {
        console.log(data);
        this.setState({
          totalPages: moviesApiService.totalDataPages * 6,
          movies: data,
        });
      },
      (error) => {
        console.log(error);
      }
    );
  }

  componentDidMount() {
    this.loadData();
  }

  render() {
    return (
      <div className="container">
        <Input placeholder="Type to search" onChange={() => { }} />
        <CardList movies={this.state.movies} />
        <Pagination
          showSizeChanger = {false}
          defaultCurrent={1}
          total={this.state.totalPages}
          style={{ alignSelf: 'center' }}
          onChange={this.loadData}
        />
      </div>
    );
  }
}
