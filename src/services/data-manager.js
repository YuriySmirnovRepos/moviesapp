const REACT_APP_ACCESS_TOKEN_AUTH = process.env.REACT_APP_ACCESS_TOKEN_AUTH;
const BASE_URL = "http://api.themoviedb.org/3";
const IMAGES_BASE_URL = "https://image.tmdb.org/t/p/w185"; //w185 - размер получаемой картинки к фильму
const ITEMS_COUNT_PER_DISPLAY_PAGE = 6;
const ITEMS_COUNT_PER_DATA_PAGE = 20;

class MoviesApiService {
  #getGuestSession = async () => {
    const createGuestSession = async () => {
      const url = `${BASE_URL}/authentication/guest_session/new`;
      let { success, guest_session_id } = await this.#getResource(url);

      if (!success) {
        throw new Error("Failed to create guest session");
      }

      return guest_session_id;
    };

    let guestSessionId = localStorage.getItem("guestSessionId");
    if (guestSessionId) {
      return guestSessionId;
    }

    const guest_session_id = await createGuestSession();
    localStorage.setItem("guestSessionId", guest_session_id);

    return guest_session_id;
  };

  #getResource = async (url) => {
    if (!navigator.onLine) {
      throw new Error("No internet connection");
    }
    const options = {
      // mode: 'no-cors',
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${REACT_APP_ACCESS_TOKEN_AUTH}`,
      },
    };

    let rslt = null;

    rslt = await fetch(url, options);

    if (!rslt.ok) {
      if (rslt.status === 404) return {results: [], total_results: 0};
      throw new Error(`Сервер сообщил об ошибке. ${rslt.statusText}`);
    }

    rslt = await rslt.json();

    return rslt;
  };

  #setResource = async (url, data) => {
    if (!navigator.onLine) {
      throw new Error("No internet connection");
    }
    const options = {
      method: "POST",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${REACT_APP_ACCESS_TOKEN_AUTH}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };

    let rslt = await fetch(url, options);
    if (!rslt?.ok) {
      throw new Error("setResorce: Failed to set resource");
    }
  }

  #deleteResource = async (url) => {
    if (!navigator.onLine) {
      throw new Error("No internet connection");
    }
    const options = {
      method: "DELETE",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${REACT_APP_ACCESS_TOKEN_AUTH}`,
        "Content-Type": "application/json",
      },
    };
    let rslt = await fetch(url, options);
    if (!rslt?.ok) {
      throw new Error("deleteResource: Failed to delete resource");
    }
  }
///////////////////////
///////////////////////
  sendSetRating = async (movieId, rating) => {
    let guestSessionId = await this.#getGuestSession();
    const url = `${BASE_URL}/movie/${movieId}/rating?guest_session_id=${guestSessionId}`;
    this.#setResource(url, {value: rating});
  }

  fetchGenres = async () => {
    //получаем данные о жанрах
    const genres = await this.#getResource(
      `${BASE_URL}/genre/movie/list?language=en-US`
    );
    return genres.genres;
  };

  fetchSearch = async (dataPageNum = 1, title) => {
    const searchParams = new URLSearchParams({
      include_adult: false,
      query: title,
      page: dataPageNum,
    });

    const url = `${BASE_URL}/search/movie?${searchParams}`;

    return await this.#getResource(url);
  };

  fetchRated = async (dataPageNum = 1) => {
    let guestSessionId = await this.#getGuestSession();
    const searchParams = new URLSearchParams({
      language: "en-US",
      page: dataPageNum,
      sort_by: "created_at.asc",
    });

    const url = `${BASE_URL}/guest_session/${guestSessionId}/rated/movies?${searchParams}`;

    return await this.#getResource(url);
  };
}

export default class DataManager {
  #currentQuery = "";
  #searchCache = new Map();
  #ratedCache = new Map();
  totalSearchCount = 0;
  totalRatedCount = 0;
  #genres = null;
  #moviesApiService = new MoviesApiService();

  init = async () => {
    //Инициализация жанров
    if (!this.#genres) {
      this.#genres = await this.#moviesApiService.fetchGenres();
    }

    if (this.#ratedCache.size === 0) {
      const rated = await this.#moviesApiService.fetchRated();
      if (rated?.total_results > 0) {
        // TODO: формат данных??
        this.#ratedCache.set(1, ...rated.results);
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
      : this.#moviesApiService.fetchSearch;
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

  getMyRating = async (movieId) => {
    return this.#moviesApiService.getMyRating(movieId);
  }

  getRated = async (paginationPageNum) => {
    return this.#getDisplayPageData(paginationPageNum);
  };
}
