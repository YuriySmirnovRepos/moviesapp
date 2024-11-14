// w185 - размер получаемой картинки к фильму

import Utils from '../utils/utils';

import MoviesApiService from './movies-api-service';

const IMAGES_BASE_URL = 'https://image.tmdb.org/t/p/w185';

// Обработка JSON для выдачи UI с кешированием данных
export default class DataManager {
  static instance;

  #ITEMS_COUNT_PER_DISPLAY_PAGE = 6;

  #ITEMS_COUNT_PER_DATA_PAGE = 20;

  #currentQuery = '';

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
    // eslint-disable-next-line no-constructor-return
    return DataManager.instance;
  }

  init = async () => {
    const initGenres = async () => {
      if (!this.#genres) {
        this.#genres = await this.#moviesApiService.fetchGenres();
      }
    };
    const initRated = async () => {
      const { total_pages: totalPages, total_results: totalResults } =
        await this.#moviesApiService.fetchRated(1);

      if (totalResults === 0) {
        // Если нет рейтингов
        return;
      }

      this.totalRatedCount = totalResults;

      // [ {results: [], total_pages: x, total_results: y}, {...}, ...]
      const promises = Array(totalPages)
        .fill(0)
        .map((_, page) => this.#moviesApiService.fetchRated(page + 1));

      const responses = await Promise.all(promises);
      responses.forEach((response, index) =>
        this.#ratedFilmsCache.set(
          index + 1, // номер страницы данных
          this.#transformDataFromServer(response.results),
        ),
      );

      responses
        .flatMap(({ results }) => results)
        .forEach((film) => {
          this.#ratedFilmsByIdCache.set(film.id, film.rating);
        });
    };

    await initGenres();
    await initRated();
  };

  #getDisplayPageData = async (paginationPageNum, searchQuery) => {
    if (!this.#genres) {
      throw new Error('Genres not initialized. Check your internet connection');
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
      this.#ITEMS_COUNT_PER_DATA_PAGE,
    );

    const rslt = [];
    const endIdx =
      startIdx +
      this.#ITEMS_COUNT_PER_DISPLAY_PAGE -
      this.#ITEMS_COUNT_PER_DATA_PAGE;

    const data = await this.#getData(dataPageNum, searchQuery);
    rslt.push(
      ...data.slice(startIdx, startIdx + this.#ITEMS_COUNT_PER_DISPLAY_PAGE),
    );

    if (endIdx > 0) {
      // если начальный индекс > 14, считать данные со следующей страницы
      const secondPartOfData = await this.#getData(
        dataPageNum + 1,
        searchQuery,
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

    let results;
    let totalResults = null;
    // try {
    ({ results, total_results: totalResults } = await func2Use(...args));
    if (totalResults > 0) {
      results = this.#transformDataFromServer(results);
      if (isGetRated) {
        this.totalRatedCount = totalResults;
        this.#ratedFilmsCache.set(dataPageNum, results);
      } else {
        this.totalSearchCount = totalResults;
        this.#searchCache.set(dataPageNum, results);
      }
    }
    // } catch (error) {
    //   console.log(error);
    //   throw error;
    // }

    return results;
  };

  #transformDataFromServer = (data = []) => {
    // Вспомогательная функция получения имени жанра по ID
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
    if (!nwQuery) {
      return [];
    }
    return this.#getDisplayPageData(paginationPageNum, nwQuery);
  };

  setRating = async (movieId, rating) => {
    const updateRatingInCache = () => {
      this.#ratedFilmsByIdCache.set(movieId, rating);

      let film2AddToRatedCache = null;

      this.#searchCache.forEach((films) => {
        const filmIndex = films.findIndex((f) => f.id === movieId);
        if (filmIndex !== -1) {
          // eslint-disable-next-line no-param-reassign
          films[filmIndex] = { ...films[filmIndex], myRating: rating };
          film2AddToRatedCache = films[filmIndex];
        }
      });

      let isFilmInRatedCache = false;
      this.#ratedFilmsCache.forEach((films) => {
        const filmIndex = films.findIndex((f) => f.id === movieId);
        if (filmIndex !== -1) {
          isFilmInRatedCache = true;
          // eslint-disable-next-line no-param-reassign
          films[filmIndex] = { ...films[filmIndex], myRating: rating };
        }
      });

      if (!isFilmInRatedCache) {
        const cacheSize = this.#ratedFilmsCache.size;
        const lastPageLength =
          cacheSize && this.#ratedFilmsCache.get(cacheSize).length;
        if (lastPageLength > 0 && lastPageLength < 20) {
          this.#ratedFilmsCache.set(cacheSize, [
            ...this.#ratedFilmsCache.get(cacheSize),
            { ...film2AddToRatedCache, myRating: rating },
          ]);
        } else {
          this.#ratedFilmsCache.set(cacheSize + 1, [
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
