import React from "react";
import DataManager from "../../services/data-manager"; //Менеджер работы с данными
import CardList from "../card-list/card-list"; //Список карточек
import Tabs from "../tabs/tabs";
import Loader from "../loader/loader";
import Message from "../message/message";
import Pagination from "../pagination/pagination";
import SearchInput from "../search-input/search-input";
import "./app.css";
import Utils from "../../utils/utils";

export default class App extends React.Component {
  dataManager = new DataManager();

  //#region lifecycle

  componentDidMount() {
    this.dataManager
      .init()
      .then(() => this.showSearchResults(1, "return"))
      .catch(this.errorHandler);
    window.addEventListener("offline", this.handleOffline);
    window.addEventListener("online", this.handleOnline);
  }

  componentWillUnmount() {
    window.removeEventListener("offline", this.handleOffline);
    window.removeEventListener("online", this.handleOnline);
  }

  shouldComponentUpdate(nextProps, nextState) {
    let isChanged = JSON.stringify(this.state) !== JSON.stringify(nextState);
    return isChanged;
  }
  //#endregion

  state = {
    error: null,
    searchData: {
      query: "return",
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
      currentTab: "Search",
    },
  };

  #getCleanState = (isNeeds2ClearRated = false) => {
    let clearStateParams = {
      error: null,
      searchData: {
        query: "",
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
        currentTab: "Search",
      },
    };
    if (isNeeds2ClearRated) {
      clearStateParams.searchData.ratedMovies = [];
      clearStateParams.searchData.totalElements.Rated = 0;
      clearStateParams.ui.currentPagination.Rated = 1;
    }
    return clearStateParams;
  };

  showRated = (page) => {
    this.dataManager
      .getRated(page)
      .then((data) => {
        const changes = {
          searchData: {
            totalElements: {
              Rated: this.dataManager.totalRatedCount,
            },
            ratedMovies: data ?? [],
          },
          ui: {
            isLoading: false,
          },
        };

        this.setState((state) => {
          let nwState = Utils.mergeDeep(state, changes);
          return nwState;
        });
      })
      .catch(this.errorHandler);
  };

  showSearchResults = (page, title) => {
    this.dataManager
      .search(title, page)
      .then((data) => {
        const changes = {
          searchData: {
            totalElements: {
              Search: this.dataManager.totalSearchCount,
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
          let nwState = Utils.mergeDeep(state, changes);
          return nwState;
        });
      })
      .catch(this.errorHandler);
  };

  //#region handlers
  errorHandler = (error) => {
    this.setState((state) => {
      let changes = this.#getCleanState();
      changes.error = error;
      let nwState = Utils.mergeDeep(state, changes);
      return nwState;
    });
  };

  onInputChange = ({ target: { value } }) => {
    if (value.trim() === "") {
      const cleanState = this.#getCleanState();
      this.setState((state) => {
        const nwState = Utils.mergeDeep(state, cleanState);
        return nwState;
      });
      return;
    }

    this.setState((state) => {
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
    }, this.showSearchResults(1, value));
  };

  onPaginationPageChanged = (page) => {
    this.setState({
      ui: {
        ...this.state.ui,
        isLoading: true,
        currentPagination: {
          ...this.state.ui.currentPagination,
          [this.state.ui.currentTab]: page,
        },
      },
    });
    this.showSearchResults(page, this.state.searchData.query);
  };

  handleOffline = () => {
    this.setState({ error: new Error("No internet connection") });
  };

  handleOnline = () => {
    const nwState = { error: null, ui: { isLoading: true } };
    this.setState((state) => {
      return Utils.mergeDeep(state, nwState);
    });
    this.showSearchResults(1, this.state.searchData.query);
  };

  handleTabClick = (key) => {
    const tabLabel = key === "1" ? "Search" : "Rated";
    const changes = {
      ui: {
        currentTab: tabLabel,
      },
    };
    const nwState = Utils.mergeDeep(this.state, changes);
    this.setState(nwState);
  };

  //#endregion

  setRating = (movieId) => (rating) => {
    this.dataManager.setRating(movieId, rating).catch(this.errorHandler);
  };

  render() {
    const {
      error,
      searchData: { query, movies, ratedMovies, totalElements },
      ui: { isLoading, currentPagination, currentTab },
    } = this.state;

    const isCurrentTabIsSearch = currentTab === "Search";
    const isMaybeAnInfoMessage = !isLoading && !error;
    const isNoSearchResults = movies.length === 0;
    const isNoRatedMovies = ratedMovies.length === 0;
    const isShowNoResults =
      isMaybeAnInfoMessage && isCurrentTabIsSearch && isNoSearchResults;
    const isShowNoRated =
      isMaybeAnInfoMessage && !isCurrentTabIsSearch && isNoRatedMovies;
    const isShowError = !isLoading && error !== null;

    const renderTabContent = (
      <React.Fragment>
        {isCurrentTabIsSearch ? (
          <SearchInput
            query={query}
            disabled={isLoading}
            onInputChange={this.onInputChange}
          />
        ) : null}

        {isShowError ? <Message error={error} /> : null}
        {isShowNoResults ? <Message isNoSearchResults /> : null}
        {isShowNoRated ? <Message isNoRatedMovies /> : null}

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
      </React.Fragment>
    );

    return (
      <div className="container">
        <Tabs
          currentTabKey={currentTab === "Search" ? "1" : "2"}
          onTabClick={this.handleTabClick}
          renderTabContent={renderTabContent}
          isLoading={isLoading}
        />
      </div>
    );
  }
}
