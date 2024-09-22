const REACT_APP_ACCESS_TOKEN_AUTH = process.env.REACT_APP_ACCESS_TOKEN_AUTH;
const BASE_URL = 'http://api.themoviedb.org/3';
const IMAGES_BASE_URL = 'https://image.tmdb.org/t/p/w185'; //w185 - размер получаемой картинки к фильму
const ITEMS_COUNT_PER_PAGINATION_PAGE = 6;
const ITEMS_COUNT_PER_DATA_PAGE = 20;

class MoviesApiService {
  #getResource = async (url) => {
    if (navigator.onLine === false) {
      throw new Error('No internet connection');
    }
    const options = {
      // mode: 'no-cors',
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${REACT_APP_ACCESS_TOKEN_AUTH}`,
      },
    };
    console.log(process.env.REACT_APP_ACCESS_TOKEN_AUTH);
    let rslt = null;

    rslt = await fetch(url, options);

    if (!rslt.ok) {
      throw new Error(`Сервер сообщил об ошибке. ${rslt.statusText}`);
    }

    rslt = await rslt.json();

    return rslt;
  };

  getGenres = async () => {
    //получаем данные о жанрах
    const genres = await this.#getResource(
      `${BASE_URL}/genre/movie/list?language=en-US`
    );
    return genres.genres;
  };

  fetchMovies = async (dataPageNum = 1, title) => {
    const searchParams = new URLSearchParams({
      include_adult: false,
      query: title,
      page: dataPageNum,
    });

    const url = `${BASE_URL}/search/movie?${searchParams}`;

    return await this.#getResource(url);
  };
}

export default class DataManager {
  static #currentTitle = '';
  static #dataFromServer = new Map();
  static totalElementsCount = 0;
  static #genres = null;
  static #moviesApiService = new MoviesApiService();
  static #itemsRangesOnDataPage = {
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

  //Вернуть массив с фильмами для страницы пагинации
  getMovies = async (nwTitle = 'return', paginationPageNum = 1) => {
    let rslt = [];

    //Инициализация жанров
    if (!DataManager.#genres) {
      DataManager.#genres = await DataManager.#moviesApiService.getGenres();
    }

    // Если поиск новый (не переключение страниц пагинации), то очистить кэш и обновить поле #currentTitle
    const isTheTitleTheSame = nwTitle === DataManager.#currentTitle;

    if (!isTheTitleTheSame) {
      DataManager.#currentTitle = nwTitle;
      DataManager.#dataFromServer = new Map();
    }

    let pageNumOfData = Math.ceil(
      (paginationPageNum * ITEMS_COUNT_PER_PAGINATION_PAGE) /
        ITEMS_COUNT_PER_DATA_PAGE
    ); // получаем номер текущей страницы данных по номеру пагинации

    let start,
      end = 0; // диапазон на странице данных

    let reducedPageNumOfView = paginationPageNum % 10;
    if (reducedPageNumOfView === 0) {
      reducedPageNumOfView = 10;
    }

    [start, end] = DataManager.#itemsRangesOnDataPage[reducedPageNumOfView];

    let data = null;

    if (reducedPageNumOfView !== 4 && reducedPageNumOfView !== 7) {
      data = await this.#getDataFromCacheOrServer(pageNumOfData, nwTitle);

      rslt.push(...data.slice(start, end));
    } else {
      if (reducedPageNumOfView === 4) {
        if (pageNumOfData % 3 === 2) {
          //Первая часть данных с предыдущей страницы данных
          data = await this.#getDataFromCacheOrServer(
            pageNumOfData - 1,
            nwTitle
          );
          rslt.push(...data.slice(start, 20));

          //Вторая часть данных на текущей странице данных
          data = await this.#getDataFromCacheOrServer(pageNumOfData, nwTitle);
          rslt.push(...data.slice(0, end));
        }
      }

      if (reducedPageNumOfView === 7) {
        //Первая часть данных с предыдущей страницы данных
        data = await this.#getDataFromCacheOrServer(pageNumOfData - 1, nwTitle);
        rslt.push(...data.slice(start, 20));

        //Вторая часть данных на текущей странице данных
        data = await this.#getDataFromCacheOrServer(pageNumOfData, nwTitle);
        rslt.push(...data.slice(0, end));
      }
    }

    return rslt;
  };

  //Вернуть выдачу сервера с 20 результатами на страницу
  #getDataFromCacheOrServer = async (dataPageNum, title) => {
    if (DataManager.#dataFromServer.has(dataPageNum)) {
      return Promise.resolve(DataManager.#dataFromServer.get(dataPageNum));
    }
    let results,
      total_results = null;
    try {
      ({ results, total_results } =
        await DataManager.#moviesApiService.fetchMovies(dataPageNum, title));
      results = this.#formatData(results);
      DataManager.#dataFromServer.set(dataPageNum, results);
    } catch (error) {
      console.log(error);
      throw error;
    }
    DataManager.totalElementsCount = total_results;

    return results;
  };

  #formatData = (data) => {
    //Вспомогательная функция получения имени жанра по ID
    const getGenreName = (genreId) => {
      const findedGenre = DataManager.#genres.find(
        (genre) => genre.id === genreId
      );
      return findedGenre.name;
    };

    const formatPosterPath = (posterPath) => {
      if (!posterPath) return null;
      return IMAGES_BASE_URL + posterPath;
    };

    return data.map((movie) => {
      return {
        id: movie.id,
        name: movie.title,
        description: movie.overview,
        genres: movie.genre_ids.map((genreId) => getGenreName(genreId)),
        rating: movie.vote_average,
        premier: movie.release_date,
        poster: formatPosterPath(movie.poster_path),
      };
    });
  };
}
