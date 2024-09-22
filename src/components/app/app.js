import React from "react";
import CardList from "../card-list/card-list"; //Список карточек
import DataManager from "../../services/data-manager"; //Менеджер работы с данными
import Utils from "../../utils/utils"; //Тут debounce
import { Spin, Alert, Pagination, Input } from "antd";
import "./app.css";

const INPUT_DELAY_BEFORE_SEARCH = 800;

export default class App extends React.Component {
  state = {
    query: "return",
    totalElements: 0,
    movies: [],
    loading: true,
    error: null,
  };

  loadData = (page = 1, title = "return") => {
    const dataManager = new DataManager();
    dataManager.getMovies(title, page).then(
      (data) => {
        this.setState({
          totalElements: DataManager.totalElementsCount,
          movies: data,
          loading: false,
        });
      },
      (e) => {
        this.setState({
          loading: false,
          error: e,
        });
      }
    );
  };

  onInputChange = ({ target: { value } }) => {
    if (value.trim() === "") {
      this.setState({ query: "", movies: [], error: null, totalElements: 0 });
      return;
    }

    this.setState({
      query: value,
      error: null,
      loading: true,
      totalElements: 0,
    });
    this.loadData(1, value);
  };

  onPaginationPageChange = (page) => {
    this.setState({ loading: true });
    this.loadData(page, this.state.query);
  };

  componentDidMount() {
    this.loadData();
    window.addEventListener("offline", this.handleOffline);
    window.addEventListener("online", this.handleOnline);
  }

  componentWillUnmount() {
    window.removeEventListener("offline", this.handleOffline);
    window.removeEventListener("online", this.handleOnline);
  }

  handleOffline = () => {
    this.setState({ error: new Error("No internet connection") });
  };

  handleOnline = () => {
    this.setState({ loading: true, error: null });
    this.loadData(1, this.state.query);
  };

  render() {
    const errorMessage = (
      <React.Fragment>
        <Alert
          type="error"
          banner
          message={"Loading error"}
          description={this.state.error?.message}
          showIcon
          style={{ width: "100%", textAlign: "center" }}
        ></Alert>
      </React.Fragment>
    );
    const noResultsMessage = (
      <React.Fragment>
        <Alert
          type="info"
          banner
          message={"No results"}
          description={"Try another search"}
          showIcon
          style={{ width: "100%", textAlign: "center" }}
        ></Alert>
      </React.Fragment>
    );
    return (
      <div className="container">
        <Input
          disabled={this.state.loading}
          placeholder="Type to search"
          onChange={Utils.debounce(
            this.onInputChange,
            INPUT_DELAY_BEFORE_SEARCH
          )}
          defaultValue={this.state.query}
          style={{ height: "40px", fontSize: "16px" }}
        />
        {this.state.error ? errorMessage : null}
        {this.state.loading ? (
          <Spin
            spinning={this.state.loading}
            size="large"
            style={{ width: "100%", marginTop: "20px", marginBottom: "20px" }}
          />
        ) : this.state.totalElements === 0 && !this.state.error ? (
          noResultsMessage
        ) : (
          <CardList movies={this.state.movies} />
        )}
        <Pagination
          showSizeChanger={false}
          defaultCurrent={1}
          defaultPageSize={6}
          total={this.state.totalElements}
          style={{ alignSelf: "center" }}
          onChange={this.onPaginationPageChange}
        />
      </div>
    );
  }
}
