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

export type HospitalSummary = Pick<Hospital, 'hospitalCode' | 'hospitalName' | 'id' | 'isActive'>;

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

export type FoodType = 'VEG' | 'NON_VEG' | 'EGGETARIAN';
export type ItemType = 'MRP' | 'READYMADE' | 'LIVE';

export interface ItemCategory {
  categoryName: string;
  createdAt: string;
  deletedAt: string | null;
  id: string;
  isActive: boolean;
  updatedAt: string;
}

export interface ItemCategoryInput {
  categoryName: string;
  isActive?: boolean;
}

export type ItemCategoryListQuery = ListQuery;

export interface Item {
  category: Pick<ItemCategory, 'categoryName' | 'id' | 'isActive'>;
  categoryId: string;
  createdAt: string;
  deletedAt: string | null;
  hsnCode: string | null;
  id: string;
  isActive: boolean;
  itemCode: string;
  itemName: string;
  itemType: ItemType;
  preparationTimeMinutes: number | null;
  type: FoodType;
  updatedAt: string;
}

export interface ItemInput {
  categoryId: string;
  hsnCode?: string;
  isActive?: boolean;
  itemName: string;
  itemType: ItemType;
  preparationTimeMinutes?: number;
  type: FoodType;
}

export interface ItemListQuery extends ListQuery {
  categoryId?: string;
  itemType?: ItemType;
  type?: FoodType;
}

export interface Employee {
  createdAt: string;
  deletedAt: string | null;
  department: string | null;
  designation: string | null;
  eligibleForDiscount: boolean;
  employeeCode: string;
  employeeName: string;
  id: string;
  isActive: boolean;
  mobile: string | null;
  updatedAt: string;
}

export interface EmployeeInput {
  department?: string;
  designation?: string;
  eligibleForDiscount?: boolean;
  employeeCode: string;
  employeeName: string;
  isActive?: boolean;
  mobile?: string;
}

export interface EmployeeListQuery extends ListQuery {
  eligibleForDiscount?: boolean;
}

export interface EmployeeValidation {
  department: string | null;
  designation: string | null;
  eligibleForDiscount: boolean;
  employeeCode: string;
  employeeId: string;
  employeeName: string;
  isActive: boolean;
  mobile: string | null;
}

export interface TimeSlot {
  createdAt: string;
  deletedAt: string | null;
  endTime: string | null;
  id: string;
  isActive: boolean;
  isAlwaysAvailable: boolean;
  slotName: string;
  startTime: string | null;
  updatedAt: string;
}

export interface TimeSlotInput {
  endTime?: string;
  isActive?: boolean;
  isAlwaysAvailable?: boolean;
  slotName: string;
  startTime?: string;
}

export interface TimeSlotListQuery extends ListQuery {
  isAlwaysAvailable?: boolean;
}

export type ItemSummary = Pick<
  Item,
  'id' | 'isActive' | 'itemCode' | 'itemName' | 'itemType' | 'type'
>;

export interface StoreItem {
  createdAt: string;
  deletedAt: string | null;
  id: string;
  isActive: boolean;
  item: ItemSummary;
  itemId: string;
  store: Pick<Store, 'id' | 'isActive' | 'storeCode' | 'storeName'> & {
    hospital: HospitalSummary;
  };
  storeId: string;
  updatedAt: string;
}

export interface StoreItemInput {
  isActive?: boolean;
  itemId: string;
  storeId: string;
}

export interface StoreItemListQuery extends ListQuery {
  itemId?: string;
  storeId?: string;
}

export interface KitchenItem {
  createdAt: string;
  deletedAt: string | null;
  id: string;
  isActive: boolean;
  item: ItemSummary;
  itemId: string;
  kitchen: Pick<Kitchen, 'id' | 'isActive' | 'kitchenCode' | 'kitchenName'> & {
    hospital: HospitalSummary;
  };
  kitchenId: string;
  updatedAt: string;
}

export interface KitchenItemInput {
  isActive?: boolean;
  itemId: string;
  kitchenId: string;
}

export interface KitchenItemListQuery extends ListQuery {
  itemId?: string;
  kitchenId?: string;
}

export type RestaurantMenuDayOfWeek =
  | 'FRIDAY'
  | 'MONDAY'
  | 'SATURDAY'
  | 'SUNDAY'
  | 'THURSDAY'
  | 'TUESDAY'
  | 'WEDNESDAY';

export type RestaurantMenuPositionType = 'AFTER_ITEM' | 'BEFORE_ITEM' | 'FIRST' | 'LAST';

export interface RestaurantMenu {
  createdAt: string;
  daysOfWeek: RestaurantMenuDayOfWeek[];
  deletedAt: string | null;
  displayOrder: number;
  hospitalId: string;
  id: string;
  isAvailable: boolean;
  item: ItemSummary;
  itemId: string;
  restaurant: Pick<Restaurant, 'id' | 'isActive' | 'restaurantCode' | 'restaurantName'> & {
    hospital: HospitalSummary;
  };
  restaurantId: string;
  timeSlotIds: string[];
  timeSlots: Array<
    Pick<TimeSlot, 'endTime' | 'id' | 'isActive' | 'isAlwaysAvailable' | 'slotName' | 'startTime'>
  >;
  updatedAt: string;
}

export interface RestaurantMenuInput {
  daysOfWeek?: RestaurantMenuDayOfWeek[];
  isAvailable?: boolean;
  itemId: string;
  positionType?: RestaurantMenuPositionType;
  referenceMenuId?: string;
  restaurantId: string;
  timeSlotIds?: string[];
}

export interface RestaurantMenuListQuery extends ListQuery {
  dayOfWeek?: RestaurantMenuDayOfWeek;
  isAvailable?: boolean;
  itemId?: string;
  restaurantId?: string;
  timeSlotId?: string;
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
  const isUrlSearchParams =
    typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams;
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
  getAccessToken,
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
        headers,
      });
      const payload = await readPayload(response);

      if (!response.ok) {
        const errorBody = getErrorBody(payload);
        const message = errorBody?.message ?? `Request failed with status ${response.status}`;

        throw new ApiClientError(response.status, message, payload, errorBody?.errors);
      }

      return payload as TResponse;
    },
  };
}

export function createAuthApi(options: ApiClientOptions) {
  const client = createApiClient(options);

  return {
    logout(body: LogoutRequest) {
      return client.request<ApiResponse<{ loggedOut: boolean }>>('/auth/logout', {
        body,
        method: 'POST',
      });
    },
    refresh(body: RefreshTokenRequest) {
      return client.request<ApiResponse<AuthTokens>>('/auth/refresh', {
        body,
        method: 'POST',
      });
    },
    sendOtp(body: SendOtpRequest) {
      return client.request<ApiResponse<{ channel: 'email' | 'mobile' }>>('/auth/send-otp', {
        body,
        method: 'POST',
      });
    },
    verifyOtp(body: VerifyOtpRequest) {
      return client.request<ApiResponse<AuthTokens>>('/auth/verify-otp', {
        body,
        method: 'POST',
      });
    },
  };
}

export function createOrganizationApi(options: ApiClientOptions) {
  const client = createApiClient(options);

  return {
    createCounter(body: CounterInput) {
      return client.request<ApiResponse<Counter>>('/counters', {
        body,
        method: 'POST',
      });
    },
    createEmployee(body: EmployeeInput) {
      return client.request<ApiResponse<Employee>>('/employees', {
        body,
        method: 'POST',
      });
    },
    createHospital(body: HospitalInput) {
      return client.request<ApiResponse<Hospital>>('/hospitals', {
        body,
        method: 'POST',
      });
    },
    createItem(body: ItemInput) {
      return client.request<ApiResponse<Item>>('/items', {
        body,
        method: 'POST',
      });
    },
    createItemCategory(body: ItemCategoryInput) {
      return client.request<ApiResponse<ItemCategory>>('/item-categories', {
        body,
        method: 'POST',
      });
    },
    createKitchenItem(body: KitchenItemInput) {
      return client.request<ApiResponse<KitchenItem>>('/kitchen-items', {
        body,
        method: 'POST',
      });
    },
    createKitchen(body: KitchenInput) {
      return client.request<ApiResponse<Kitchen>>('/kitchens', {
        body,
        method: 'POST',
      });
    },
    createLocation(body: LocationInput) {
      return client.request<ApiResponse<Location>>('/locations', {
        body,
        method: 'POST',
      });
    },
    createRestaurant(body: RestaurantInput) {
      return client.request<ApiResponse<Restaurant>>('/restaurants', {
        body,
        method: 'POST',
      });
    },
    createRestaurantMenu(body: RestaurantMenuInput) {
      return client.request<ApiResponse<RestaurantMenu>>('/restaurant-menus', {
        body,
        method: 'POST',
      });
    },
    createStore(body: StoreInput) {
      return client.request<ApiResponse<Store>>('/stores', {
        body,
        method: 'POST',
      });
    },
    createStoreItem(body: StoreItemInput) {
      return client.request<ApiResponse<StoreItem>>('/store-items', {
        body,
        method: 'POST',
      });
    },
    createTimeSlot(body: TimeSlotInput) {
      return client.request<ApiResponse<TimeSlot>>('/time-slots', {
        body,
        method: 'POST',
      });
    },
    deleteCounter(id: string) {
      return client.request<ApiResponse<{ id: string }>>(`/counters/${id}`, { method: 'DELETE' });
    },
    deleteEmployee(id: string) {
      return client.request<ApiResponse<{ id: string }>>(`/employees/${id}`, {
        method: 'DELETE',
      });
    },
    deleteHospital(id: string) {
      return client.request<ApiResponse<{ id: string }>>(`/hospitals/${id}`, { method: 'DELETE' });
    },
    deleteItem(id: string) {
      return client.request<ApiResponse<{ id: string }>>(`/items/${id}`, { method: 'DELETE' });
    },
    deleteItemCategory(id: string) {
      return client.request<ApiResponse<{ id: string }>>(`/item-categories/${id}`, {
        method: 'DELETE',
      });
    },
    deleteKitchenItem(id: string) {
      return client.request<ApiResponse<{ id: string }>>(`/kitchen-items/${id}`, {
        method: 'DELETE',
      });
    },
    deleteKitchen(id: string) {
      return client.request<ApiResponse<{ id: string }>>(`/kitchens/${id}`, { method: 'DELETE' });
    },
    deleteLocation(id: string) {
      return client.request<ApiResponse<{ id: string }>>(`/locations/${id}`, { method: 'DELETE' });
    },
    deleteRestaurant(id: string) {
      return client.request<ApiResponse<{ id: string }>>(`/restaurants/${id}`, {
        method: 'DELETE',
      });
    },
    deleteRestaurantMenu(id: string) {
      return client.request<ApiResponse<{ id: string }>>(`/restaurant-menus/${id}`, {
        method: 'DELETE',
      });
    },
    deleteStore(id: string) {
      return client.request<ApiResponse<{ id: string }>>(`/stores/${id}`, { method: 'DELETE' });
    },
    deleteStoreItem(id: string) {
      return client.request<ApiResponse<{ id: string }>>(`/store-items/${id}`, {
        method: 'DELETE',
      });
    },
    deleteTimeSlot(id: string) {
      return client.request<ApiResponse<{ id: string }>>(`/time-slots/${id}`, {
        method: 'DELETE',
      });
    },
    getCounter(id: string) {
      return client.request<ApiResponse<Counter>>(`/counters/${id}`);
    },
    getEmployee(id: string) {
      return client.request<ApiResponse<Employee>>(`/employees/${id}`);
    },
    getHospital(id: string) {
      return client.request<ApiResponse<Hospital>>(`/hospitals/${id}`);
    },
    getItem(id: string) {
      return client.request<ApiResponse<Item>>(`/items/${id}`);
    },
    getItemCategory(id: string) {
      return client.request<ApiResponse<ItemCategory>>(`/item-categories/${id}`);
    },
    getKitchenItem(id: string) {
      return client.request<ApiResponse<KitchenItem>>(`/kitchen-items/${id}`);
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
    getRestaurantMenu(id: string) {
      return client.request<ApiResponse<RestaurantMenu>>(`/restaurant-menus/${id}`);
    },
    getStore(id: string) {
      return client.request<ApiResponse<Store>>(`/stores/${id}`);
    },
    getStoreItem(id: string) {
      return client.request<ApiResponse<StoreItem>>(`/store-items/${id}`);
    },
    getTimeSlot(id: string) {
      return client.request<ApiResponse<TimeSlot>>(`/time-slots/${id}`);
    },
    listCounters(query?: CounterListQuery) {
      return client.request<ApiResponse<ApiList<Counter>>>('/counters', { query });
    },
    listEmployees(query?: EmployeeListQuery) {
      return client.request<ApiResponse<ApiList<Employee>>>('/employees', { query });
    },
    listHospitals(query?: HospitalListQuery) {
      return client.request<ApiResponse<ApiList<Hospital>>>('/hospitals', { query });
    },
    listItemCategories(query?: ItemCategoryListQuery) {
      return client.request<ApiResponse<ApiList<ItemCategory>>>('/item-categories', { query });
    },
    listItems(query?: ItemListQuery) {
      return client.request<ApiResponse<ApiList<Item>>>('/items', { query });
    },
    listKitchenItems(query?: KitchenItemListQuery) {
      return client.request<ApiResponse<ApiList<KitchenItem>>>('/kitchen-items', { query });
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
    listRestaurantMenus(query?: RestaurantMenuListQuery) {
      return client.request<ApiResponse<ApiList<RestaurantMenu>>>('/restaurant-menus', { query });
    },
    listStoreItems(query?: StoreItemListQuery) {
      return client.request<ApiResponse<ApiList<StoreItem>>>('/store-items', { query });
    },
    listStores(query?: StoreListQuery) {
      return client.request<ApiResponse<ApiList<Store>>>('/stores', { query });
    },
    listTimeSlots(query?: TimeSlotListQuery) {
      return client.request<ApiResponse<ApiList<TimeSlot>>>('/time-slots', { query });
    },
    updateCounter(id: string, body: Partial<CounterInput>) {
      return client.request<ApiResponse<Counter>>(`/counters/${id}`, {
        body,
        method: 'PUT',
      });
    },
    updateEmployee(id: string, body: Partial<EmployeeInput>) {
      return client.request<ApiResponse<Employee>>(`/employees/${id}`, {
        body,
        method: 'PUT',
      });
    },
    updateHospital(id: string, body: Partial<HospitalInput>) {
      return client.request<ApiResponse<Hospital>>(`/hospitals/${id}`, {
        body,
        method: 'PUT',
      });
    },
    updateItem(id: string, body: Partial<ItemInput>) {
      return client.request<ApiResponse<Item>>(`/items/${id}`, {
        body,
        method: 'PUT',
      });
    },
    updateItemCategory(id: string, body: Partial<ItemCategoryInput>) {
      return client.request<ApiResponse<ItemCategory>>(`/item-categories/${id}`, {
        body,
        method: 'PUT',
      });
    },
    updateKitchenItem(id: string, body: Partial<KitchenItemInput>) {
      return client.request<ApiResponse<KitchenItem>>(`/kitchen-items/${id}`, {
        body,
        method: 'PUT',
      });
    },
    updateKitchen(id: string, body: Partial<KitchenInput>) {
      return client.request<ApiResponse<Kitchen>>(`/kitchens/${id}`, {
        body,
        method: 'PUT',
      });
    },
    updateLocation(id: string, body: Partial<LocationInput>) {
      return client.request<ApiResponse<Location>>(`/locations/${id}`, {
        body,
        method: 'PUT',
      });
    },
    updateRestaurant(id: string, body: Partial<RestaurantInput>) {
      return client.request<ApiResponse<Restaurant>>(`/restaurants/${id}`, {
        body,
        method: 'PUT',
      });
    },
    updateRestaurantMenu(id: string, body: Partial<RestaurantMenuInput>) {
      return client.request<ApiResponse<RestaurantMenu>>(`/restaurant-menus/${id}`, {
        body,
        method: 'PUT',
      });
    },
    updateStore(id: string, body: Partial<StoreInput>) {
      return client.request<ApiResponse<Store>>(`/stores/${id}`, {
        body,
        method: 'PUT',
      });
    },
    updateStoreItem(id: string, body: Partial<StoreItemInput>) {
      return client.request<ApiResponse<StoreItem>>(`/store-items/${id}`, {
        body,
        method: 'PUT',
      });
    },
    updateTimeSlot(id: string, body: Partial<TimeSlotInput>) {
      return client.request<ApiResponse<TimeSlot>>(`/time-slots/${id}`, {
        body,
        method: 'PUT',
      });
    },
    validateEmployee(employeeCode: string) {
      return client.request<ApiResponse<EmployeeValidation>>(
        `/employees/validate/${encodeURIComponent(employeeCode)}`,
      );
    },
  };
}
