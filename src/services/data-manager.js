const REACT_APP_ACCESS_TOKEN_AUTH = process.env.REACT_APP_ACCESS_TOKEN_AUTH;
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGES_BASE_URL = "https://image.tmdb.org/t/p/w185"; //w185 - размер получаемой картинки к фильму

import Utils from "../utils/utils";

//Получает JSON, обрабатывает ошибки в заголовке ответа
class MoviesApiService {
  constructor() {
    this.get = this.#createMethod("GET");
    this.post = this.#createMethod("POST");
    this.delete = this.#createMethod("DELETE");
  }

  //Если 404 - возвращает {total_results: 0, results: [], total_pages: 0}
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
          "Content-Type": "application/json;charset=utf-8",
        },
        body: data ? JSON.stringify(data) : undefined,
      };

      const response = await fetch(`${BASE_URL}${url}`, options);

      const responseBody = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          return { total_results: 0, results: [], total_pages: 0 };
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
    });

    const url = `/guest_session/${guestSessionId}/rated/movies?${searchParams}`;

    return await this.get(url);
  };
}

//Обработка JSON для выдачи UI с кешированием данных
export default class DataManager {
  static instance;
  #ITEMS_COUNT_PER_DISPLAY_PAGE = 6;
  #ITEMS_COUNT_PER_DATA_PAGE = 20;

  #currentQuery = "";
  #searchCache = new Map();
  #ratedFilmsCache = new Map();
  #ratedFilmsByIdCache = new Map();
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
    const initGenres = async () => {
      if (!this.#genres) {
        this.#genres = await this.#moviesApiService.fetchGenres();
      }
    };
    const initRated = async () => {
      const { total_pages, total_results } =
        await this.#moviesApiService.fetchRated(1);

      if (total_results === 0) {
        //Если нет рейтингов
        return;
      }

      this.totalRatedCount = total_results;

      //[ {results: [], total_pages: x, total_results: y}, {...}, ...]
      const promises = Array(total_pages)
        .fill(0)
        .map((_, page) => this.#moviesApiService.fetchRated(page + 1));

      const responses = await Promise.all(promises);
      responses.forEach((response, index) =>
        this.#ratedFilmsCache.set(
          index + 1, //номер страницы данных
          this.#transformData(response.results)
        )
      );

      responses.flatMap(({ results }) => results).forEach((film) => {
        this.#ratedFilmsByIdCache.set(film.id, film.rating);
      });
    };

    await initGenres();
    await initRated();
  };


  #getDisplayPageData = async (paginationPageNum, searchQuery) => {
    if (!this.#genres) {
      throw new Error("Genres not initialized. Check your internet connection");
    }

    if (searchQuery) {
      // Чистка кэша при поиске по новому запросу
      const isNewSearch = searchQuery !== this.#currentQuery;

      if (isNewSearch) {
        this.#currentQuery = searchQuery;
        this.#searchCache = new Map();
      }
    }

    const { dataPageNum, startIdx } = Utils.paginationData2DisplayConvert(
      paginationPageNum,
      this.#ITEMS_COUNT_PER_DISPLAY_PAGE,
      this.#ITEMS_COUNT_PER_DATA_PAGE
    );

    let rslt = [];
    let endIdx =
      startIdx +
      this.#ITEMS_COUNT_PER_DISPLAY_PAGE -
      this.#ITEMS_COUNT_PER_DATA_PAGE;

    const data = await this.#getData(dataPageNum, searchQuery);
    rslt.push(
      ...data.slice(startIdx, startIdx + this.#ITEMS_COUNT_PER_DISPLAY_PAGE)
    );

    if (endIdx > 0) {
      //если начальный индекс > 14, считать данные со следующей страницы
      const secondPartOfData = await this.#getData(
        dataPageNum + 1,
        searchQuery
      );
      rslt.push(...secondPartOfData.slice(0, endIdx));
    }

    return rslt;
  };

  // Вернуть выдачу с 20 результатами на страницу.
  // Если title в аргументе не задан, возвращаем оцененные фильмы.
  // в кэше данные : "ключ - номер страницы данных, значение - список фильмов"
  #getData = async (dataPageNum, query) => {
    const isGetRated = !query;
    const cache2Use = isGetRated ? this.#ratedFilmsCache : this.#searchCache;

    if (cache2Use.has(dataPageNum)) {
      return Promise.resolve(cache2Use.get(dataPageNum));
    }

    const func2Use = isGetRated
      ? this.#moviesApiService.fetchRated
      : this.#moviesApiService.fetchSearchResults;
    const args = isGetRated ? [dataPageNum] : [dataPageNum, query];

    let results,
      total_results = null;
    try {
      ({ results, total_results } = await func2Use(...args));
      if (total_results > 0) {
        results = this.#transformData(results);
        if (isGetRated) {
          this.totalRatedCount = total_results;
          this.#ratedFilmsCache.set(dataPageNum, results);
        } else {
          this.totalSearchCount = total_results;
          this.#searchCache.set(dataPageNum, results);
        }
      }
    } catch (error) {
      console.log(error);
      throw error;
    }

    // if (isGetRated) {
    //   this.totalRatedCount = total_results;
    // } else {
    //   this.totalSearchCount = total_results;
    // }

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
        myRating: movie.rating ?? this.#ratedFilmsByIdCache.get(movie.id),
        premier: movie.release_date,
        poster: formatPosterPath(movie.poster_path),
      };
    });
  };

  search = async (nwQuery, paginationPageNum) => {
    if (!nwQuery) {return [];}
    return this.#getDisplayPageData(paginationPageNum, nwQuery);
  };

  setRating = async (movieId, rating) => {
    const updateRatingInCache = () => {
      this.#ratedFilmsByIdCache.set(movieId, rating);

      let film2AddToRatedCache = null;

      this.#searchCache.forEach((films) => {
        const filmIndex = films.findIndex((f) => f.id === movieId);
        if (filmIndex !== -1) {
          films[filmIndex] = { ...films[filmIndex], myRating: rating };
          film2AddToRatedCache = films[filmIndex];
        }
      });
      
      let isFilmInRatedCache = false;
      this.#ratedFilmsCache.forEach((films) => {
        const filmIndex = films.findIndex((f) => f.id === movieId);
        if (filmIndex !== -1) {
          isFilmInRatedCache = true;
          films[filmIndex] = { ...films[filmIndex], myRating: rating };
        }
      });

      if (!isFilmInRatedCache) {
        const lastPageLength = this.#ratedFilmsCache.get(this.#ratedFilmsCache.size).length;
        if (lastPageLength < 20) {  
        this.#ratedFilmsCache.set(this.#ratedFilmsCache.size, [
          ...this.#ratedFilmsCache.get(this.#ratedFilmsCache.size),
          { ...film2AddToRatedCache, myRating: rating },
        ]);
        }
        else {
          this.#ratedFilmsCache.set(this.#ratedFilmsCache.size + 1, [
            { ...film2AddToRatedCache, myRating: rating },
          ]);
        }
        this.totalRatedCount += 1;
      }
    };

    updateRatingInCache();
    return this.#moviesApiService.sendSetRating(movieId, rating);
  };

  getRated = async (paginationPageNum) => {
    return this.#getDisplayPageData(paginationPageNum);
  };
}
