type QueryValue = boolean | number | string | null | undefined;

export type QueryParams = object;

export interface ApiResponse<TData = unknown> {
  data: TData;
  message?: string;
  success: boolean;
}

export interface ApiListMeta {
  limit: number;
  page: number;
  total: number;
  totalPages: number;
}

export interface ApiList<TItem> {
  items: TItem[];
  meta: ApiListMeta;
}

export interface ApiErrorBody {
  errors?: unknown[];
  message?: string;
  success?: false;
}

export interface ApiClientOptions {
  baseUrl: string;
  fetcher?: typeof fetch;
  getAccessToken?: () => string | null | undefined;
}

export interface ApiRequestInit extends Omit<RequestInit, 'body'> {
  body?: BodyInit | object | null;
  query?: QueryParams;
}

export interface ApiClient {
  request<TResponse>(path: string, init?: ApiRequestInit): Promise<TResponse>;
}

export class ApiClientError extends Error {
  readonly errors?: unknown[];
  readonly payload?: unknown;
  readonly status: number;

  constructor(status: number, message: string, payload?: unknown, errors?: unknown[]) {
    super(message);
    this.name = 'ApiClientError';
    this.errors = errors;
    this.payload = payload;
    this.status = status;
  }
}

export type SortOrder = 'asc' | 'desc';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SendOtpRequest {
  email?: string;
  mobile?: string;
}

export interface VerifyOtpRequest extends SendOtpRequest {
  otp: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface ListQuery {
  isActive?: boolean;
  limit?: number;
  page?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface Hospital {
  address: string | null;
  billPrefix: string | null;
  city: string | null;
  createdAt: string;
  deletedAt: string | null;
  gstApplicable: boolean;
  hospitalCode: string;
  hospitalName: string;
  id: string;
  isActive: boolean;
  state: string | null;
  updatedAt: string;
}

export interface HospitalInput {
  address?: string;
  billPrefix?: string;
  city?: string;
  gstApplicable?: boolean;
  hospitalCode: string;
  hospitalName: string;
  isActive?: boolean;
  state?: string;
}

export type HospitalSummary = Pick<
  Hospital,
  'hospitalCode' | 'hospitalName' | 'id' | 'isActive'
>;

export interface HospitalListQuery extends ListQuery {
  city?: string;
  state?: string;
}

export interface Location {
  address: string | null;
  area: string | null;
  building: string | null;
  createdAt: string;
  deletedAt: string | null;
  floor: string | null;
  hospital: HospitalSummary;
  hospitalId: string;
  id: string;
  isActive: boolean;
  locationName: string;
  updatedAt: string;
}

export interface LocationInput {
  address?: string;
  area?: string;
  building?: string;
  floor?: string;
  hospitalId: string;
  isActive?: boolean;
  locationName: string;
}

export interface LocationListQuery extends ListQuery {
  area?: string;
  building?: string;
  floor?: string;
  hospitalId?: string;
}

export interface Store {
  address: string | null;
  createdAt: string;
  deletedAt: string | null;
  hospital: HospitalSummary;
  hospitalId: string;
  id: string;
  isActive: boolean;
  location: Pick<Location, 'id' | 'isActive' | 'locationName'> | null;
  locationId: string | null;
  storeCode: string;
  storeName: string;
  storeType: string | null;
  updatedAt: string;
}

export interface StoreInput {
  address?: string;
  hospitalId: string;
  isActive?: boolean;
  locationId?: string;
  storeCode: string;
  storeName: string;
  storeType?: string;
}

export interface StoreListQuery extends ListQuery {
  hospitalId?: string;
  locationId?: string;
  storeType?: string;
}

export interface Kitchen {
  closingTime: string | null;
  createdAt: string;
  deletedAt: string | null;
  hospital: HospitalSummary;
  hospitalId: string;
  id: string;
  isActive: boolean;
  kitchenCode: string;
  kitchenName: string;
  location: Pick<Location, 'id' | 'isActive' | 'locationName'> | null;
  locationId: string | null;
  openingTime: string | null;
  updatedAt: string;
}

export interface KitchenInput {
  closingTime?: string;
  hospitalId: string;
  isActive?: boolean;
  kitchenCode: string;
  kitchenName: string;
  locationId?: string;
  openingTime?: string;
}

export interface KitchenListQuery extends ListQuery {
  hospitalId?: string;
  locationId?: string;
}

export interface Restaurant {
  address: string | null;
  b2cQrEnabled: boolean;
  bankBranch: string | null;
  bankName: string | null;
  closingTime: string | null;
  createdAt: string;
  deletedAt: string | null;
  fssaiNumber: string | null;
  gstNumber: string | null;
  hospital: HospitalSummary;
  hospitalId: string;
  id: string;
  inRoomDiningEnabled: boolean;
  isActive: boolean;
  kitchen: Pick<Kitchen, 'id' | 'isActive' | 'kitchenCode' | 'kitchenName'> | null;
  kitchenId: string | null;
  location: Pick<Location, 'id' | 'isActive' | 'locationName'> | null;
  locationId: string | null;
  normalDiscountApplicable: boolean;
  onlineOrderingEnabled: boolean;
  openingTime: string | null;
  panNumber: string | null;
  restaurantCode: string;
  restaurantName: string;
  staffDiscountApplicable: boolean;
  store: Pick<Store, 'id' | 'isActive' | 'storeCode' | 'storeName'> | null;
  storeId: string | null;
  sunBu: string | null;
  sunT1: string | null;
  sunT2: string | null;
  updatedAt: string;
  upiId: string | null;
}

export interface RestaurantInput {
  address?: string;
  b2cQrEnabled?: boolean;
  bankBranch?: string;
  bankName?: string;
  closingTime?: string;
  fssaiNumber?: string;
  gstNumber?: string;
  hospitalId: string;
  inRoomDiningEnabled?: boolean;
  isActive?: boolean;
  kitchenId?: string;
  locationId?: string;
  normalDiscountApplicable?: boolean;
  onlineOrderingEnabled?: boolean;
  openingTime?: string;
  panNumber?: string;
  restaurantCode: string;
  restaurantName: string;
  staffDiscountApplicable?: boolean;
  storeId?: string;
  sunBu?: string;
  sunT1?: string;
  sunT2?: string;
  upiId?: string;
}

export interface RestaurantListQuery extends ListQuery {
  hospitalId?: string;
  kitchenId?: string;
  locationId?: string;
  storeId?: string;
}

export interface Counter {
  counterCode: string;
  counterName: string;
  createdAt: string;
  deletedAt: string | null;
  hospital: HospitalSummary;
  hospitalId: string;
  id: string;
  isActive: boolean;
  paymentDeviceId: string | null;
  pineLabsDeviceId: string | null;
  posDeviceId: string | null;
  restaurant: Pick<Restaurant, 'id' | 'isActive' | 'restaurantCode' | 'restaurantName'>;
  restaurantId: string;
  updatedAt: string;
}

export interface CounterInput {
  counterCode: string;
  counterName: string;
  hospitalId: string;
  isActive?: boolean;
  paymentDeviceId?: string;
  pineLabsDeviceId?: string;
  posDeviceId?: string;
  restaurantId: string;
}

export interface CounterListQuery extends ListQuery {
  hospitalId?: string;
  restaurantId?: string;
}

function appendQuery(path: string, query?: QueryParams): string {
  if (!query) {
    return path;
  }

  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    const queryValue = value as QueryValue;

    if (queryValue !== undefined && queryValue !== null && queryValue !== '') {
      params.set(key, String(queryValue));
    }
  });

  const queryString = params.toString();

  return queryString ? `${path}?${queryString}` : path;
}

function getErrorBody(payload: unknown): ApiErrorBody | undefined {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  return payload;
}

function isJsonBody(body: unknown): body is Record<string, unknown> | unknown[] {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  const isUrlSearchParams = typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams;
  const isBlob = typeof Blob !== 'undefined' && body instanceof Blob;
  const isArrayBuffer = body instanceof ArrayBuffer;

  return !isFormData && !isUrlSearchParams && !isBlob && !isArrayBuffer;
}

async function readPayload(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export function createApiClient({
  baseUrl,
  fetcher = fetch,
  getAccessToken
}: ApiClientOptions): ApiClient {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');

  return {
    async request<TResponse>(path: string, init: ApiRequestInit = {}) {
      const { body, headers: initHeaders, query, ...requestInit } = init;
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      const requestPath = appendQuery(normalizedPath, query);
      const headers = new Headers(initHeaders);
      const token = getAccessToken?.();
      let requestBody: BodyInit | null | undefined;

      if (token && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      if (isJsonBody(body)) {
        requestBody = JSON.stringify(body);

        if (!headers.has('Content-Type')) {
          headers.set('Content-Type', 'application/json');
        }
      } else {
        requestBody = body as BodyInit | null | undefined;
      }

      const response = await fetcher(`${normalizedBaseUrl}${requestPath}`, {
        ...requestInit,
        body: requestBody,
        headers
      });
      const payload = await readPayload(response);

      if (!response.ok) {
        const errorBody = getErrorBody(payload);
        const message =
          errorBody?.message ?? `Request failed with status ${response.status}`;

        throw new ApiClientError(response.status, message, payload, errorBody?.errors);
      }

      return payload as TResponse;
    }
  };
}

export function createAuthApi(options: ApiClientOptions) {
  const client = createApiClient(options);

  return {
    logout(body: LogoutRequest) {
      return client.request<ApiResponse<{ loggedOut: boolean }>>('/auth/logout', {
        body,
        method: 'POST'
      });
    },
    refresh(body: RefreshTokenRequest) {
      return client.request<ApiResponse<AuthTokens>>('/auth/refresh', {
        body,
        method: 'POST'
      });
    },
    sendOtp(body: SendOtpRequest) {
      return client.request<ApiResponse<{ channel: 'email' | 'mobile' }>>('/auth/send-otp', {
        body,
        method: 'POST'
      });
    },
    verifyOtp(body: VerifyOtpRequest) {
      return client.request<ApiResponse<AuthTokens>>('/auth/verify-otp', {
        body,
        method: 'POST'
      });
    }
  };
}

export function createOrganizationApi(options: ApiClientOptions) {
  const client = createApiClient(options);

  return {
    createCounter(body: CounterInput) {
      return client.request<ApiResponse<Counter>>('/counters', {
        body,
        method: 'POST'
      });
    },
    createHospital(body: HospitalInput) {
      return client.request<ApiResponse<Hospital>>('/hospitals', {
        body,
        method: 'POST'
      });
    },
    createKitchen(body: KitchenInput) {
      return client.request<ApiResponse<Kitchen>>('/kitchens', {
        body,
        method: 'POST'
      });
    },
    createLocation(body: LocationInput) {
      return client.request<ApiResponse<Location>>('/locations', {
        body,
        method: 'POST'
      });
    },
    createRestaurant(body: RestaurantInput) {
      return client.request<ApiResponse<Restaurant>>('/restaurants', {
        body,
        method: 'POST'
      });
    },
    createStore(body: StoreInput) {
      return client.request<ApiResponse<Store>>('/stores', {
        body,
        method: 'POST'
      });
    },
    deleteCounter(id: string) {
      return client.request<ApiResponse<{ id: string }>>(`/counters/${id}`, { method: 'DELETE' });
    },
    deleteHospital(id: string) {
      return client.request<ApiResponse<{ id: string }>>(`/hospitals/${id}`, { method: 'DELETE' });
    },
    deleteKitchen(id: string) {
      return client.request<ApiResponse<{ id: string }>>(`/kitchens/${id}`, { method: 'DELETE' });
    },
    deleteLocation(id: string) {
      return client.request<ApiResponse<{ id: string }>>(`/locations/${id}`, { method: 'DELETE' });
    },
    deleteRestaurant(id: string) {
      return client.request<ApiResponse<{ id: string }>>(`/restaurants/${id}`, {
        method: 'DELETE'
      });
    },
    deleteStore(id: string) {
      return client.request<ApiResponse<{ id: string }>>(`/stores/${id}`, { method: 'DELETE' });
    },
    getCounter(id: string) {
      return client.request<ApiResponse<Counter>>(`/counters/${id}`);
    },
    getHospital(id: string) {
      return client.request<ApiResponse<Hospital>>(`/hospitals/${id}`);
    },
    getKitchen(id: string) {
      return client.request<ApiResponse<Kitchen>>(`/kitchens/${id}`);
    },
    getLocation(id: string) {
      return client.request<ApiResponse<Location>>(`/locations/${id}`);
    },
    getRestaurant(id: string) {
      return client.request<ApiResponse<Restaurant>>(`/restaurants/${id}`);
    },
    getStore(id: string) {
      return client.request<ApiResponse<Store>>(`/stores/${id}`);
    },
    listCounters(query?: CounterListQuery) {
      return client.request<ApiResponse<ApiList<Counter>>>('/counters', { query });
    },
    listHospitals(query?: HospitalListQuery) {
      return client.request<ApiResponse<ApiList<Hospital>>>('/hospitals', { query });
    },
    listKitchens(query?: KitchenListQuery) {
      return client.request<ApiResponse<ApiList<Kitchen>>>('/kitchens', { query });
    },
    listLocations(query?: LocationListQuery) {
      return client.request<ApiResponse<ApiList<Location>>>('/locations', { query });
    },
    listRestaurants(query?: RestaurantListQuery) {
      return client.request<ApiResponse<ApiList<Restaurant>>>('/restaurants', { query });
    },
    listStores(query?: StoreListQuery) {
      return client.request<ApiResponse<ApiList<Store>>>('/stores', { query });
    },
    updateCounter(id: string, body: Partial<CounterInput>) {
      return client.request<ApiResponse<Counter>>(`/counters/${id}`, {
        body,
        method: 'PUT'
      });
    },
    updateHospital(id: string, body: Partial<HospitalInput>) {
      return client.request<ApiResponse<Hospital>>(`/hospitals/${id}`, {
        body,
        method: 'PUT'
      });
    },
    updateKitchen(id: string, body: Partial<KitchenInput>) {
      return client.request<ApiResponse<Kitchen>>(`/kitchens/${id}`, {
        body,
        method: 'PUT'
      });
    },
    updateLocation(id: string, body: Partial<LocationInput>) {
      return client.request<ApiResponse<Location>>(`/locations/${id}`, {
        body,
        method: 'PUT'
      });
    },
    updateRestaurant(id: string, body: Partial<RestaurantInput>) {
      return client.request<ApiResponse<Restaurant>>(`/restaurants/${id}`, {
        body,
        method: 'PUT'
      });
    },
    updateStore(id: string, body: Partial<StoreInput>) {
      return client.request<ApiResponse<Store>>(`/stores/${id}`, {
        body,
        method: 'PUT'
      });
    }
  };
}
