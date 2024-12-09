/**
 * The error thrown by the default {@link UserFetcher}.
 *
 * The `status` property contains the status code of the response. It is `0` when the request
 * fails, for example due to being offline.
 *
 * This error is not thrown when the status code of the response is `204`, because that means the
 * user is not authenticated.
 *
 * @category Client
 */
export class RequestError extends Error {
    public status: number;

    constructor(status: number) {
      /* c8 ignore next */
      super();
      this.status = status;
      Object.setPrototypeOf(this, RequestError.prototype);
    }
}

export async function validateToken(token: string): Promise<boolean> {
    return true;
}
