const REACT_APP_ACCESS_TOKEN_AUTH = process.env.REACT_APP_ACCESS_TOKEN_AUTH;
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGES_BASE_URL = "https://image.tmdb.org/t/p/w185"; //w185 - размер получаемой картинки к фильму
const ITEMS_COUNT_PER_DISPLAY_PAGE = 6;
const ITEMS_COUNT_PER_DATA_PAGE = 20;

//Получает JSON, обрабатывает ошибки в заголовке ответа
class MoviesApiService {
  constructor() {
    this.get = this.#createMethod("GET");
    this.post = this.#createMethod("POST");
    this.delete = this.#createMethod("DELETE");
  }

  #createMethod(method) {
    return async (url, data) => {
      if (!navigator.onLine) {
        throw new Error("No internet connection");
      }

      const options = {
        method,
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${REACT_APP_ACCESS_TOKEN_AUTH}`,
          "Content-Type": "application/json;charset=utf-8"
        },
        body: data ? JSON.stringify(data) : undefined,
      };

      const response = await fetch(`${BASE_URL}${url}`, options);

      const responseBody = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          return {};
        }
        throw new Error(
          `API Error: ${
            response.statusText + `\n` + (responseBody.status_message || "")
          }`
        );
      }
      return responseBody;
    };
  }

  #getGuestSession = async () => {
    const cachedSession = JSON.parse(
      localStorage.getItem("MoviesApp_guestSession")
    );
    if (cachedSession && new Date(cachedSession.expires_at) > new Date()) {
      return cachedSession.guest_session_id;
    }

    const url = `/authentication/guest_session/new`;
    const { success, guest_session_id, expires_at } = await this.get(url);

    if (!success) {
      throw new Error("Failed to create guest session");
    }

    const newSession = { guest_session_id, expires_at };
    localStorage.setItem("MoviesApp_guestSession", JSON.stringify(newSession));

    return newSession.guest_session_id;
  };

  ///////////////////////
  ///////////////////////
  sendSetRating = async (movieId, rating) => {
    let guestSessionId = await this.#getGuestSession();
    const url = `/movie/${movieId}/rating?guest_session_id=${guestSessionId}`;
    this.post(url, { value: rating });
  };

  fetchGenres = async () => {
    const url = "/genre/movie/list?language=en-US";
    const genres = await this.get(url);
    return genres.genres;
  };

  fetchSearchResults = async (dataPageNum = 1, title) => {
    const searchParams = new URLSearchParams({
      include_adult: false,
      query: title,
      page: dataPageNum,
    });

    const url = `/search/movie?${searchParams}`;

    return await this.get(url);
  };

  fetchRated = async (dataPageNum = 1) => {
    let guestSessionId = await this.#getGuestSession();
    const searchParams = new URLSearchParams({
      language: "en-US",
      page: dataPageNum,
      // sort_by: "created_at.asc",
    });

    const url = `/guest_session/${guestSessionId}/rated/movies?${searchParams}`;

    return await this.get(url);
  };
}

//Обработка JSON для выдачи UI
export default class DataManager {
  static instance;

  #currentQuery = "";
  #searchCache = new Map();
  #ratedCache = new Map();
  totalSearchCount = 0;
  totalRatedCount = 0;
  #genres = null;
  #moviesApiService = new MoviesApiService();


  constructor() {
    if (!DataManager.instance) {
      DataManager.instance = this;
    }
    return DataManager.instance;
  }

  init = async () => {
    //Инициализация жанров
    if (!this.#genres) {
      this.#genres = await this.#moviesApiService.fetchGenres();
    }

    if (this.#ratedCache.size === 0) {
      const rated = await this.#moviesApiService.fetchRated();
      if (rated?.total_results > 0) {
        this.#ratedCache.set(1, rated.results);
      }
    }
  };

  #calcPageAndIndex = (
    displayPage,
    items2DisplayCount = 6,
    itemsPerPageDataCount = 20
  ) => {
    const dataPage =
      Math.floor(
        ((displayPage - 1) * items2DisplayCount) / itemsPerPageDataCount
      ) + 1;
    const startIdx =
      ((displayPage - 1) * items2DisplayCount) % itemsPerPageDataCount;
    return { dataPage, startIdx };
  };

  #getDisplayPageData = async (paginationPageNum, searchQuery) => {
    if (!this.#genres) {
      throw new Error("Genres not initialized. Check your internet connection");
    }

    if (searchQuery) {
      // Чистка кэша при поиске по новому запросу
      const isNeedsToClearCache = searchQuery !== this.#currentQuery;

      if (isNeedsToClearCache) {
        this.#currentQuery = this.searchQuery;
        this.#searchCache = new Map();
      }
    }

    const { dataPage, startIdx } = this.#calcPageAndIndex(
      paginationPageNum,
      ITEMS_COUNT_PER_DISPLAY_PAGE,
      ITEMS_COUNT_PER_DATA_PAGE
    );

    let rslt = [];
    let endIdx =
      startIdx + ITEMS_COUNT_PER_DISPLAY_PAGE - ITEMS_COUNT_PER_DATA_PAGE;

    const data = await this.#getData(dataPage, searchQuery);
    rslt.push(...data.slice(startIdx, startIdx + ITEMS_COUNT_PER_DISPLAY_PAGE));

    if (endIdx > 0) {
      const secondPartOfData = await this.#getData(dataPage + 1, searchQuery);
      rslt.push(...secondPartOfData.slice(0, endIdx));
    }

    return rslt;
  };

  //Вернуть выдачу с 20 результатами на страницу.
  // Если title не задан, возвращаем оцененные фильмы,
  // в кэше данные : "ключ - номер страницы данных, значение - список фильмов"
  #getData = async (dataPageNum, query) => {
    const isRatedNeeded = !query;
    const cache2Use = isRatedNeeded ? this.#ratedCache : this.#searchCache;
    if (cache2Use.has(dataPageNum)) {
      return Promise.resolve(cache2Use.get(dataPageNum));
    }

    const func2Use = isRatedNeeded
      ? this.#moviesApiService.fetchRated
      : this.#moviesApiService.fetchSearchResults;
    const args = isRatedNeeded ? [dataPageNum] : [dataPageNum, query];

    let results,
      total_results = null;
    try {
      ({ results, total_results } = await func2Use(...args));
      results = this.#transformData(results);
      cache2Use.set(dataPageNum, results);
    } catch (error) {
      console.log(error);
      throw error;
    }
    this.totalSearchCount = total_results;

    return results;
  };

  #transformData = (data) => {
    //Вспомогательная функция получения имени жанра по ID
    const getGenreName = (genreId) => {
      const findedGenre = this.#genres.find((genre) => genre.id === genreId);
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
  ////////////////////////////////
  ////////////////////////////////
  search = async (nwQuery, paginationPageNum) => {
    return this.#getDisplayPageData(paginationPageNum, nwQuery);
  };

  setRating = async (movieId, rating) => {
    return this.#moviesApiService.sendSetRating(movieId, rating);
  };

  getRated = async (paginationPageNum) => {
    return this.#getDisplayPageData(paginationPageNum);
  };
}
