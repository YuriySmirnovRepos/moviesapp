const { REACT_APP_ACCESS_TOKEN_AUTH } = process.env;
const BASE_URL = 'https://api.themoviedb.org/3';

// Получает JSON, обрабатывает ошибки в заголовке ответа
export default class MoviesApiService {
  constructor() {
    this.get = MoviesApiService.#createMethod('GET');
    this.post = MoviesApiService.#createMethod('POST');
    this.delete = MoviesApiService.#createMethod('DELETE');
  }

  // Если 404 - возвращает {total_results: 0, results: [], total_pages: 0}
  static #createMethod(method) {
    return async (url, data) => {
      if (!navigator.onLine) {
        throw new Error('No internet connection');
      }

      const options = {
        method,
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${REACT_APP_ACCESS_TOKEN_AUTH}`,
          'Content-Type': 'application/json;charset=utf-8',
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
          `API Error: ${`${response.statusText}\n${responseBody.status_message || ''}`}`,
        );
      }
      return responseBody;
    };
  }

  #getGuestSession = async () => {
    const cachedSession = JSON.parse(
      localStorage.getItem('MoviesApp_guestSession'),
    );
    if (cachedSession && new Date(cachedSession.expires_at) > new Date()) {
      return cachedSession.guest_session_id;
    }

    const url = '/authentication/guest_session/new';
    const {
      success,
      guest_session_id: guestSessionID,
      expires_at: expiresAt,
    } = await this.get(url);

    if (!success) {
      throw new Error('Failed to create guest session');
    }

    const newSession = {
      guest_session_id: guestSessionID,
      expires_at: expiresAt,
    };
    localStorage.setItem('MoviesApp_guestSession', JSON.stringify(newSession));

    return newSession.guest_session_id;
  };

  /// ////////////////////
  /// ////////////////////
  sendSetRating = async (movieId, rating) => {
    const guestSessionId = await this.#getGuestSession();
    const url = `/movie/${movieId}/rating?guest_session_id=${guestSessionId}`;
    this.post(url, { value: rating });
  };

  fetchGenres = async () => {
    const url = '/genre/movie/list?language=en-US';
    const genres = await this.get(url);
    return genres.genres;
  };

  fetchSearchResults = async (dataPageNum, title) => {
    const searchParams = new URLSearchParams({
      include_adult: false,
      query: title,
      page: dataPageNum,
    });

    const url = `/search/movie?${searchParams}`;

    return this.get(url);
  };

  fetchRated = async (dataPageNum = 1) => {
    const guestSessionId = await this.#getGuestSession();
    const searchParams = new URLSearchParams({
      language: 'en-US',
      page: dataPageNum,
    });

    const url = `/guest_session/${guestSessionId}/rated/movies?${searchParams}`;

    return this.get(url);
  };
}
