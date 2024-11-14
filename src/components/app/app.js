import React from 'react';

import DataManager from '../../services/data-manager'; // Менеджер работы с данными
import CardList from '../card-list/card-list'; // Список карточек
import Tabs from '../tabs/tabs';
import Loader from '../loader/loader';
import Message from '../message/message';
import Pagination from '../pagination/pagination';
import SearchInput from '../search-input/search-input';
import './app.css';
import Utils from '../../utils/utils';

export default class App extends React.Component {
  dataManager = new DataManager();

  constructor() {
    super();
    this.state = {
      error: null,
      searchData: {
        query: 'return',
        totalElements: {
          Search: 0,
          Rated: 0,
        },
        movies: [],
        ratedMovies: [],
      },
      ui: {
        isLoading: true,
        currentPagination: {
          Search: 1,
          Rated: 1,
        },
        currentTab: 'Search',
      },
    };
  }

  // #region lifecycle

  componentDidMount() {
    this.dataManager
      .init()
      .then(() => this.renderSearchResults(1, 'return'))
      .catch(this.errorHandler);
    window.addEventListener('offline', this.handleOffline);
    window.addEventListener('online', this.handleOnline);
  }

  shouldComponentUpdate(nextProps, nextState) {
    const isChanged = JSON.stringify(this.state) !== JSON.stringify(nextState);
    return isChanged;
  }

  componentWillUnmount() {
    window.removeEventListener('offline', this.handleOffline);
    window.removeEventListener('online', this.handleOnline);
  }
  // #endregion

  static getCleanState(isWithClearRated = false) {
    const clearStateParams = {
      error: null,
      searchData: {
        query: '',
        totalElements: {
          Search: 0,
        },
        movies: [],
      },
      ui: {
        isLoading: false,
        currentPagination: {
          Search: 1,
        },
        currentTab: 'Search',
      },
    };
    if (isWithClearRated) {
      clearStateParams.searchData.ratedMovies = [];
      clearStateParams.searchData.totalElements.Rated = 0;
      clearStateParams.ui.currentPagination.Rated = 1;
    }
    return clearStateParams;
  }

  setRating = (movieId) => (rating) => {
    const stateChanges = {
      ui: {
        isLoading: true,
      },
    };
    this.setState((state) => {
      const nwState = Utils.mergeDeep(state, stateChanges);
      return nwState;
    });

    this.dataManager
      .setRating(movieId, rating)
      .then(() => {
        this.setState((state) => {
          if (state.ui.currentTab === 'Rated') {
            this.renderRatedMovies(state.ui.currentPagination.Rated);
          } else {
            this.renderSearchResults(
              state.ui.currentPagination.Search,
              state.searchData.query,
            );
          }
        });
      })
      .catch(this.errorHandler);
  };

  renderMessage = () => {
    const {
      error,
      searchData: { movies, ratedMovies },
      ui: { isLoading, currentTab },
    } = this.state;

    const isCurrentTabIsSearch = currentTab === 'Search';
    const isMaybeAnInfoMessage = !isLoading && !error;
    const isNoSearchResults = movies.length === 0;
    const isNoRatedMovies = ratedMovies.length === 0;
    const isShowNoResults =
      isMaybeAnInfoMessage && isCurrentTabIsSearch && isNoSearchResults;
    const isShowNoRated =
      isMaybeAnInfoMessage && !isCurrentTabIsSearch && isNoRatedMovies;
    const isShowError = !isLoading && error !== null;

    switch (true) {
      case isShowNoResults:
        return <Message isNoSearchResults />;
      case isShowNoRated:
        return <Message isNoRatedMovies />;
      case isShowError:
        return <Message error={error} />;
      default:
        return null;
    }
  };

  renderRatedMovies = (page) => {
    this.dataManager
      .getRated(page)
      .then((data) => {
        const changes = {
          searchData: {
            totalElements: {
              Rated: this.dataManager.totalRatedCount,
            },
            ratedMovies: data,
          },
          ui: {
            isLoading: false,
          },
        };

        this.setState((state) => {
          const nwState = Utils.mergeDeep(state, changes);
          return nwState;
        });
      })
      .catch(this.errorHandler);
  };

  renderSearchResults = (page, query) => {
    this.dataManager
      .search(query, page)
      .then((data) => {
        const changes = {
          searchData: {
            totalElements: {
              Search: data.length && this.dataManager.totalSearchCount,
            },
            movies: data,
          },
          ui: {
            currentPagination: {
              Search: page,
            },
            isLoading: false,
          },
        };

        this.setState((state) => {
          const nwState = Utils.mergeDeep(state, changes);
          return nwState;
        });
      })
      .catch(this.errorHandler);
  };

  // #region handlers
  errorHandler = (error) => {
    this.setState((state) => {
      const changes = App.getCleanState(true);
      changes.error = error;
      changes.ui.currentTab = state.ui.currentTab;
      changes.query = state.searchData.query;
      const nwState = Utils.mergeDeep(state, changes);
      return nwState;
    });
  };

  onInputChange = ({ target: { value } }) => {
    if (value.trim() === '') {
      const cleanState = App.getCleanState();
      this.setState((state) => {
        const nwState = Utils.mergeDeep(state, cleanState);
        return nwState;
      });
      return;
    }

    this.setState(
      (state) => {
        const changes = {
          searchData: {
            query: value,
          },
          ui: {
            isLoading: true,
          },
        };
        const nwState = Utils.mergeDeep(state, changes);
        return nwState;
      },
      this.renderSearchResults(1, value),
    );
  };

  onPaginationPageChanged = (page) => {
    this.setState((state) => {
      return {
        ui: {
          ...state.ui,
          isLoading: true,
          currentPagination: {
            ...state.ui.currentPagination,
            [state.ui.currentTab]: page,
          },
        },
      };
    });
    const { ui, searchData } = this.state;
    if (ui.currentTab === 'Search') {
      this.renderSearchResults(page, searchData.query);
    } else {
      this.renderRatedMovies(page);
    }
  };

  handleOffline = () => {
    this.setState({ error: new Error('No internet connection') });
  };

  handleOnline = () => {
    const nwState = { error: null, ui: { isLoading: true } };
    this.setState((state) => {
      return Utils.mergeDeep(state, nwState);
    });
    // eslint-disable-next-line react/destructuring-assignment
    this.renderSearchResults(1, this.state.searchData.query);
  };

  handleTabClick = (key) => {
    const tabLabel = key === '1' ? 'Search' : 'Rated';
    // eslint-disable-next-line react/destructuring-assignment
    if (tabLabel === this.state.ui.currentTab) {
      return;
    }
    const changes = {
      ui: {
        isLoading: true,
        currentTab: tabLabel,
      },
    };

    this.setState(
      (state) => {
        const nwState = Utils.mergeDeep(state, changes);
        return nwState;
      },
      () => {
        const { ui, searchData } = this.state;

        if (tabLabel === 'Rated') {
          this.renderRatedMovies(ui.currentPagination.Rated);
        } else {
          this.renderSearchResults(
            ui.currentPagination.Search,
            searchData.query,
          );
        }
      },
    );
  };

  // #endregion

  render() {
    const {
      searchData: { query, movies, ratedMovies, totalElements },
      ui: { isLoading, currentPagination, currentTab },
    } = this.state;

    const isCurrentTabIsSearch = currentTab === 'Search';

    const renderTabContent = (
      <>
        {isCurrentTabIsSearch ? (
          <SearchInput
            query={query}
            disabled={isLoading}
            onInputChange={this.onInputChange}
          />
        ) : null}

        {this.renderMessage()}

        <Loader isLoading={isLoading}>
          <CardList
            movies={isCurrentTabIsSearch ? movies : ratedMovies}
            setRating={this.setRating}
          />
        </Loader>

        <Pagination
          currentPaginationPage={currentPagination[currentTab]}
          totalElementsCount={totalElements[currentTab]}
          onPaginationPageChanged={this.onPaginationPageChanged}
        />
      </>
    );

    return (
      <div className="container">
        <Tabs
          currentTabKey={currentTab === 'Search' ? '1' : '2'}
          onTabClick={this.handleTabClick}
          renderTabContent={renderTabContent}
          isLoading={isLoading}
        />
      </div>
    );
  }
}
