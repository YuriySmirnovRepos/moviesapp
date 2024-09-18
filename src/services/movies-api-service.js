const REACT_APP_ACCESS_TOKEN_AUTH = process.env.REACT_APP_ACCESS_TOKEN_AUTH;
const BASE_URL = 'http://api.themoviedb.org/3';
const IMAGES_BASE_URL = 'https://image.tmdb.org/t/p/w185'; //w185 - размер получаемой картинки к фильму

export default class MoviesApiService {
  static genres = null;
  totalDataPages = 0;
  #currentQuery = 'return';
  #cachedPages = new Map();

  async #getResource(url) {
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${REACT_APP_ACCESS_TOKEN_AUTH}`,
      },
    };

    let rslt = null;

    rslt = await fetch(url, options);

    if (!rslt.ok) {
      throw new Error(`Сервер сообщил об ошибке. ${rslt.statusText}`);
    }

    rslt = await rslt.json();

    return rslt;
  }

  #getGenres = async () => {
    //получаем данные о жанрах
    const genres = await this.#getResource(
      `${BASE_URL}/genre/movie/list?language=en-US`
    );
    return genres.genres;
  };

  //Получает данные с сервера
  async fetchMoviesByTitle(pageOfData = 1) {
    if (!this.#currentQuery) {
      throw new Error(`Запрос не может быть пустым`);
    }

    if (!MoviesApiService.genres) {
      try {
        MoviesApiService.genres = await this.#getGenres();
      } catch (error) {
        console.error(error);
        return [];

      }
    }

    //преобразование данных
    const mapData = (data) => {
      const getGenreName = (genreId) => {
        const findedGenre = MoviesApiService.genres.find(
          (genre) => genre.id === genreId
        );
        if (!findedGenre) {
          return 'unknown';
        }
        return findedGenre.name;
      };

      const formatPosterPath = (posterPath) => {
        if (!posterPath) return null;
        return IMAGES_BASE_URL + posterPath;
      };

      const formattedMoviesData = {
        id: data.id,
        name: data.title,
        description: data.overview,
        genres: data.genre_ids.map((genreId) => getGenreName(genreId)),
        rating: data.vote_average,
        premier: data.release_date,
        poster: formatPosterPath(data.poster_path),
      };

      return formattedMoviesData;
    };

    const searchParams = new URLSearchParams({
      include_adult: false,
      query: this.#currentQuery,
      page: pageOfData,
    });

    const url = `${BASE_URL}/search/movie?${searchParams}`;

    const { results, total_pages } = await this.#getResource(url);

    this.totalDataPages = total_pages;

    return results.map(mapData);
  }

  // Отдает данные для отображения 6 результатов на странице
  // при получаемых 20 элементах от сервера. 
  // Финт ушами для преобразования
  getMoviesData = async (pageNumOfView = 1) => {
    let rslt = [];
    const serverItemsPerPage = 20; // количество фильмов в выдаче от сервера
    const viewItemsPerPage = 6; // количество фильмов на странице
    const itemsRangesOnPage = {
      1: [0, 6],
      2: [6, 12],
      3: [12, 18],
      4: [18, 4], //Часть данных - на следующей странице данных от сервера
      5: [4, 10],
      6: [10, 16],
      7: [16, 2], //Часть данных - на следующей странице данных от сервера
      8: [2, 8],
      9: [8, 14],
      10: [14, 20],
    };

    let pageNumOfData = Math.ceil(
      (pageNumOfView * viewItemsPerPage) / serverItemsPerPage
    ); //страница данных
    let start,
      end = 0; // диапазон на странице данных
    let reducedPageNumOfView = pageNumOfView % 10;
    if (reducedPageNumOfView === 0) {
      reducedPageNumOfView = 10;
    }

    [start, end] = itemsRangesOnPage[reducedPageNumOfView];

    let data = null;

    if (reducedPageNumOfView !== 4 && reducedPageNumOfView !== 7) {
      data = await this.getData(pageNumOfData);
      rslt.push(...data.slice(start, end));
    } else {
      if (reducedPageNumOfView === 4) {
        if (pageNumOfData % 3 === 2) {
          data = await this.getData(pageNumOfData - 1);
          rslt.push(...data.slice(start, 20));
          data = await this.getData(pageNumOfData);
          rslt.push(...data.slice(0, end));
        }
      }

      if (reducedPageNumOfView === 7) {
        data = await this.getData(pageNumOfData - 1);
        rslt.push(...data.slice(start, 20));

        data = await this.getData(pageNumOfData);
        rslt.push(...data.slice(0, end));
      }
    }

    return rslt;
  };

  // Решает отдавать из кэша данные или запросить их с сервера
  // по переданному номеру страницы данных
  async getData(dataPageNum) {
    if (this.#cachedPages.has(dataPageNum)) {
      return Promise.resolve(this.#cachedPages.get(dataPageNum));
    }
    let data = null;
    try {
      data = await this.fetchMoviesByTitle(dataPageNum);
      this.#cachedPages.set(dataPageNum, data);
    } catch (error) {
      console.log(error);
      throw error;
    }
    return data;
  }
}
