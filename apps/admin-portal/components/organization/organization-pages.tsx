'use client';

import { Button } from '@aahar/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  ArrowLeft,
  ArrowRightLeft,
  Building2,
  ChefHat,
  ClipboardList,
  CreditCard,
  Eye,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  PackageOpen,
  QrCode,
  RefreshCw,
  Search,
  Store,
  Trash2,
  Utensils,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useEffect,
  useState,
  type ChangeEvent,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { useForm, type FieldValues, type Path, type UseFormReturn } from 'react-hook-form';
import { z, type ZodError } from 'zod';
import type {
  ApiList,
  ApiResponse,
  Counter,
  CounterInput,
  Hospital as HospitalRecord,
  HospitalInput,
  Kitchen,
  KitchenInput,
  ListQuery,
  Location,
  LocationInput,
  OnlinePaymentOption,
  Restaurant,
  RestaurantInput,
  SortOrder,
  Store as StoreRecord,
  StoreInput,
} from '@aahar/api-client';
import {
  AppPageHeader,
  ChartCard,
  EmptyState,
  KpiCard,
  LoadingSkeleton,
  MetricTile,
  StatusBadge as DesignStatusBadge,
} from '@/components/design-system';
import { useToast } from '@/components/toast-provider';
import { Badge, Field, FieldError, Input, Label, Panel, Select, Skeleton } from '@/components/ui';
import { getApiErrorMessage, organizationApi } from '@/lib/api';
import { getCitiesForState, INDIAN_STATES } from '@/lib/india-locations';
import { cn } from '@/lib/utils';

const listLimit = 10;
const skeletonRows = ['row-1', 'row-2', 'row-3', 'row-4', 'row-5'];
const restaurantImageMaxSizeBytes = 5 * 1024 * 1024;
const restaurantImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const optionalText = (maxLength: number) =>
  z.string().trim().max(maxLength, `Use ${maxLength} characters or fewer.`);
const optionalEmail = z
  .string()
  .trim()
  .max(255, 'Use 255 characters or fewer.')
  .refine((value) => !value || z.string().email().safeParse(value).success, {
    message: 'Enter a valid email address.',
  });
const postalCodeSchema = z
  .string()
  .trim()
  .max(6, 'Postal code must be 6 digits.')
  .refine((value) => !value || /^\d{6}$/.test(value), {
    message: 'Postal code must be 6 digits.',
  });
const onlinePaymentOptions: Array<{ label: string; value: OnlinePaymentOption }> = [
  { label: 'None', value: 'NONE' },
  { label: 'PayU', value: 'PAYU' },
  { label: 'RazorPay', value: 'RAZORPAY' },
];
const freezeServicesMessage =
  'Turning this off will freeze related services. Existing records will remain visible. Continue?';
const inactiveLocationMessage =
  'This Location is inactive. Services for this Location are currently frozen.';

const hospitalSchema = z.object({
  address: z.string().trim().min(1, 'Address is required.').max(500),
  area: optionalText(50),
  city: z.string().trim().min(1, 'City is required.').max(100),
  displayName: z.string().trim().min(1, 'Display name is required.').max(255),
  invoicePrefix: optionalText(50),
  ipAddress: optionalText(100),
  isActive: z.boolean(),
  latitude: optionalText(50),
  locationCode: z.string().trim().min(1, 'Location code is required.').max(50),
  longitude: optionalText(50),
  onlinePaymentOption: z.enum(['NONE', 'PAYU', 'RAZORPAY']),
  postalCode: postalCodeSchema,
  state: z.string().trim().min(1, 'State is required.').max(100),
  title: z.string().trim().min(1, 'Title is required.').max(255),
  visitingCardAddress: optionalText(500),
});

const locationSchema = z.object({
  address: optionalText(255),
  area: optionalText(100),
  building: optionalText(100),
  floor: optionalText(50),
  hospitalId: z.string().uuid('Select a location.'),
  isActive: z.boolean(),
  locationName: z.string().trim().min(1, 'Location name is required.').max(150),
});

const storeSchema = z.object({
  hospitalId: z.string().uuid('Select a location.'),
  isActive: z.boolean(),
  storeName: z.string().trim().min(1, 'Store name is required.').max(150),
});

const kitchenSchema = z.object({
  hospitalId: z.string().uuid('Select a location.'),
  isActive: z.boolean(),
  kitchenName: z.string().trim().min(1, 'Kitchen name is required.').max(150),
});

const restaurantSchema = z.object({
  accountNumber: optionalText(100),
  address: optionalText(255),
  bankNameBranch: optionalText(255),
  email: optionalEmail,
  fssaiNumbers: optionalText(500),
  gstNumber: optionalText(50),
  hospitalId: z.string().uuid('Select a location.'),
  ifscCode: optionalText(50),
  isAtTableDiningEnabled: z.boolean(),
  isDeliveryEnabled: z.boolean(),
  isHomeDeliveryEnabled: z.boolean(),
  isInCarDiningEnabled: z.boolean(),
  isInRoomDiningEnabled: z.boolean(),
  isInventoryEnabled: z.boolean(),
  isOffline: z.boolean(),
  isOnlineOrdersEnabled: z.boolean(),
  isOpen24x7: z.boolean(),
  isPosOrdersEnabled: z.boolean(),
  isRegisteredInGst: z.boolean(),
  isTakeawayEnabled: z.boolean(),
  isVegOnly: z.boolean(),
  isActive: z.boolean(),
  legalName: optionalText(255),
  mobile: optionalText(30),
  panNumber: optionalText(50),
  restaurantName: z.string().trim().min(1, 'Restaurant name is required.').max(150),
  sodexoMid: optionalText(100),
  sodexoTid: optionalText(100),
  sunBu: optionalText(100),
  sunT1: optionalText(100),
  sunT2: optionalText(100),
  unitNameForQr: optionalText(255),
  upiId: optionalText(255),
});

const counterSchema = z.object({
  counterCode: z.string().trim().min(1, 'Counter code is required.').max(50),
  counterName: z.string().trim().min(1, 'Counter name is required.').max(150),
  hospitalId: z.string().uuid('Select a location.'),
  isActive: z.boolean(),
  paymentDeviceId: optionalText(100),
  pineLabsDeviceId: optionalText(100),
  posDeviceId: optionalText(100),
  restaurantId: z.string().uuid('Select a restaurant.'),
});

type ActiveFilter = '' | 'active' | 'inactive';
type BadgeVariant = 'danger' | 'info' | 'neutral' | 'success' | 'warning';
type OnlinePaymentFilter = '' | OnlinePaymentOption;
type LocationDisplaySource = Pick<
  HospitalRecord,
  'hospitalCode' | 'hospitalName' | 'id' | 'isActive'
> &
  Partial<
    Pick<
      HospitalRecord,
      | 'billPrefix'
      | 'city'
      | 'displayName'
      | 'invoicePrefix'
      | 'locationCode'
      | 'postalCode'
      | 'state'
      | 'title'
    >
  >;
type RestaurantOptionBadge = {
  label: string;
  variant: BadgeVariant;
};
type HospitalFormValues = z.infer<typeof hospitalSchema>;
type LocationFormValues = z.infer<typeof locationSchema>;
type StoreFormValues = z.infer<typeof storeSchema>;
type KitchenFormValues = z.infer<typeof kitchenSchema>;
type RestaurantFormValues = z.infer<typeof restaurantSchema>;
type CounterFormValues = z.infer<typeof counterSchema>;

interface PageHeaderProps {
  action?: ReactNode;
  eyebrow: string;
  icon: LucideIcon;
  subtitle?: string;
  title: string;
}

interface EntityColumn<TItem> {
  className?: string;
  header: string;
  render: (item: TItem) => ReactNode;
}

interface EntityListConfig<TItem extends { id: string; isActive: boolean; updatedAt: string }> {
  columns: EntityColumn<TItem>[];
  createHref: string;
  createLabel?: string;
  entityKey: string;
  emptyLabel: string;
  icon: LucideIcon;
  list: (query: ListQuery) => Promise<ApiResponse<ApiList<TItem>>>;
  sortOptions: Array<{ label: string; value: string }>;
  subtitle: string;
  title: string;
}

interface PaginationControlsProps {
  limit: number;
  onPageChange: (page: number) => void;
  page: number;
  total: number;
  totalPages: number;
}

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function activeFilterToBoolean(value: ActiveFilter): boolean | undefined {
  if (value === 'active') {
    return true;
  }

  if (value === 'inactive') {
    return false;
  }

  return undefined;
}

function applyValidationErrors<TFormValues extends FieldValues>(
  form: UseFormReturn<TFormValues>,
  error: ZodError,
) {
  form.clearErrors();

  error.issues.forEach((issue) => {
    const fieldName = issue.path[0];

    if (typeof fieldName === 'string') {
      form.setError(fieldName as Path<TFormValues>, {
        message: issue.message,
      });
    }
  });
}

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

function optionalValue(value: string | undefined): string | undefined {
  const trimmedValue = value?.trim();

  return trimmedValue ? trimmedValue : undefined;
}

function getLocationTitle(hospital: LocationDisplaySource): string {
  return hospital.title ?? hospital.hospitalName;
}

function getLocationCode(hospital: LocationDisplaySource): string {
  return hospital.locationCode ?? hospital.hospitalCode;
}

function getLocationDisplayName(hospital: LocationDisplaySource): string {
  return hospital.displayName ?? getLocationTitle(hospital);
}

function getLocationInvoicePrefix(hospital: LocationDisplaySource): string | null {
  return hospital.invoicePrefix ?? hospital.billPrefix ?? null;
}

function getLocationPostalCode(hospital: LocationDisplaySource): string | null {
  return hospital.postalCode ?? null;
}

function formatLocationOption(hospital: LocationDisplaySource): string {
  const code = getLocationCode(hospital);
  const stateAndPostal = [hospital.state, getLocationPostalCode(hospital)]
    .filter(Boolean)
    .join('-');
  const locationDetails = [hospital.city, stateAndPostal || undefined].filter(Boolean).join(', ');

  return `${code} - ${getLocationTitle(hospital)}${
    locationDetails ? `, ${locationDetails}` : ''
  } (${code})`;
}

function formatRestaurantLocationDisplay(hospital: LocationDisplaySource | null | undefined): string {
  if (!hospital) {
    return 'Location not set';
  }

  const code = getLocationCode(hospital);
  const stateAndPostal = [hospital.state, getLocationPostalCode(hospital)]
    .filter(Boolean)
    .join('-');
  const locationDetails = [hospital.city, stateAndPostal || undefined].filter(Boolean).join(', ');
  const primaryText = [code, getLocationDisplayName(hospital)].filter(Boolean).join(' - ');

  return [primaryText, locationDetails || undefined].filter(Boolean).join(', ') || 'Location not set';
}

function toHospitalFormDefaults(hospital?: HospitalRecord): HospitalFormValues {
  return {
    address: hospital?.address ?? '',
    area: hospital?.area ?? '',
    city: hospital?.city ?? '',
    displayName: hospital ? getLocationDisplayName(hospital) : '',
    invoicePrefix: hospital ? getLocationInvoicePrefix(hospital) ?? '' : '',
    ipAddress: hospital?.ipAddress ?? '',
    isActive: hospital?.isActive ?? true,
    latitude: hospital?.latitude ?? '',
    locationCode: hospital ? getLocationCode(hospital) : '',
    longitude: hospital?.longitude ?? '',
    onlinePaymentOption: hospital?.onlinePaymentOption ?? 'NONE',
    postalCode: hospital ? getLocationPostalCode(hospital) ?? '' : '',
    state: hospital?.state ?? '',
    title: hospital ? getLocationTitle(hospital) : '',
    visitingCardAddress: hospital?.visitingCardAddress ?? '',
  };
}

function toHospitalInput(values: HospitalFormValues): HospitalInput {
  const invoicePrefix = optionalValue(values.invoicePrefix);
  const locationCode = values.locationCode.trim();
  const title = values.title.trim();

  return {
    address: values.address.trim(),
    area: optionalValue(values.area),
    billPrefix: invoicePrefix,
    city: values.city.trim(),
    displayName: values.displayName.trim(),
    hospitalCode: locationCode,
    hospitalName: title,
    invoicePrefix,
    ipAddress: optionalValue(values.ipAddress),
    isActive: values.isActive,
    latitude: optionalValue(values.latitude),
    locationCode,
    longitude: optionalValue(values.longitude),
    onlinePaymentOption: values.onlinePaymentOption,
    postalCode: optionalValue(values.postalCode),
    state: values.state.trim(),
    title,
    visitingCardAddress: optionalValue(values.visitingCardAddress),
  };
}

function isUuid(value: string | undefined): boolean {
  return z.string().uuid().safeParse(value).success;
}

function formatRestaurantLocationOption(hospital: HospitalRecord): string {
  return formatLocationOption(hospital);
}

function hasRequiredText(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function nullableText(value: string | null | undefined): string {
  return value || 'Not set';
}

function isRestaurantOnline(restaurant: Restaurant): boolean {
  return (
    restaurant.isOnlineOrdersEnabled ||
    restaurant.onlineOrders ||
    restaurant.onlineOrderingEnabled
  );
}

function getRestaurantOptionBadges(restaurant: Restaurant): RestaurantOptionBadge[] {
  const badges: RestaurantOptionBadge[] = [
    {
      label: restaurant.isActive ? 'Active' : 'Inactive',
      variant: restaurant.isActive ? 'success' : 'danger',
    },
  ];
  const enabledOptions: Array<RestaurantOptionBadge & { enabled: boolean }> = [
    { enabled: isRestaurantOnline(restaurant), label: 'Online', variant: 'info' },
    {
      enabled: restaurant.isOpen24x7 || restaurant.open24x7,
      label: 'Open 24x7',
      variant: 'info',
    },
    {
      enabled: restaurant.isInRoomDiningEnabled || restaurant.inRoomDining || restaurant.inRoomDiningEnabled,
      label: 'In Room Dining',
      variant: 'neutral',
    },
    {
      enabled: restaurant.isPosOrdersEnabled || restaurant.posOrders,
      label: 'POS Orders',
      variant: 'neutral',
    },
    {
      enabled: restaurant.isInventoryEnabled || restaurant.inventory,
      label: 'Inventory',
      variant: 'neutral',
    },
    {
      enabled: restaurant.isVegOnly || restaurant.vegOnly,
      label: 'Veg Only',
      variant: 'success',
    },
    {
      enabled: restaurant.isTakeawayEnabled || restaurant.takeaway,
      label: 'Takeaway',
      variant: 'neutral',
    },
    {
      enabled: restaurant.isDeliveryEnabled || restaurant.delivery,
      label: 'Delivery',
      variant: 'neutral',
    },
    {
      enabled: restaurant.isHomeDeliveryEnabled || restaurant.homeDelivery,
      label: 'Home Delivery',
      variant: 'neutral',
    },
    {
      enabled: restaurant.isAtTableDiningEnabled || restaurant.atTableDining,
      label: 'At Table Dining',
      variant: 'neutral',
    },
    {
      enabled: restaurant.isInCarDiningEnabled || restaurant.inCarDining,
      label: 'In Car Dining',
      variant: 'neutral',
    },
    {
      enabled: restaurant.isOffline || restaurant.offline,
      label: 'Offline',
      variant: 'warning',
    },
  ];

  badges.push(
    ...enabledOptions
      .filter((option) => option.enabled)
      .map(({ enabled: _enabled, ...option }) => option),
  );

  return badges;
}

function getRestaurantImageError(file: File): string | undefined {
  if (!restaurantImageTypes.includes(file.type)) {
    return 'Choose a JPG, PNG, or WEBP image.';
  }

  if (file.size > restaurantImageMaxSizeBytes) {
    return 'Image must be 5MB or smaller.';
  }

  return undefined;
}

function isObjectUrl(value: string | undefined): value is string {
  return Boolean(value?.startsWith('blob:'));
}

async function uploadRestaurantImage(file: File): Promise<string> {
  const formData = new FormData();

  formData.append('file', file);

  const response = await fetch('/api/uploads/restaurant-images', {
    body: formData,
    method: 'POST',
  });
  const body = (await response.json().catch(() => null)) as { message?: string; url?: string } | null;

  if (!response.ok || !body?.url) {
    throw new Error(body?.message ?? 'Unable to upload image.');
  }

  return body.url;
}

const restaurantFormDefaultValues: RestaurantFormValues = {
  accountNumber: '',
  address: '',
  bankNameBranch: '',
  email: '',
  fssaiNumbers: '',
  gstNumber: '',
  hospitalId: '',
  ifscCode: '',
  isAtTableDiningEnabled: false,
  isDeliveryEnabled: false,
  isHomeDeliveryEnabled: false,
  isInCarDiningEnabled: false,
  isInRoomDiningEnabled: false,
  isInventoryEnabled: false,
  isOffline: false,
  isOnlineOrdersEnabled: false,
  isOpen24x7: false,
  isPosOrdersEnabled: false,
  isRegisteredInGst: false,
  isTakeawayEnabled: false,
  isVegOnly: false,
  isActive: true,
  legalName: '',
  mobile: '',
  panNumber: '',
  restaurantName: '',
  sodexoMid: '',
  sodexoTid: '',
  sunBu: '',
  sunT1: '',
  sunT2: '',
  unitNameForQr: '',
  upiId: '',
};

function toRestaurantFormDefaults(restaurant?: Restaurant): RestaurantFormValues {
  if (!restaurant) {
    return { ...restaurantFormDefaultValues };
  }

  return {
    accountNumber: restaurant.accountNumber ?? '',
    address: restaurant.gstAddress ?? restaurant.address ?? '',
    bankNameBranch: restaurant.bankNameBranch ?? restaurant.bankName ?? '',
    email: restaurant.email ?? '',
    fssaiNumbers: restaurant.fssaiNumbers ?? restaurant.fssaiNumber ?? '',
    gstNumber: restaurant.gstNumber ?? '',
    hospitalId: restaurant.hospitalId,
    ifscCode: restaurant.ifscCode ?? '',
    isActive: restaurant.isActive,
    isAtTableDiningEnabled: restaurant.isAtTableDiningEnabled ?? restaurant.atTableDining,
    isDeliveryEnabled: restaurant.isDeliveryEnabled ?? restaurant.delivery,
    isHomeDeliveryEnabled: restaurant.isHomeDeliveryEnabled ?? restaurant.homeDelivery,
    isInCarDiningEnabled: restaurant.isInCarDiningEnabled ?? restaurant.inCarDining,
    isInRoomDiningEnabled: restaurant.isInRoomDiningEnabled ?? restaurant.inRoomDiningEnabled,
    isInventoryEnabled: restaurant.isInventoryEnabled ?? restaurant.inventory,
    isOffline: restaurant.isOffline ?? restaurant.offline,
    isOnlineOrdersEnabled: isRestaurantOnline(restaurant),
    isOpen24x7: restaurant.isOpen24x7 ?? restaurant.open24x7,
    isPosOrdersEnabled: restaurant.isPosOrdersEnabled ?? restaurant.posOrders,
    isRegisteredInGst: restaurant.isRegisteredInGst,
    isTakeawayEnabled: restaurant.isTakeawayEnabled ?? restaurant.takeaway,
    isVegOnly: restaurant.isVegOnly ?? restaurant.vegOnly,
    legalName: restaurant.legalName ?? '',
    mobile: restaurant.mobile ?? '',
    panNumber: restaurant.panNumber ?? '',
    restaurantName: restaurant.restaurantName,
    sodexoMid: restaurant.sodexoMid ?? '',
    sodexoTid: restaurant.sodexoTid ?? '',
    sunBu: restaurant.sunBu ?? '',
    sunT1: restaurant.sunT1 ?? '',
    sunT2: restaurant.sunT2 ?? '',
    unitNameForQr: restaurant.unitNameForQr ?? restaurant.qrUnitName ?? '',
    upiId: restaurant.upiId ?? '',
  };
}

function toRestaurantInput(
  values: RestaurantFormValues,
  imageUrls: { coverImageUrl?: string; thumbnailUrl?: string } = {},
): RestaurantInput {
  const address = optionalValue(values.address);

  return {
    accountNumber: optionalValue(values.accountNumber),
    address,
    bankNameBranch: optionalValue(values.bankNameBranch),
    coverImageUrl: imageUrls.coverImageUrl,
    email: optionalValue(values.email),
    fssaiNumbers: optionalValue(values.fssaiNumbers),
    gstAddress: address,
    gstNumber: optionalValue(values.gstNumber),
    hospitalId: values.hospitalId,
    ifscCode: optionalValue(values.ifscCode),
    isActive: values.isActive,
    isAtTableDiningEnabled: values.isAtTableDiningEnabled,
    isDeliveryEnabled: values.isDeliveryEnabled,
    isHomeDeliveryEnabled: values.isHomeDeliveryEnabled,
    isInCarDiningEnabled: values.isInCarDiningEnabled,
    isInRoomDiningEnabled: values.isInRoomDiningEnabled,
    isInventoryEnabled: values.isInventoryEnabled,
    isOffline: values.isOffline,
    isOnlineOrdersEnabled: values.isOnlineOrdersEnabled,
    isOpen24x7: values.isOpen24x7,
    isPosOrdersEnabled: values.isPosOrdersEnabled,
    isRegisteredInGst: values.isRegisteredInGst,
    isTakeawayEnabled: values.isTakeawayEnabled,
    isVegOnly: values.isVegOnly,
    legalName: optionalValue(values.legalName),
    mobile: optionalValue(values.mobile),
    panNumber: optionalValue(values.panNumber),
    restaurantName: values.restaurantName.trim(),
    sodexoMid: optionalValue(values.sodexoMid),
    sodexoTid: optionalValue(values.sodexoTid),
    sunBu: optionalValue(values.sunBu),
    sunT1: optionalValue(values.sunT1),
    sunT2: optionalValue(values.sunT2),
    thumbnailUrl: imageUrls.thumbnailUrl,
    unitNameForQr: optionalValue(values.unitNameForQr),
    upiId: optionalValue(values.upiId),
  };
}

function StatusBadge({ isActive }: Readonly<{ isActive: boolean }>) {
  return (
    <Badge variant={isActive ? 'success' : 'danger'}>{isActive ? 'Active' : 'Inactive'}</Badge>
  );
}

function PageHeader({ action, eyebrow, icon: Icon, subtitle, title }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700 ring-1 ring-teal-100">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-teal-700">{eyebrow}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      {action ? <div className="flex shrink-0">{action}</div> : null}
    </div>
  );
}

function ToolbarGrid({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="grid gap-3 border-b p-4 md:grid-cols-[minmax(0,1fr)_160px_180px_130px_auto]">
      {children}
    </div>
  );
}

function FlexibleToolbar({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="grid gap-3 border-b p-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_150px_170px_170px_170px_150px_130px_auto]">
      {children}
    </div>
  );
}

function StatusToggleButton({
  disabled,
  isActive,
  onToggle,
}: Readonly<{
  disabled: boolean;
  isActive: boolean;
  onToggle: () => void;
}>) {
  return (
    <button
      aria-checked={isActive}
      aria-label={isActive ? 'Set inactive' : 'Set active'}
      className={cn(
        'inline-flex h-7 w-12 items-center rounded-full border p-1 transition focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:opacity-60',
        isActive
          ? 'border-teal-500 bg-teal-500'
          : 'border-slate-300 bg-slate-200 dark:border-slate-700 dark:bg-slate-800',
      )}
      disabled={disabled}
      onClick={onToggle}
      role="switch"
      type="button"
    >
      <span
        className={cn(
          'h-5 w-5 rounded-full bg-white shadow-sm transition',
          isActive ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  );
}

function StatusToggleCell({
  disabled,
  isActive,
  onToggle,
  showFrozenMessage,
}: Readonly<{
  disabled: boolean;
  isActive: boolean;
  onToggle: () => void;
  showFrozenMessage?: boolean;
}>) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <StatusBadge isActive={isActive} />
        <StatusToggleButton disabled={disabled} isActive={isActive} onToggle={onToggle} />
      </div>
      {showFrozenMessage ? (
        <p className="max-w-xs text-xs font-medium text-amber-700">{inactiveLocationMessage}</p>
      ) : null}
    </div>
  );
}

function SearchInput({
  onChange,
  value,
}: Readonly<{
  onChange: (value: string) => void;
  value: string;
}>) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        className="pl-9"
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search"
        type="search"
        value={value}
      />
    </div>
  );
}

function ActiveFilterSelect({
  onChange,
  value,
}: Readonly<{
  onChange: (value: ActiveFilter) => void;
  value: ActiveFilter;
}>) {
  return (
    <Select onChange={(event) => onChange(event.target.value as ActiveFilter)} value={value}>
      <option value="">All status</option>
      <option value="active">Active</option>
      <option value="inactive">Inactive</option>
    </Select>
  );
}

function SortOrderSelect({
  onChange,
  value,
}: Readonly<{
  onChange: (value: SortOrder) => void;
  value: SortOrder;
}>) {
  return (
    <Select onChange={(event) => onChange(event.target.value as SortOrder)} value={value}>
      <option value="desc">Newest first</option>
      <option value="asc">Oldest first</option>
    </Select>
  );
}

function QueryState({
  colSpan,
  error,
  isError,
  isLoading,
  label,
}: Readonly<{
  colSpan: number;
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  label: string;
}>) {
  if (isLoading) {
    return (
      <>
        {skeletonRows.map((row) => (
          <tr key={row}>
            <td className="px-4 py-4" colSpan={colSpan}>
              <Skeleton className="h-8 w-full" />
            </td>
          </tr>
        ))}
      </>
    );
  }

  if (isError) {
    return (
      <tr>
        <td className="px-4 py-12 text-center text-sm text-red-600" colSpan={colSpan}>
          {getApiErrorMessage(error)}
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="px-4 py-12 text-center" colSpan={colSpan}>
        <div className="mx-auto max-w-sm">
          <p className="text-sm font-semibold text-slate-900">No {label} found</p>
          <p className="mt-1 text-sm text-slate-500">Create a record or adjust the filters.</p>
        </div>
      </td>
    </tr>
  );
}

function PaginationControls({
  limit,
  onPageChange,
  page,
  total,
  totalPages,
}: PaginationControlsProps) {
  const safeTotalPages = Math.max(totalPages, 1);

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
      <span>
        Page {page} of {safeTotalPages} - {total} records - {limit} per page
      </span>
      <div className="flex gap-2">
        <Button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          size="sm"
          type="button"
          variant="outline"
        >
          Previous
        </Button>
        <Button
          disabled={page >= safeTotalPages}
          onClick={() => onPageChange(page + 1)}
          size="sm"
          type="button"
          variant="outline"
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function FormShell({
  backHref,
  children,
  icon,
  subtitle,
  title,
}: Readonly<{
  backHref: string;
  children: ReactNode;
  icon: LucideIcon;
  subtitle: string;
  title: string;
}>) {
  const Icon = icon;

  return (
    <section className="mx-auto max-w-4xl space-y-6">
      <Button asChild variant="ghost">
        <Link href={backHref}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </Button>
      <PageHeader eyebrow="Organization" icon={Icon} subtitle={subtitle} title={title} />
      <Panel className="p-5 sm:p-6">{children}</Panel>
    </section>
  );
}

function SectionHeading({ title }: Readonly<{ title: string }>) {
  return <h2 className="text-sm font-semibold uppercase tracking-normal text-teal-700">{title}</h2>;
}

function SubmitButton({
  disabled = false,
  isPending,
  label,
}: Readonly<{
  disabled?: boolean;
  isPending: boolean;
  label: string;
}>) {
  return (
    <Button
      className="bg-teal-600 hover:bg-teal-700"
      disabled={disabled || isPending}
      type="submit"
    >
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
      {label}
    </Button>
  );
}

function FormWarning({
  isVisible,
  message,
}: Readonly<{
  isVisible: boolean;
  message: string;
}>) {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
      {message}
    </div>
  );
}

function CheckboxLine({
  children,
  input,
}: Readonly<{
  children: ReactNode;
  input: ReactNode;
}>) {
  return (
    <label className="flex min-h-10 items-center gap-3 rounded-md border bg-white px-3 text-sm font-medium text-slate-700 shadow-sm">
      {input}
      {children}
    </label>
  );
}

function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-28 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm shadow-slate-900/5 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100',
        className,
      )}
      {...props}
    />
  );
}

function LocationMasterFormFields({
  disabled = false,
  form,
}: Readonly<{
  disabled?: boolean;
  form: UseFormReturn<HospitalFormValues>;
}>) {
  const selectedState = form.watch('state');
  const selectedCity = form.watch('city');
  const cityOptions = getCitiesForState(selectedState);

  useEffect(() => {
    if (selectedCity && cityOptions.length > 0 && !cityOptions.includes(selectedCity)) {
      form.setValue('city', '');
    }
  }, [cityOptions, form, selectedCity]);

  return (
    <div className="grid gap-6">
      <SectionHeading title="Add/Update Location" />
      <div className="grid gap-5 md:grid-cols-2">
        <Field error={form.formState.errors.title?.message} label="Title" name="location-title">
          <Input disabled={disabled} id="location-title" {...form.register('title')} />
        </Field>
        <Field
          error={form.formState.errors.locationCode?.message}
          label="Location Code"
          name="location-code"
        >
          <Input
            disabled={disabled}
            id="location-code"
            placeholder="DEL-01"
            {...form.register('locationCode')}
          />
        </Field>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <Field
          error={form.formState.errors.displayName?.message}
          label="Display Name"
          name="location-display-name"
        >
          <Input disabled={disabled} id="location-display-name" {...form.register('displayName')} />
        </Field>
        <Field
          error={form.formState.errors.invoicePrefix?.message}
          label="Invoice Prefix"
          name="location-invoice-prefix"
        >
          <Input
            disabled={disabled}
            id="location-invoice-prefix"
            placeholder="eg. MAX-LKO or INV-LKO"
            {...form.register('invoicePrefix')}
          />
        </Field>
      </div>
      <Field error={form.formState.errors.address?.message} label="Address" name="location-address">
        <Textarea disabled={disabled} id="location-address" {...form.register('address')} />
      </Field>
      <div className="grid gap-5 md:grid-cols-3">
        <Field error={form.formState.errors.state?.message} label="State" name="location-state">
          <Select disabled={disabled} id="location-state" {...form.register('state')}>
            <option value="">Select state</option>
            {INDIAN_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </Select>
        </Field>
        <Field error={form.formState.errors.city?.message} label="City" name="location-city">
          <Select disabled={disabled || !selectedState} id="location-city" {...form.register('city')}>
            <option value="">Select city</option>
            {cityOptions.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          error={form.formState.errors.postalCode?.message}
          label="Postal Code"
          name="location-postal-code"
        >
          <Input
            disabled={disabled}
            id="location-postal-code"
            inputMode="numeric"
            maxLength={6}
            placeholder="226010"
            {...form.register('postalCode')}
          />
        </Field>
      </div>
      <div className="grid gap-5 md:grid-cols-4">
        <Field error={form.formState.errors.latitude?.message} label="Latitude" name="latitude">
          <Input disabled={disabled} id="latitude" {...form.register('latitude')} />
        </Field>
        <Field error={form.formState.errors.longitude?.message} label="Longitude" name="longitude">
          <Input disabled={disabled} id="longitude" {...form.register('longitude')} />
        </Field>
        <Field error={form.formState.errors.area?.message} label="Area" name="location-area">
          <Input disabled={disabled} id="location-area" placeholder="0" {...form.register('area')} />
        </Field>
        <Field
          error={form.formState.errors.ipAddress?.message}
          label="IP Address"
          name="location-ip-address"
        >
          <Input disabled={disabled} id="location-ip-address" {...form.register('ipAddress')} />
        </Field>
      </div>
      <Field
        error={form.formState.errors.visitingCardAddress?.message}
        label="Address for Visiting Card"
        name="visiting-card-address"
      >
        <Textarea
          disabled={disabled}
          id="visiting-card-address"
          {...form.register('visitingCardAddress')}
        />
      </Field>
      <div className="space-y-3">
        <Label className="block" htmlFor="online-payment-option">
          Online Payment Option
        </Label>
        <div className="grid gap-3 sm:grid-cols-3" id="online-payment-option">
          {onlinePaymentOptions.map((option) => (
            <CheckboxLine
              input={
                <input
                  className="h-4 w-4"
                  disabled={disabled}
                  type="radio"
                  value={option.value}
                  {...form.register('onlinePaymentOption')}
                />
              }
              key={option.value}
            >
              {option.label}
            </CheckboxLine>
          ))}
        </div>
        <FieldError>{form.formState.errors.onlinePaymentOption?.message}</FieldError>
      </div>
      <CheckboxLine
        input={<input className="h-4 w-4" disabled={disabled} type="checkbox" {...form.register('isActive')} />}
      >
        Active
      </CheckboxLine>
    </div>
  );
}

function ImageUploadField({
  error,
  id,
  label,
  onChange,
  previewUrl,
}: Readonly<{
  error?: string;
  id: string;
  label: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  previewUrl?: string;
}>) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-800" htmlFor={id}>
        {label}
      </label>
      <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline">
            <label className="cursor-pointer" htmlFor={id}>
              Choose
            </label>
          </Button>
          <span className="text-xs text-slate-500">JPG, PNG, or WEBP. Max 5MB.</span>
        </div>
        <input
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          id={id}
          onChange={onChange}
          type="file"
        />
        {previewUrl ? (
          <div
            aria-label={`${label} preview`}
            className="h-32 w-full rounded-md border border-slate-100 bg-cover bg-center"
            role="img"
            style={{ backgroundImage: `url(${previewUrl})` }}
          />
        ) : (
          <div className="flex h-32 items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
            No image selected
          </div>
        )}
      </div>
      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
    </div>
  );
}

function EntityListPage<TItem extends { id: string; isActive: boolean; updatedAt: string }>({
  config,
}: Readonly<{ config: EntityListConfig<TItem> }>) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('');
  const [sortBy, setSortBy] = useState(config.sortOptions[0]?.value ?? 'createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const entityQuery = useQuery({
    queryFn: async () => {
      const response = await config.list({
        isActive: activeFilterToBoolean(activeFilter),
        limit: listLimit,
        page,
        search,
        sortBy,
        sortOrder,
      });

      return response.data;
    },
    queryKey: [config.entityKey, { activeFilter, page, search, sortBy, sortOrder }],
  });

  const items = entityQuery.data?.items ?? [];
  const meta = entityQuery.data?.meta ?? {
    limit: listLimit,
    page,
    total: 0,
    totalPages: 1,
  };

  return (
    <section className="space-y-6">
      <PageHeader
        action={
          <Button asChild className="bg-teal-600 hover:bg-teal-700">
            <Link href={config.createHref}>
              <Plus className="h-4 w-4" />
              {config.createLabel ?? 'Create'}
            </Link>
          </Button>
        }
        eyebrow="Organization"
        icon={config.icon}
        subtitle={config.subtitle}
        title={config.title}
      />
      <Panel>
        <ToolbarGrid>
          <SearchInput
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            value={search}
          />
          <ActiveFilterSelect
            onChange={(value) => {
              setActiveFilter(value);
              setPage(1);
            }}
            value={activeFilter}
          />
          <Select
            onChange={(event) => {
              setSortBy(event.target.value);
              setPage(1);
            }}
            value={sortBy}
          >
            {config.sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <SortOrderSelect
            onChange={(value) => {
              setSortOrder(value);
              setPage(1);
            }}
            value={sortOrder}
          />
          <Button onClick={() => void entityQuery.refetch()} type="button" variant="outline">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </ToolbarGrid>
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
              <tr>
                {config.columns.map((column) => (
                  <th className={cn('px-4 py-3', column.className)} key={column.header}>
                    {column.header}
                  </th>
                ))}
                <th className="w-[120px] px-4 py-3">Status</th>
                <th className="w-[160px] px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.length > 0 ? (
                items.map((item) => (
                  <tr className="hover:bg-slate-50" key={item.id}>
                    {config.columns.map((column) => (
                      <td className="px-4 py-4 text-slate-600" key={column.header}>
                        {column.render(item)}
                      </td>
                    ))}
                    <td className="px-4 py-4">
                      <StatusBadge isActive={item.isActive} />
                    </td>
                    <td className="px-4 py-4 text-slate-500">{formatDate(item.updatedAt)}</td>
                  </tr>
                ))
              ) : (
                <QueryState
                  colSpan={config.columns.length + 2}
                  error={entityQuery.error}
                  isError={entityQuery.isError}
                  isLoading={entityQuery.isLoading}
                  label={config.emptyLabel}
                />
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls
          limit={meta.limit}
          onPageChange={setPage}
          page={meta.page}
          total={meta.total}
          totalPages={meta.totalPages}
        />
      </Panel>
    </section>
  );
}

function useHospitalOptions() {
  return useQuery<HospitalRecord[]>({
    queryFn: async () => {
      const response = await organizationApi.listHospitals({
        isActive: true,
        limit: 100,
        sortBy: 'title',
        sortOrder: 'asc',
      });

      return response.data.items;
    },
    queryKey: ['hospital-options'],
  });
}

function useRestaurantOptions(hospitalId?: string) {
  return useQuery<Restaurant[]>({
    enabled: Boolean(hospitalId),
    queryFn: async () => {
      const response = await organizationApi.listRestaurants({
        hospitalId,
        isActive: true,
        limit: 100,
        sortBy: 'restaurantName',
        sortOrder: 'asc',
      });

      return response.data.items;
    },
    queryKey: ['restaurant-options', hospitalId],
  });
}

function useEntityTotal(queryKey: string, queryFn: () => Promise<ApiResponse<ApiList<unknown>>>) {
  return useQuery({
    queryFn: async () => {
      const response = await queryFn();

      return response.data.meta.total;
    },
    queryKey: ['dashboard', queryKey],
  });
}

export function HospitalsPageClient() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('');
  const [stateFilter, setStateFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [onlinePaymentFilter, setOnlinePaymentFilter] = useState<OnlinePaymentFilter>('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const cityOptions = getCitiesForState(stateFilter);

  useEffect(() => {
    if (cityFilter && cityOptions.length > 0 && !cityOptions.includes(cityFilter)) {
      setCityFilter('');
    }
  }, [cityFilter, cityOptions]);

  const locationsQuery = useQuery({
    queryFn: async () => {
      const response = await organizationApi.listHospitals({
        city: cityFilter || undefined,
        isActive: activeFilterToBoolean(activeFilter),
        limit: listLimit,
        onlinePaymentOption: onlinePaymentFilter || undefined,
        page,
        search,
        sortBy,
        sortOrder,
        state: stateFilter || undefined,
      });

      return response.data;
    },
    queryKey: [
      'hospitals',
      { activeFilter, cityFilter, onlinePaymentFilter, page, search, sortBy, sortOrder, stateFilter },
    ],
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      organizationApi.updateHospital(id, { isActive }),
    onError(error) {
      showToast({
        description: getApiErrorMessage(error),
        title: 'Location status was not updated',
        variant: 'error',
      });
    },
    onSettled() {
      setStatusUpdatingId(null);
    },
    onSuccess(_, variables) {
      void queryClient.invalidateQueries({ queryKey: ['hospitals'] });
      void queryClient.invalidateQueries({ queryKey: ['hospital-options'] });
      showToast({
        title: variables.isActive ? 'Location activated' : 'Location deactivated',
        variant: 'success',
      });
    },
  });

  const items = locationsQuery.data?.items ?? [];
  const meta = locationsQuery.data?.meta ?? {
    limit: listLimit,
    page,
    total: 0,
    totalPages: 1,
  };

  function toggleLocationStatus(location: HospitalRecord) {
    const nextIsActive = !location.isActive;

    if (!nextIsActive && !window.confirm(freezeServicesMessage)) {
      return;
    }

    setStatusUpdatingId(location.id);
    statusMutation.mutate({ id: location.id, isActive: nextIsActive });
  }

  return (
    <section className="space-y-6">
      <PageHeader
        action={
          <Button asChild className="bg-teal-600 hover:bg-teal-700">
            <Link href="/masters/locations/new">
              <Plus className="h-4 w-4" />
              Add Location
            </Link>
          </Button>
        }
        eyebrow="Masters"
        icon={MapPin}
        subtitle="Manage operating locations for food and cafeteria services."
        title="Locations"
      />
      <Panel>
        <FlexibleToolbar>
          <SearchInput
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            value={search}
          />
          <ActiveFilterSelect
            onChange={(value) => {
              setActiveFilter(value);
              setPage(1);
            }}
            value={activeFilter}
          />
          <Select
            onChange={(event) => {
              setStateFilter(event.target.value);
              setPage(1);
            }}
            value={stateFilter}
          >
            <option value="">All states</option>
            {INDIAN_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </Select>
          <Select
            disabled={!stateFilter}
            onChange={(event) => {
              setCityFilter(event.target.value);
              setPage(1);
            }}
            value={cityFilter}
          >
            <option value="">All cities</option>
            {cityOptions.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </Select>
          <Select
            onChange={(event) => {
              setOnlinePaymentFilter(event.target.value as OnlinePaymentFilter);
              setPage(1);
            }}
            value={onlinePaymentFilter}
          >
            <option value="">All payment options</option>
            {onlinePaymentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select
            onChange={(event) => {
              setSortBy(event.target.value);
              setPage(1);
            }}
            value={sortBy}
          >
            <option value="createdAt">Created date</option>
            <option value="updatedAt">Updated date</option>
            <option value="title">Name</option>
          </Select>
          <SortOrderSelect
            onChange={(value) => {
              setSortOrder(value);
              setPage(1);
            }}
            value={sortOrder}
          />
          <Button onClick={() => void locationsQuery.refetch()} type="button" variant="outline">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </FlexibleToolbar>
        <div className="overflow-x-auto">
          <table className="min-w-[1180px] table-fixed divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
              <tr>
                <th className="w-[18%] px-4 py-3">Title</th>
                <th className="w-[13%] px-4 py-3">Location Code</th>
                <th className="w-[17%] px-4 py-3">Display Name</th>
                <th className="w-[12%] px-4 py-3">State</th>
                <th className="w-[12%] px-4 py-3">City</th>
                <th className="w-[10%] px-4 py-3">Postal Code</th>
                <th className="w-[12%] px-4 py-3">Online Payment</th>
                <th className="w-[18%] px-4 py-3">Status</th>
                <th className="w-[13%] px-4 py-3">Updated</th>
                <th className="w-[12%] px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.length > 0 ? (
                items.map((location) => (
                  <tr className="hover:bg-slate-50" key={location.id}>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-slate-950">{getLocationTitle(location)}</p>
                        <p className="line-clamp-1 text-xs text-slate-500">
                          {nullableText(location.address)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{getLocationCode(location)}</td>
                    <td className="px-4 py-4 text-slate-600">
                      {getLocationDisplayName(location)}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{nullableText(location.state)}</td>
                    <td className="px-4 py-4 text-slate-600">{nullableText(location.city)}</td>
                    <td className="px-4 py-4 text-slate-600">
                      {nullableText(getLocationPostalCode(location))}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{location.onlinePaymentOption}</td>
                    <td className="px-4 py-4">
                      <StatusToggleCell
                        disabled={statusMutation.isPending && statusUpdatingId === location.id}
                        isActive={location.isActive}
                        onToggle={() => toggleLocationStatus(location)}
                        showFrozenMessage={!location.isActive}
                      />
                    </td>
                    <td className="px-4 py-4 text-slate-500">{formatDate(location.updatedAt)}</td>
                    <td className="px-4 py-4">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/masters/hospitals/${location.id}/locations#details`}>
                          <Eye className="h-4 w-4" />
                          View/Edit
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <QueryState
                  colSpan={10}
                  error={locationsQuery.error}
                  isError={locationsQuery.isError}
                  isLoading={locationsQuery.isLoading}
                  label="locations"
                />
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls
          limit={meta.limit}
          onPageChange={setPage}
          page={meta.page}
          total={meta.total}
          totalPages={meta.totalPages}
        />
      </Panel>
    </section>
  );
}

export function HospitalLocationsPageClient({ hospitalId }: Readonly<{ hospitalId: string }>) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('');
  const [sortBy, setSortBy] = useState('locationName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const locationMasterForm = useForm<HospitalFormValues>({
    defaultValues: toHospitalFormDefaults(),
  });
  const form = useForm<LocationFormValues>({
    defaultValues: {
      address: '',
      area: '',
      building: '',
      floor: '',
      hospitalId,
      isActive: true,
      locationName: '',
    },
  });

  const hospitalQuery = useQuery({
    queryFn: async () => {
      const response = await organizationApi.getHospital(hospitalId);

      return response.data;
    },
    queryKey: ['hospital', hospitalId],
  });

  useEffect(() => {
    if (hospitalQuery.data) {
      locationMasterForm.reset(toHospitalFormDefaults(hospitalQuery.data));
    }
  }, [hospitalQuery.data, locationMasterForm]);

  const locationsQuery = useQuery({
    queryFn: async () => {
      const response = await organizationApi.listLocations({
        hospitalId,
        isActive: activeFilterToBoolean(activeFilter),
        limit: listLimit,
        page,
        search,
        sortBy,
        sortOrder,
      });

      return response.data;
    },
    queryKey: ['hospital-locations', hospitalId, { activeFilter, page, search, sortBy, sortOrder }],
  });

  const saveLocationMutation = useMutation({
    mutationFn: (body: LocationInput) =>
      editingLocation
        ? organizationApi.updateLocation(editingLocation.id, body)
        : organizationApi.createLocation(body),
    onError(error) {
      showToast({
        description: getApiErrorMessage(error),
        title: editingLocation ? 'Location was not updated' : 'Location was not created',
        variant: 'error',
      });
    },
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ['hospital-locations', hospitalId] });
      void queryClient.invalidateQueries({ queryKey: ['location-options', hospitalId] });
      void queryClient.invalidateQueries({ queryKey: ['locations'] });
      showToast({
        title: editingLocation ? 'Location updated' : 'Location created',
        variant: 'success',
      });
      setEditingLocation(null);
      form.reset({
        address: '',
        area: '',
        building: '',
        floor: '',
        hospitalId,
        isActive: true,
        locationName: '',
      });
    },
  });

  const updateLocationMasterMutation = useMutation({
    mutationFn: (body: HospitalInput) => organizationApi.updateHospital(hospitalId, body),
    onError(error) {
      showToast({
        description: getApiErrorMessage(error),
        title: 'Location was not updated',
        variant: 'error',
      });
    },
    onSuccess(response) {
      void queryClient.invalidateQueries({ queryKey: ['hospital', hospitalId] });
      void queryClient.invalidateQueries({ queryKey: ['hospitals'] });
      void queryClient.invalidateQueries({ queryKey: ['hospital-options'] });
      locationMasterForm.reset(toHospitalFormDefaults(response.data));
      showToast({
        title: 'Location updated',
        variant: 'success',
      });
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: (id: string) => organizationApi.deleteLocation(id),
    onError(error) {
      showToast({
        description: getApiErrorMessage(error),
        title: 'Location was not deleted',
        variant: 'error',
      });
    },
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ['hospital-locations', hospitalId] });
      void queryClient.invalidateQueries({ queryKey: ['location-options', hospitalId] });
      void queryClient.invalidateQueries({ queryKey: ['locations'] });
      showToast({
        title: 'Location deleted',
        variant: 'success',
      });
    },
  });

  const items = locationsQuery.data?.items ?? [];
  const meta = locationsQuery.data?.meta ?? {
    limit: listLimit,
    page,
    total: 0,
    totalPages: 1,
  };
  const hospital = hospitalQuery.data;

  const handleLocationMasterSubmit = locationMasterForm.handleSubmit((values) => {
    const parsed = hospitalSchema.safeParse(values);

    if (!parsed.success) {
      applyValidationErrors(locationMasterForm, parsed.error);
      return;
    }

    updateLocationMasterMutation.mutate(toHospitalInput(parsed.data));
  });

  const handleSubmit = form.handleSubmit((values) => {
    const parsed = locationSchema.safeParse({
      ...values,
      hospitalId,
    });

    if (!parsed.success) {
      applyValidationErrors(form, parsed.error);
      return;
    }

    saveLocationMutation.mutate({
      address: optionalValue(parsed.data.address),
      area: optionalValue(parsed.data.area),
      building: optionalValue(parsed.data.building),
      floor: optionalValue(parsed.data.floor),
      hospitalId,
      isActive: parsed.data.isActive,
      locationName: parsed.data.locationName,
    });
  });

  function startEditingLocation(location: Location) {
    setEditingLocation(location);
    form.reset({
      address: location.address ?? '',
      area: location.area ?? '',
      building: location.building ?? '',
      floor: location.floor ?? '',
      hospitalId,
      isActive: location.isActive,
      locationName: location.locationName,
    });
  }

  function cancelEditingLocation() {
    setEditingLocation(null);
    form.reset({
      address: '',
      area: '',
      building: '',
      floor: '',
      hospitalId,
      isActive: true,
      locationName: '',
    });
  }

  function deleteLocation(location: Location) {
    const shouldDelete = window.confirm(`Delete ${location.locationName}?`);

    if (shouldDelete) {
      deleteLocationMutation.mutate(location.id);
    }
  }

  return (
    <section className="space-y-6">
      <Button asChild variant="ghost">
        <Link href="/masters/locations">
          <ArrowLeft className="h-4 w-4" />
          Back to Locations
        </Link>
      </Button>
      <PageHeader
        eyebrow="Location Master"
        icon={MapPin}
        subtitle="View and update operating location details."
        title={hospital ? getLocationTitle(hospital) : 'Location'}
      />
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <a href="#details">
            <Eye className="h-4 w-4" />
            Location Details
          </a>
        </Button>
        <Button asChild className="bg-teal-600 hover:bg-teal-700" size="sm">
          <a href="#locations">
            <MapPin className="h-4 w-4" />
            Service Areas
          </a>
        </Button>
      </div>

      <Panel className="p-5" id="details">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-normal text-slate-950">
              Add/Update Location
            </h2>
            <p className="text-sm text-slate-500">
              Creating a Location will auto-create Main Store and Main Kitchen.
            </p>
          </div>
          {hospital ? <StatusBadge isActive={hospital.isActive} /> : null}
        </div>
        {hospitalQuery.isLoading ? (
          <div className="grid gap-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-64" />
          </div>
        ) : hospitalQuery.isError ? (
          <p className="text-sm font-medium text-red-600">
            {getApiErrorMessage(hospitalQuery.error)}
          </p>
        ) : hospital ? (
          <form
            className="grid gap-5"
            onSubmit={(event) => {
              void handleLocationMasterSubmit(event);
            }}
          >
            <LocationMasterFormFields
              disabled={updateLocationMasterMutation.isPending}
              form={locationMasterForm}
            />
            <div className="flex justify-end">
              <SubmitButton
                isPending={updateLocationMasterMutation.isPending}
                label="Update Location"
              />
            </div>
          </form>
        ) : null}
      </Panel>

      <Panel className="p-5" id="locations">
        <div className="mb-5">
          <h2 className="text-lg font-semibold tracking-normal text-slate-950">Service Areas</h2>
          <p className="text-sm text-slate-500">
            Add floors, buildings, and service areas under this location.
          </p>
        </div>
        <form
          className="grid gap-5"
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              error={form.formState.errors.locationName?.message}
              label="Location Name"
              name="hospital-location-name"
            >
              <Input id="hospital-location-name" {...form.register('locationName')} />
            </Field>
            <Field
              error={form.formState.errors.building?.message}
              label="Building"
              name="hospital-location-building"
            >
              <Input id="hospital-location-building" {...form.register('building')} />
            </Field>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <Field
              error={form.formState.errors.floor?.message}
              label="Floor"
              name="hospital-location-floor"
            >
              <Input id="hospital-location-floor" {...form.register('floor')} />
            </Field>
            <Field
              error={form.formState.errors.area?.message}
              label="Area"
              name="hospital-location-area"
            >
              <Input id="hospital-location-area" {...form.register('area')} />
            </Field>
            <Field
              error={form.formState.errors.address?.message}
              label="Address"
              name="hospital-location-address"
            >
              <Input id="hospital-location-address" {...form.register('address')} />
            </Field>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CheckboxLine
              input={<input className="h-4 w-4" type="checkbox" {...form.register('isActive')} />}
            >
              Active
            </CheckboxLine>
            <div className="flex gap-2">
              {editingLocation ? (
                <Button onClick={cancelEditingLocation} type="button" variant="outline">
                  Cancel
                </Button>
              ) : null}
              <SubmitButton
                isPending={saveLocationMutation.isPending}
                label={editingLocation ? 'Update Location' : 'Create Location'}
              />
            </div>
          </div>
        </form>
      </Panel>

      <Panel>
        <ToolbarGrid>
          <SearchInput
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            value={search}
          />
          <ActiveFilterSelect
            onChange={(value) => {
              setActiveFilter(value);
              setPage(1);
            }}
            value={activeFilter}
          />
          <Select
            onChange={(event) => {
              setSortBy(event.target.value);
              setPage(1);
            }}
            value={sortBy}
          >
            <option value="locationName">Location name</option>
            <option value="building">Building</option>
            <option value="floor">Floor</option>
            <option value="area">Area</option>
            <option value="createdAt">Created date</option>
            <option value="isActive">Status</option>
          </Select>
          <SortOrderSelect
            onChange={(value) => {
              setSortOrder(value);
              setPage(1);
            }}
            value={sortOrder}
          />
          <Button onClick={() => void locationsQuery.refetch()} type="button" variant="outline">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </ToolbarGrid>
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
              <tr>
                <th className="w-[24%] px-4 py-3">Location</th>
                <th className="w-[18%] px-4 py-3">Building</th>
                <th className="w-[14%] px-4 py-3">Floor</th>
                <th className="w-[16%] px-4 py-3">Area</th>
                <th className="w-[12%] px-4 py-3">Status</th>
                <th className="w-[16%] px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.length > 0 ? (
                items.map((location) => (
                  <tr className="hover:bg-slate-50" key={location.id}>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-slate-950">{location.locationName}</p>
                        <p className="text-xs text-slate-500">
                          Updated {formatDate(location.updatedAt)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{nullableText(location.building)}</td>
                    <td className="px-4 py-4 text-slate-600">{nullableText(location.floor)}</td>
                    <td className="px-4 py-4 text-slate-600">{nullableText(location.area)}</td>
                    <td className="px-4 py-4">
                      <StatusBadge isActive={location.isActive} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => startEditingLocation(location)}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          className="border-red-200 text-red-700 hover:bg-red-50"
                          disabled={deleteLocationMutation.isPending}
                          onClick={() => deleteLocation(location)}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <QueryState
                  colSpan={6}
                  error={locationsQuery.error}
                  isError={locationsQuery.isError}
                  isLoading={locationsQuery.isLoading}
                  label="locations"
                />
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls
          limit={meta.limit}
          onPageChange={setPage}
          page={meta.page}
          total={meta.total}
          totalPages={meta.totalPages}
        />
      </Panel>
    </section>
  );
}

export function LocationsPageClient() {
  return (
    <EntityListPage<Location>
      config={{
        columns: [
          {
            className: 'w-[28%]',
            header: 'Location',
            render: (location) => (
              <div>
                <p className="font-medium text-slate-950">{location.locationName}</p>
                <p className="text-xs text-slate-500">{nullableText(location.area)}</p>
              </div>
            ),
          },
          {
            className: 'w-[24%]',
            header: 'Location',
            render: (location) => getLocationDisplayName(location.hospital),
          },
          {
            className: 'w-[18%]',
            header: 'Building',
            render: (location) => nullableText(location.building),
          },
          {
            className: 'w-[16%]',
            header: 'Floor',
            render: (location) => nullableText(location.floor),
          },
        ],
        createHref: '/masters/locations/new',
        emptyLabel: 'locations',
        entityKey: 'locations',
        icon: MapPin,
        list: (query) => organizationApi.listLocations(query),
        sortOptions: [
          { label: 'Created date', value: 'createdAt' },
          { label: 'Location name', value: 'locationName' },
          { label: 'Building', value: 'building' },
          { label: 'Floor', value: 'floor' },
          { label: 'Area', value: 'area' },
          { label: 'Status', value: 'isActive' },
        ],
        subtitle: 'Manage campus, floor, and service areas.',
        title: 'Service Areas',
      }}
    />
  );
}

export function StoresPageClient() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('');
  const [hospitalFilter, setHospitalFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const hospitalOptionsQuery = useHospitalOptions();

  const storesQuery = useQuery({
    queryFn: async () => {
      const response = await organizationApi.listStores({
        hospitalId: hospitalFilter || undefined,
        isActive: activeFilterToBoolean(activeFilter),
        limit: listLimit,
        page,
        search,
        sortBy,
        sortOrder,
      });

      return response.data;
    },
    queryKey: ['stores', { activeFilter, hospitalFilter, page, search, sortBy, sortOrder }],
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      organizationApi.updateStore(id, { isActive }),
    onError(error) {
      showToast({
        description: getApiErrorMessage(error),
        title: 'Store status was not updated',
        variant: 'error',
      });
    },
    onSettled() {
      setStatusUpdatingId(null);
    },
    onSuccess(_, variables) {
      void queryClient.invalidateQueries({ queryKey: ['stores'] });
      void queryClient.invalidateQueries({ queryKey: ['store-options'] });
      showToast({
        title: variables.isActive ? 'Store activated' : 'Store deactivated',
        variant: 'success',
      });
    },
  });

  const items = storesQuery.data?.items ?? [];
  const meta = storesQuery.data?.meta ?? {
    limit: listLimit,
    page,
    total: 0,
    totalPages: 1,
  };

  function toggleStoreStatus(store: StoreRecord) {
    const nextIsActive = !store.isActive;

    if (nextIsActive && !store.hospital.isActive) {
      showToast({
        description: inactiveLocationMessage,
        title: 'Location is inactive',
        variant: 'info',
      });
      return;
    }

    if (!nextIsActive && !window.confirm(freezeServicesMessage)) {
      return;
    }

    setStatusUpdatingId(store.id);
    statusMutation.mutate({ id: store.id, isActive: nextIsActive });
  }

  return (
    <section className="space-y-6">
      <PageHeader
        action={
          <Button asChild className="bg-teal-600 hover:bg-teal-700">
            <Link href="/masters/stores/new">
              <Plus className="h-4 w-4" />
              Create
            </Link>
          </Button>
        }
        eyebrow="Organization"
        icon={Store}
        subtitle="Manage F&B stores linked to locations."
        title="Stores"
      />
      <Panel>
        <ToolbarGrid>
          <SearchInput
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            value={search}
          />
          <ActiveFilterSelect
            onChange={(value) => {
              setActiveFilter(value);
              setPage(1);
            }}
            value={activeFilter}
          />
          <Select
            disabled={hospitalOptionsQuery.isLoading}
            onChange={(event) => {
              setHospitalFilter(event.target.value);
              setPage(1);
            }}
            value={hospitalFilter}
          >
            <option value="">All locations</option>
            {hospitalOptionsQuery.data?.map((hospital) => (
              <option key={hospital.id} value={hospital.id}>
                {formatLocationOption(hospital)}
              </option>
            ))}
          </Select>
          <SortOrderSelect
            onChange={(value) => {
              setSortOrder(value);
              setPage(1);
            }}
            value={sortOrder}
          />
          <Select
            onChange={(event) => {
              setSortBy(event.target.value);
              setPage(1);
            }}
            value={sortBy}
          >
            <option value="createdAt">Created date</option>
            <option value="updatedAt">Updated date</option>
            <option value="storeName">Name</option>
          </Select>
        </ToolbarGrid>
        <div className="flex justify-end border-b px-4 py-3">
          <Button onClick={() => void storesQuery.refetch()} type="button" variant="outline">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
              <tr>
                <th className="w-[28%] px-4 py-3">Store/F&B</th>
                <th className="w-[26%] px-4 py-3">Location</th>
                <th className="w-[22%] px-4 py-3">Status</th>
                <th className="w-[16%] px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.length > 0 ? (
                items.map((store) => (
                  <tr className="hover:bg-slate-50" key={store.id}>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-slate-950">{store.storeName}</p>
                        <p className="text-xs text-slate-500">{store.storeCode}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {getLocationDisplayName(store.hospital)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusToggleCell
                        disabled={statusMutation.isPending && statusUpdatingId === store.id}
                        isActive={store.isActive}
                        onToggle={() => toggleStoreStatus(store)}
                        showFrozenMessage={!store.hospital.isActive}
                      />
                    </td>
                    <td className="px-4 py-4 text-slate-500">{formatDate(store.updatedAt)}</td>
                  </tr>
                ))
              ) : (
                <QueryState
                  colSpan={4}
                  error={storesQuery.error}
                  isError={storesQuery.isError}
                  isLoading={storesQuery.isLoading}
                  label="stores"
                />
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls
          limit={meta.limit}
          onPageChange={setPage}
          page={meta.page}
          total={meta.total}
          totalPages={meta.totalPages}
        />
      </Panel>
    </section>
  );
}

export function KitchensPageClient() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('');
  const [hospitalFilter, setHospitalFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const hospitalOptionsQuery = useHospitalOptions();

  const kitchensQuery = useQuery({
    queryFn: async () => {
      const response = await organizationApi.listKitchens({
        hospitalId: hospitalFilter || undefined,
        isActive: activeFilterToBoolean(activeFilter),
        limit: listLimit,
        page,
        search,
        sortBy,
        sortOrder,
      });

      return response.data;
    },
    queryKey: ['kitchens', { activeFilter, hospitalFilter, page, search, sortBy, sortOrder }],
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      organizationApi.updateKitchen(id, { isActive }),
    onError(error) {
      showToast({
        description: getApiErrorMessage(error),
        title: 'Kitchen status was not updated',
        variant: 'error',
      });
    },
    onSettled() {
      setStatusUpdatingId(null);
    },
    onSuccess(_, variables) {
      void queryClient.invalidateQueries({ queryKey: ['kitchens'] });
      void queryClient.invalidateQueries({ queryKey: ['kitchen-options'] });
      showToast({
        title: variables.isActive ? 'Kitchen activated' : 'Kitchen deactivated',
        variant: 'success',
      });
    },
  });

  const items = kitchensQuery.data?.items ?? [];
  const meta = kitchensQuery.data?.meta ?? {
    limit: listLimit,
    page,
    total: 0,
    totalPages: 1,
  };

  function toggleKitchenStatus(kitchen: Kitchen) {
    const nextIsActive = !kitchen.isActive;

    if (nextIsActive && !kitchen.hospital.isActive) {
      showToast({
        description: inactiveLocationMessage,
        title: 'Location is inactive',
        variant: 'info',
      });
      return;
    }

    if (!nextIsActive && !window.confirm(freezeServicesMessage)) {
      return;
    }

    setStatusUpdatingId(kitchen.id);
    statusMutation.mutate({ id: kitchen.id, isActive: nextIsActive });
  }

  return (
    <section className="space-y-6">
      <PageHeader
        action={
          <Button asChild className="bg-teal-600 hover:bg-teal-700">
            <Link href="/masters/kitchens/new">
              <Plus className="h-4 w-4" />
              Create
            </Link>
          </Button>
        }
        eyebrow="Organization"
        icon={ChefHat}
        subtitle="Manage production kitchens for location food service."
        title="Kitchens"
      />
      <Panel>
        <ToolbarGrid>
          <SearchInput
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            value={search}
          />
          <ActiveFilterSelect
            onChange={(value) => {
              setActiveFilter(value);
              setPage(1);
            }}
            value={activeFilter}
          />
          <Select
            disabled={hospitalOptionsQuery.isLoading}
            onChange={(event) => {
              setHospitalFilter(event.target.value);
              setPage(1);
            }}
            value={hospitalFilter}
          >
            <option value="">All locations</option>
            {hospitalOptionsQuery.data?.map((hospital) => (
              <option key={hospital.id} value={hospital.id}>
                {formatLocationOption(hospital)}
              </option>
            ))}
          </Select>
          <SortOrderSelect
            onChange={(value) => {
              setSortOrder(value);
              setPage(1);
            }}
            value={sortOrder}
          />
          <Select
            onChange={(event) => {
              setSortBy(event.target.value);
              setPage(1);
            }}
            value={sortBy}
          >
            <option value="createdAt">Created date</option>
            <option value="updatedAt">Updated date</option>
            <option value="kitchenName">Name</option>
          </Select>
        </ToolbarGrid>
        <div className="flex justify-end border-b px-4 py-3">
          <Button onClick={() => void kitchensQuery.refetch()} type="button" variant="outline">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-normal text-slate-500">
              <tr>
                <th className="w-[28%] px-4 py-3">Kitchen</th>
                <th className="w-[26%] px-4 py-3">Location</th>
                <th className="w-[22%] px-4 py-3">Status</th>
                <th className="w-[16%] px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.length > 0 ? (
                items.map((kitchen) => (
                  <tr className="hover:bg-slate-50" key={kitchen.id}>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-slate-950">{kitchen.kitchenName}</p>
                        <p className="text-xs text-slate-500">{kitchen.kitchenCode}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {getLocationDisplayName(kitchen.hospital)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusToggleCell
                        disabled={statusMutation.isPending && statusUpdatingId === kitchen.id}
                        isActive={kitchen.isActive}
                        onToggle={() => toggleKitchenStatus(kitchen)}
                        showFrozenMessage={!kitchen.hospital.isActive}
                      />
                    </td>
                    <td className="px-4 py-4 text-slate-500">{formatDate(kitchen.updatedAt)}</td>
                  </tr>
                ))
              ) : (
                <QueryState
                  colSpan={4}
                  error={kitchensQuery.error}
                  isError={kitchensQuery.isError}
                  isLoading={kitchensQuery.isLoading}
                  label="kitchens"
                />
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls
          limit={meta.limit}
          onPageChange={setPage}
          page={meta.page}
          total={meta.total}
          totalPages={meta.totalPages}
        />
      </Panel>
    </section>
  );
}

function RestaurantThumbnail({ restaurant }: Readonly<{ restaurant: Restaurant }>) {
  if (restaurant.thumbnailUrl) {
    return (
      <div
        aria-label={`${restaurant.restaurantName} thumbnail`}
        className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 bg-cover bg-center shadow-sm dark:border-slate-800"
        role="img"
        style={{ backgroundImage: `url(${restaurant.thumbnailUrl})` }}
      />
    );
  }

  return (
    <span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg border border-teal-100 bg-teal-50 text-teal-700 shadow-sm dark:border-teal-900 dark:bg-teal-950 dark:text-teal-300">
      <Utensils className="h-6 w-6" />
    </span>
  );
}

function RestaurantOnlineSwitch({
  disabled,
  isOnline,
  onToggle,
}: Readonly<{
  disabled: boolean;
  isOnline: boolean;
  onToggle: () => void;
}>) {
  return (
    <button
      aria-checked={isOnline}
      aria-label={isOnline ? 'Set restaurant offline' : 'Set restaurant online'}
      className={cn(
        'inline-flex h-7 w-12 items-center rounded-full border p-1 transition focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:cursor-not-allowed disabled:opacity-60',
        isOnline
          ? 'border-teal-500 bg-teal-500'
          : 'border-slate-300 bg-slate-200 dark:border-slate-700 dark:bg-slate-800',
      )}
      disabled={disabled}
      onClick={onToggle}
      role="switch"
      type="button"
    >
      <span
        className={cn(
          'h-5 w-5 rounded-full bg-white shadow-sm transition',
          isOnline ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  );
}

export function RestaurantsPageClient() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [onlineUpdatingId, setOnlineUpdatingId] = useState<string | null>(null);

  const restaurantsQuery = useQuery({
    queryFn: async () => {
      const response = await organizationApi.listRestaurants({
        isActive: activeFilterToBoolean(activeFilter),
        limit: listLimit,
        page,
        search,
        sortBy,
        sortOrder,
      });

      return response.data;
    },
    queryKey: ['restaurants', { activeFilter, page, search, sortBy, sortOrder }],
  });

  const deleteRestaurantMutation = useMutation({
    mutationFn: (id: string) => organizationApi.deleteRestaurant(id),
    onError(error) {
      showToast({
        description: getApiErrorMessage(error),
        title: 'Restaurant was not deleted',
        variant: 'error',
      });
    },
    onSettled() {
      setDeletingId(null);
    },
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      void queryClient.invalidateQueries({ queryKey: ['restaurant-options'] });
      showToast({
        title: 'Restaurant deleted',
        variant: 'success',
      });
    },
  });

  const onlineToggleMutation = useMutation({
    mutationFn: ({
      id,
      nextIsOnline,
    }: {
      id: string;
      nextIsOnline: boolean;
    }) =>
      organizationApi.updateRestaurant(id, {
        isOnlineOrdersEnabled: nextIsOnline,
        onlineOrders: nextIsOnline,
        onlineOrderingEnabled: nextIsOnline,
      }),
    onError(error) {
      showToast({
        description: getApiErrorMessage(error),
        title: 'Online status was not updated',
        variant: 'error',
      });
    },
    onSettled() {
      setOnlineUpdatingId(null);
    },
    onSuccess(_, variables) {
      void queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      showToast({
        title: variables.nextIsOnline ? 'Restaurant is online' : 'Restaurant is offline',
        variant: 'success',
      });
    },
  });

  const items = restaurantsQuery.data?.items ?? [];
  const meta = restaurantsQuery.data?.meta ?? {
    limit: listLimit,
    page,
    total: 0,
    totalPages: 1,
  };
  const sortOptions = [
    { label: 'Created date', value: 'createdAt' },
    { label: 'Restaurant name', value: 'restaurantName' },
    { label: 'Restaurant code', value: 'restaurantCode' },
    { label: 'Status', value: 'isActive' },
  ];

  const handleDelete = (restaurant: Restaurant) => {
    const shouldDelete = window.confirm(`Delete ${restaurant.restaurantName}?`);

    if (!shouldDelete) {
      return;
    }

    setDeletingId(restaurant.id);
    deleteRestaurantMutation.mutate(restaurant.id);
  };

  const handleOnlineToggle = (restaurant: Restaurant) => {
    setOnlineUpdatingId(restaurant.id);
    onlineToggleMutation.mutate({
      id: restaurant.id,
      nextIsOnline: !isRestaurantOnline(restaurant),
    });
  };

  return (
    <section className="space-y-6">
      <PageHeader
        action={
          <Button asChild className="bg-teal-600 hover:bg-teal-700">
            <Link href="/masters/restaurants/new">
              <Plus className="h-4 w-4" />
              Create
            </Link>
          </Button>
        }
        eyebrow="Organization"
        icon={Utensils}
        subtitle="Manage restaurant profiles and ordering availability."
        title="Restaurants"
      />
      <Panel>
        <ToolbarGrid>
          <SearchInput
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            value={search}
          />
          <ActiveFilterSelect
            onChange={(value) => {
              setActiveFilter(value);
              setPage(1);
            }}
            value={activeFilter}
          />
          <Select
            onChange={(event) => {
              setSortBy(event.target.value);
              setPage(1);
            }}
            value={sortBy}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <SortOrderSelect
            onChange={(value) => {
              setSortOrder(value);
              setPage(1);
            }}
            value={sortOrder}
          />
          <Button onClick={() => void restaurantsQuery.refetch()} type="button" variant="outline">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </ToolbarGrid>
        <div className="overflow-x-auto px-4 pb-4">
          <table className="w-full min-w-[980px] border-separate border-spacing-y-3 text-left text-sm">
            <thead className="text-xs font-semibold uppercase tracking-normal text-slate-500 dark:text-slate-400">
              <tr>
                <th className="w-[36%] px-4 py-2">Restaurant</th>
                <th className="w-[14%] px-4 py-2">Online</th>
                <th className="w-[30%] px-4 py-2">Status / Options</th>
                <th className="w-[20%] px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? (
                items.map((restaurant) => {
                  const isOnline = isRestaurantOnline(restaurant);
                  const optionBadges = getRestaurantOptionBadges(restaurant);
                  const isDeleting = deletingId === restaurant.id;
                  const isOnlineUpdating = onlineUpdatingId === restaurant.id;

                  return (
                    <tr className="group" key={restaurant.id}>
                      <td className="rounded-l-xl border-y border-l border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 transition group-hover:border-teal-100 group-hover:bg-teal-50/30 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/20 dark:group-hover:border-teal-900 dark:group-hover:bg-teal-950/20">
                        <div className="flex min-w-0 items-center gap-4">
                          <RestaurantThumbnail restaurant={restaurant} />
                          <div className="min-w-0">
                            <p className="truncate text-base font-semibold text-slate-950 dark:text-slate-100">
                              {restaurant.restaurantName}
                            </p>
                            <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                              {formatRestaurantLocationDisplay(restaurant.hospital)}
                            </p>
                            <p className="mt-1 text-xs font-medium text-slate-400">
                              {restaurant.restaurantCode}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="border-y border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 transition group-hover:border-teal-100 group-hover:bg-teal-50/30 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/20 dark:group-hover:border-teal-900 dark:group-hover:bg-teal-950/20">
                        <div className="flex flex-col gap-2">
                          <RestaurantOnlineSwitch
                            disabled={isOnlineUpdating}
                            isOnline={isOnline}
                            onToggle={() => handleOnlineToggle(restaurant)}
                          />
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            {isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </td>
                      <td className="border-y border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 transition group-hover:border-teal-100 group-hover:bg-teal-50/30 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/20 dark:group-hover:border-teal-900 dark:group-hover:bg-teal-950/20">
                        <div className="flex flex-wrap gap-2">
                          {optionBadges.map((badge) => (
                            <Badge key={badge.label} variant={badge.variant}>
                              {badge.label}
                            </Badge>
                          ))}
                        </div>
                        <p className="mt-3 text-xs text-slate-400">
                          Updated {formatDate(restaurant.updatedAt)}
                        </p>
                      </td>
                      <td className="rounded-r-xl border-y border-r border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 transition group-hover:border-teal-100 group-hover:bg-teal-50/30 dark:border-slate-800 dark:bg-slate-950 dark:shadow-black/20 dark:group-hover:border-teal-900 dark:group-hover:bg-teal-950/20">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link href={`/masters/restaurants/${restaurant.id}/edit`}>
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Link>
                          </Button>
                          <Button
                            disabled={isDeleting}
                            onClick={() => handleDelete(restaurant)}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            {isDeleting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Delete
                          </Button>
                          <Button
                            onClick={() =>
                              showToast({
                                title: 'QR printing will be available in QR module.',
                                variant: 'info',
                              })
                            }
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            <QrCode className="h-4 w-4" />
                            Print QR
                          </Button>
                          <Button
                            onClick={() =>
                              showToast({
                                title:
                                  'Customer Orders Activity will be available in Restaurant Operations.',
                                variant: 'info',
                              })
                            }
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            <Activity className="h-4 w-4" />
                            Activity
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <QueryState
                  colSpan={4}
                  error={restaurantsQuery.error}
                  isError={restaurantsQuery.isError}
                  isLoading={restaurantsQuery.isLoading}
                  label="restaurants"
                />
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls
          limit={meta.limit}
          onPageChange={setPage}
          page={meta.page}
          total={meta.total}
          totalPages={meta.totalPages}
        />
      </Panel>
    </section>
  );
}

export function CountersPageClient() {
  return (
    <EntityListPage<Counter>
      config={{
        columns: [
          {
            className: 'w-[26%]',
            header: 'Counter',
            render: (counter) => (
              <div>
                <p className="font-medium text-slate-950">{counter.counterName}</p>
                <p className="text-xs text-slate-500">{counter.counterCode}</p>
              </div>
            ),
          },
          {
            className: 'w-[22%]',
            header: 'Restaurant',
            render: (counter) => counter.restaurant.restaurantName,
          },
          {
            className: 'w-[20%]',
            header: 'Location',
            render: (counter) => getLocationDisplayName(counter.hospital),
          },
          {
            className: 'w-[18%]',
            header: 'POS Device',
            render: (counter) => nullableText(counter.posDeviceId),
          },
        ],
        createHref: '/masters/counters/new',
        emptyLabel: 'counters',
        entityKey: 'counters',
        icon: CreditCard,
        list: (query) => organizationApi.listCounters(query),
        sortOptions: [
          { label: 'Created date', value: 'createdAt' },
          { label: 'Counter name', value: 'counterName' },
          { label: 'Counter code', value: 'counterCode' },
          { label: 'Status', value: 'isActive' },
        ],
        subtitle: 'Manage restaurant counters and POS points.',
        title: 'Counters',
      }}
    />
  );
}

export function HospitalCreatePageClient() {
  const form = useForm<HospitalFormValues>({
    defaultValues: toHospitalFormDefaults(),
  });
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showToast } = useToast();
  const createHospitalMutation = useMutation({
    mutationFn: (body: HospitalInput) => organizationApi.createHospital(body),
    onError(error) {
      showToast({
        description: getApiErrorMessage(error),
        title: 'Location was not created',
        variant: 'error',
      });
    },
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ['hospitals'] });
      void queryClient.invalidateQueries({ queryKey: ['hospital-options'] });
      showToast({
        description: 'Main Store and Main Kitchen were created automatically.',
        title: 'Location created',
        variant: 'success',
      });
      router.push('/masters/locations');
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    const parsed = hospitalSchema.safeParse(values);

    if (!parsed.success) {
      applyValidationErrors(form, parsed.error);
      return;
    }

    createHospitalMutation.mutate(toHospitalInput(parsed.data));
  });

  return (
    <FormShell
      backHref="/masters/locations"
      icon={MapPin}
      subtitle="Creating a Location will auto-create Main Store and Main Kitchen."
      title="Add Location"
    >
      <form
        className="grid gap-5"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      >
        <LocationMasterFormFields
          disabled={createHospitalMutation.isPending}
          form={form}
        />
        <div className="flex justify-end">
          <SubmitButton isPending={createHospitalMutation.isPending} label="Save Location" />
        </div>
      </form>
    </FormShell>
  );
}

export function LocationCreatePageClient() {
  const form = useForm<LocationFormValues>({
    defaultValues: {
      address: '',
      area: '',
      building: '',
      floor: '',
      hospitalId: '',
      isActive: true,
      locationName: '',
    },
  });
  const hospitalOptionsQuery = useHospitalOptions();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showToast } = useToast();
  const createLocationMutation = useMutation({
    mutationFn: (body: LocationInput) => organizationApi.createLocation(body),
    onError(error) {
      showToast({
        description: getApiErrorMessage(error),
        title: 'Location was not created',
        variant: 'error',
      });
    },
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ['locations'] });
      void queryClient.invalidateQueries({ queryKey: ['location-options'] });
      showToast({
        title: 'Location created',
        variant: 'success',
      });
      router.push('/masters/locations');
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    const parsed = locationSchema.safeParse(values);

    if (!parsed.success) {
      applyValidationErrors(form, parsed.error);
      return;
    }

    createLocationMutation.mutate({
      address: optionalValue(parsed.data.address),
      area: optionalValue(parsed.data.area),
      building: optionalValue(parsed.data.building),
      floor: optionalValue(parsed.data.floor),
      hospitalId: parsed.data.hospitalId,
      isActive: parsed.data.isActive,
      locationName: parsed.data.locationName,
    });
  });

  return (
    <FormShell
      backHref="/masters/locations"
      icon={MapPin}
      subtitle="Create a service area under an active location."
      title="Create Service Area"
    >
      <form
        className="grid gap-5"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      >
        <Field
          error={form.formState.errors.hospitalId?.message}
          label="Location"
          name="location-hospital"
        >
          <Select
            disabled={hospitalOptionsQuery.isLoading}
            id="location-hospital"
            {...form.register('hospitalId')}
          >
            <option value="">Select location</option>
            {hospitalOptionsQuery.data?.map((hospital) => (
              <option key={hospital.id} value={hospital.id}>
                {formatLocationOption(hospital)}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            error={form.formState.errors.locationName?.message}
            label="Location Name"
            name="location-name"
          >
            <Input id="location-name" {...form.register('locationName')} />
          </Field>
          <Field
            error={form.formState.errors.building?.message}
            label="Building"
            name="location-building"
          >
            <Input id="location-building" {...form.register('building')} />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field error={form.formState.errors.floor?.message} label="Floor" name="location-floor">
            <Input id="location-floor" {...form.register('floor')} />
          </Field>
          <Field error={form.formState.errors.area?.message} label="Area" name="location-area">
            <Input id="location-area" {...form.register('area')} />
          </Field>
        </div>
        <Field
          error={form.formState.errors.address?.message}
          label="Address"
          name="location-address"
        >
          <Input id="location-address" {...form.register('address')} />
        </Field>
        <CheckboxLine
          input={<input className="h-4 w-4" type="checkbox" {...form.register('isActive')} />}
        >
          Active
        </CheckboxLine>
        <FormWarning
          isVisible={hospitalOptionsQuery.isError}
          message={getApiErrorMessage(hospitalOptionsQuery.error)}
        />
        <div className="flex justify-end">
          <SubmitButton isPending={createLocationMutation.isPending} label="Create Location" />
        </div>
      </form>
    </FormShell>
  );
}

export function StoreCreatePageClient() {
  const form = useForm<StoreFormValues>({
    defaultValues: {
      hospitalId: '',
      isActive: true,
      storeName: '',
    },
  });
  const hospitalId = form.watch('hospitalId');
  const storeName = form.watch('storeName');
  const hospitalOptionsQuery = useHospitalOptions();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showToast } = useToast();
  const canSubmitStore = isUuid(hospitalId) && hasRequiredText(storeName);

  const createStoreMutation = useMutation({
    mutationFn: (body: StoreInput) => organizationApi.createStore(body),
    onError(error) {
      showToast({
        description: getApiErrorMessage(error),
        title: 'Store was not created',
        variant: 'error',
      });
    },
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ['stores'] });
      void queryClient.invalidateQueries({ queryKey: ['store-options'] });
      showToast({
        title: 'Store created',
        variant: 'success',
      });
      router.push('/masters/stores');
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    const parsed = storeSchema.safeParse(values);

    if (!parsed.success) {
      applyValidationErrors(form, parsed.error);
      return;
    }

    createStoreMutation.mutate({
      hospitalId: parsed.data.hospitalId,
      isActive: parsed.data.isActive,
      storeName: parsed.data.storeName,
    });
  });

  return (
    <FormShell
      backHref="/masters/stores"
      icon={Store}
      subtitle="Create a store for food and beverage inventory flow."
      title="Create Store"
    >
      <form
        className="grid gap-5"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            error={form.formState.errors.hospitalId?.message}
            label="Location"
            name="store-hospital"
          >
            <Select
              disabled={hospitalOptionsQuery.isLoading}
              id="store-hospital"
              {...form.register('hospitalId')}
            >
              <option value="">Select location</option>
              {hospitalOptionsQuery.data?.map((hospital) => (
                <option key={hospital.id} value={hospital.id}>
                  {formatLocationOption(hospital)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            error={form.formState.errors.storeName?.message}
            label="Store Name"
            name="store-name"
          >
            <Input id="store-name" {...form.register('storeName')} />
          </Field>
          <Field
            label="Store Code"
            name="store-code"
          >
            <Input id="store-code" readOnly value="Auto-generated after save" />
          </Field>
        </div>
        <CheckboxLine
          input={<input className="h-4 w-4" type="checkbox" {...form.register('isActive')} />}
        >
          Active
        </CheckboxLine>
        <FormWarning
          isVisible={hospitalOptionsQuery.isError}
          message={getApiErrorMessage(hospitalOptionsQuery.error)}
        />
        <div className="flex justify-end">
          <SubmitButton
            disabled={!canSubmitStore}
            isPending={createStoreMutation.isPending}
            label="Create Store"
          />
        </div>
      </form>
    </FormShell>
  );
}

export function KitchenCreatePageClient() {
  const form = useForm<KitchenFormValues>({
    defaultValues: {
      hospitalId: '',
      isActive: true,
      kitchenName: '',
    },
  });
  const hospitalId = form.watch('hospitalId');
  const kitchenName = form.watch('kitchenName');
  const hospitalOptionsQuery = useHospitalOptions();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showToast } = useToast();
  const canSubmitKitchen = isUuid(hospitalId) && hasRequiredText(kitchenName);

  const createKitchenMutation = useMutation({
    mutationFn: (body: KitchenInput) => organizationApi.createKitchen(body),
    onError(error) {
      showToast({
        description: getApiErrorMessage(error),
        title: 'Kitchen was not created',
        variant: 'error',
      });
    },
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ['kitchens'] });
      void queryClient.invalidateQueries({ queryKey: ['kitchen-options'] });
      showToast({
        title: 'Kitchen created',
        variant: 'success',
      });
      router.push('/masters/kitchens');
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    const parsed = kitchenSchema.safeParse(values);

    if (!parsed.success) {
      applyValidationErrors(form, parsed.error);
      return;
    }

    createKitchenMutation.mutate({
      hospitalId: parsed.data.hospitalId,
      isActive: parsed.data.isActive,
      kitchenName: parsed.data.kitchenName,
    });
  });

  return (
    <FormShell
      backHref="/masters/kitchens"
      icon={ChefHat}
      subtitle="Create a kitchen for location food production."
      title="Create Kitchen"
    >
      <form
        className="grid gap-5"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            error={form.formState.errors.hospitalId?.message}
            label="Location"
            name="kitchen-hospital"
          >
            <Select
              disabled={hospitalOptionsQuery.isLoading}
              id="kitchen-hospital"
              {...form.register('hospitalId')}
            >
              <option value="">Select location</option>
              {hospitalOptionsQuery.data?.map((hospital) => (
                <option key={hospital.id} value={hospital.id}>
                  {formatLocationOption(hospital)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            error={form.formState.errors.kitchenName?.message}
            label="Kitchen Name"
            name="kitchen-name"
          >
            <Input id="kitchen-name" {...form.register('kitchenName')} />
          </Field>
          <Field
            label="Kitchen Code"
            name="kitchen-code"
          >
            <Input id="kitchen-code" readOnly value="Auto-generated after save" />
          </Field>
        </div>
        <CheckboxLine
          input={<input className="h-4 w-4" type="checkbox" {...form.register('isActive')} />}
        >
          Active
        </CheckboxLine>
        <FormWarning
          isVisible={hospitalOptionsQuery.isError}
          message={getApiErrorMessage(hospitalOptionsQuery.error)}
        />
        <div className="flex justify-end">
          <SubmitButton
            disabled={!canSubmitKitchen}
            isPending={createKitchenMutation.isPending}
            label="Create Kitchen"
          />
        </div>
      </form>
    </FormShell>
  );
}

function RestaurantFormPageClient({ restaurantId }: Readonly<{ restaurantId?: string }>) {
  const isEditMode = Boolean(restaurantId);
  const form = useForm<RestaurantFormValues>({
    defaultValues: restaurantFormDefaultValues,
  });
  const hospitalId = form.watch('hospitalId');
  const restaurantName = form.watch('restaurantName');
  const hospitalOptionsQuery = useHospitalOptions();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showToast } = useToast();
  const [coverFile, setCoverFile] = useState<File | undefined>();
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | undefined>();
  const [imageErrors, setImageErrors] = useState<{ cover?: string; thumbnail?: string }>({});
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | undefined>();
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | undefined>();
  const canSubmitRestaurant = isUuid(hospitalId) && hasRequiredText(restaurantName);

  const restaurantQuery = useQuery({
    enabled: isEditMode,
    queryFn: async () => {
      const response = await organizationApi.getRestaurant(restaurantId!);

      return response.data;
    },
    queryKey: ['restaurant', restaurantId],
  });

  useEffect(() => {
    if (!restaurantQuery.data) {
      return;
    }

    form.reset(toRestaurantFormDefaults(restaurantQuery.data));
    setThumbnailPreviewUrl(restaurantQuery.data.thumbnailUrl ?? undefined);
    setCoverPreviewUrl(restaurantQuery.data.coverImageUrl ?? undefined);
    setThumbnailFile(undefined);
    setCoverFile(undefined);
  }, [form, restaurantQuery.data]);

  useEffect(() => {
    return () => {
      if (isObjectUrl(coverPreviewUrl)) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
    };
  }, [coverPreviewUrl]);

  useEffect(() => {
    return () => {
      if (isObjectUrl(thumbnailPreviewUrl)) {
        URL.revokeObjectURL(thumbnailPreviewUrl);
      }
    };
  }, [thumbnailPreviewUrl]);

  const saveRestaurantMutation = useMutation({
    mutationFn: (body: RestaurantInput) =>
      restaurantId
        ? organizationApi.updateRestaurant(restaurantId, body)
        : organizationApi.createRestaurant(body),
    onSuccess(response) {
      void queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      void queryClient.invalidateQueries({ queryKey: ['restaurant-options'] });
      if (restaurantId) {
        void queryClient.invalidateQueries({ queryKey: ['restaurant', restaurantId] });
      }
      showToast({
        description: response.data.restaurantCode
          ? `Restaurant Code: ${response.data.restaurantCode}`
          : undefined,
        title: restaurantId ? 'Restaurant updated' : 'Restaurant created',
        variant: 'success',
      });
      router.push('/masters/restaurants');
    },
  });

  const handleImageChange =
    (imageType: 'cover' | 'thumbnail') => (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      const error = getRestaurantImageError(file);

      if (error) {
        setImageErrors((current) => ({ ...current, [imageType]: error }));
        event.target.value = '';
        return;
      }

      const previewUrl = URL.createObjectURL(file);

      setImageErrors((current) => ({ ...current, [imageType]: undefined }));

      if (imageType === 'thumbnail') {
        setThumbnailFile(file);
        setThumbnailPreviewUrl((currentPreviewUrl) => {
          if (isObjectUrl(currentPreviewUrl)) URL.revokeObjectURL(currentPreviewUrl);
          return previewUrl;
        });
      } else {
        setCoverFile(file);
        setCoverPreviewUrl((currentPreviewUrl) => {
          if (isObjectUrl(currentPreviewUrl)) URL.revokeObjectURL(currentPreviewUrl);
          return previewUrl;
        });
      }
    };

  const handleSubmit = form.handleSubmit(async (values) => {
    const parsed = restaurantSchema.safeParse(values);

    if (!parsed.success) {
      applyValidationErrors(form, parsed.error);
      return;
    }

    setIsUploadingImages(true);

    try {
      const [thumbnailUrl, coverImageUrl] = await Promise.all([
        thumbnailFile
          ? uploadRestaurantImage(thumbnailFile)
          : Promise.resolve(restaurantQuery.data?.thumbnailUrl ?? undefined),
        coverFile
          ? uploadRestaurantImage(coverFile)
          : Promise.resolve(restaurantQuery.data?.coverImageUrl ?? undefined),
      ]);

      await saveRestaurantMutation.mutateAsync(
        toRestaurantInput(parsed.data, {
          coverImageUrl,
          thumbnailUrl,
        }),
      );
    } catch (error) {
      showToast({
        description: getApiErrorMessage(error),
        title: restaurantId ? 'Restaurant was not updated' : 'Restaurant was not created',
        variant: 'error',
      });
    } finally {
      setIsUploadingImages(false);
    }
  });

  if (isEditMode && restaurantQuery.isLoading) {
    return (
      <FormShell
        backHref="/masters/restaurants"
        icon={Utensils}
        subtitle="Load restaurant details for editing."
        title="Update Restaurant"
      >
        <div className="grid gap-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-64" />
          <Skeleton className="h-40" />
        </div>
      </FormShell>
    );
  }

  if (isEditMode && restaurantQuery.isError) {
    return (
      <FormShell
        backHref="/masters/restaurants"
        icon={Utensils}
        subtitle="Load restaurant details for editing."
        title="Update Restaurant"
      >
        <p className="text-sm font-medium text-red-600">
          {getApiErrorMessage(restaurantQuery.error)}
        </p>
      </FormShell>
    );
  }

  return (
    <FormShell
      backHref="/masters/restaurants"
      icon={Utensils}
      subtitle={
        isEditMode
          ? 'Update restaurant profile for location food service.'
          : 'Create a restaurant profile for location food service.'
      }
      title={isEditMode ? 'Update Restaurant' : 'Create Restaurant'}
    >
      <form
        className="grid gap-7"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      >
        <div className="space-y-4">
          <SectionHeading title="Basic Information" />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              error={form.formState.errors.hospitalId?.message}
              label="Location"
              name="restaurant-location"
            >
              <Select
                disabled={hospitalOptionsQuery.isLoading}
                id="restaurant-location"
                {...form.register('hospitalId')}
              >
                <option value="">Select location</option>
                {hospitalOptionsQuery.data?.map((hospital) => (
                  <option key={hospital.id} value={hospital.id}>
                    {formatRestaurantLocationOption(hospital)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              error={form.formState.errors.restaurantName?.message}
              label="Name"
              name="restaurant-name"
            >
              <Input id="restaurant-name" {...form.register('restaurantName')} />
            </Field>
            {isEditMode ? (
              <Field label="Restaurant Code" name="restaurant-code">
                <Input
                  id="restaurant-code"
                  readOnly
                  value={restaurantQuery.data?.restaurantCode ?? 'Auto-generated'}
                />
              </Field>
            ) : null}
            <Field error={form.formState.errors.email?.message} label="Email" name="restaurant-email">
              <Input id="restaurant-email" {...form.register('email')} />
            </Field>
            <Field
              error={form.formState.errors.mobile?.message}
              label="Mobile"
              name="restaurant-mobile"
            >
              <Input id="restaurant-mobile" {...form.register('mobile')} />
            </Field>
          </div>
          <CheckboxLine
            input={<input className="h-4 w-4" type="checkbox" {...form.register('isActive')} />}
          >
            Active
          </CheckboxLine>
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-6">
          <SectionHeading title="FSSAI" />
          <Field
            error={form.formState.errors.fssaiNumbers?.message}
            label="FSSAI"
            name="restaurant-fssai"
          >
            <Input
              id="restaurant-fssai"
              placeholder="12345678901234, 98765432109876"
              {...form.register('fssaiNumbers')}
            />
          </Field>
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-6">
          <SectionHeading title="Images" />
          <div className="grid gap-5 sm:grid-cols-2">
            <ImageUploadField
              error={imageErrors.thumbnail}
              id="restaurant-thumbnail"
              label="Thumbnail upload"
              onChange={handleImageChange('thumbnail')}
              previewUrl={thumbnailPreviewUrl}
            />
            <ImageUploadField
              error={imageErrors.cover}
              id="restaurant-cover"
              label="Cover upload"
              onChange={handleImageChange('cover')}
              previewUrl={coverPreviewUrl}
            />
          </div>
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-6">
          <SectionHeading title="GST Information" />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              error={form.formState.errors.panNumber?.message}
              label="PAN Number"
              name="restaurant-pan"
            >
              <Input id="restaurant-pan" {...form.register('panNumber')} />
            </Field>
            <Field
              error={form.formState.errors.gstNumber?.message}
              label="GST Number"
              name="restaurant-gst"
            >
              <Input id="restaurant-gst" {...form.register('gstNumber')} />
            </Field>
            <Field
              error={form.formState.errors.legalName?.message}
              label="Legal Name"
              name="restaurant-legal-name"
            >
              <Input id="restaurant-legal-name" {...form.register('legalName')} />
            </Field>
          </div>
          <Field
            error={form.formState.errors.address?.message}
            label="Address"
            name="restaurant-address"
          >
            <Input id="restaurant-address" {...form.register('address')} />
          </Field>
          <CheckboxLine
            input={
              <input
                className="h-4 w-4"
                type="checkbox"
                {...form.register('isRegisteredInGst')}
              />
            }
          >
            Registered in GST
          </CheckboxLine>
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-6">
          <SectionHeading title="Banking Information" />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              error={form.formState.errors.unitNameForQr?.message}
              label="Unit Name for QR Code"
              name="restaurant-qr-unit"
            >
              <Input id="restaurant-qr-unit" {...form.register('unitNameForQr')} />
            </Field>
            <Field
              error={form.formState.errors.bankNameBranch?.message}
              label="Bank Name & Branch"
              name="restaurant-bank"
            >
              <Input id="restaurant-bank" {...form.register('bankNameBranch')} />
            </Field>
            <Field
              error={form.formState.errors.ifscCode?.message}
              label="IFSC Code"
              name="restaurant-ifsc"
            >
              <Input id="restaurant-ifsc" {...form.register('ifscCode')} />
            </Field>
            <Field
              error={form.formState.errors.accountNumber?.message}
              label="Account Number"
              name="restaurant-account"
            >
              <Input id="restaurant-account" {...form.register('accountNumber')} />
            </Field>
            <Field error={form.formState.errors.upiId?.message} label="UPI ID" name="restaurant-upi">
              <Input id="restaurant-upi" {...form.register('upiId')} />
            </Field>
          </div>
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-6">
          <SectionHeading title="More Options" />
          <div className="grid gap-3 md:grid-cols-3">
            {[
              ['isOffline', 'Offline'],
              ['isOpen24x7', 'Open 24x7'],
              ['isVegOnly', 'Veg Only'],
              ['isTakeawayEnabled', 'Takeaway'],
              ['isDeliveryEnabled', 'Delivery'],
              ['isHomeDeliveryEnabled', 'Home Delivery'],
              ['isAtTableDiningEnabled', 'At Table Dining'],
              ['isInRoomDiningEnabled', 'In Room Dining'],
              ['isInCarDiningEnabled', 'In Car Dining'],
              ['isPosOrdersEnabled', 'POS Orders'],
              ['isOnlineOrdersEnabled', 'Online Orders'],
              ['isInventoryEnabled', 'Inventory'],
            ].map(([name, label]) => (
              <CheckboxLine
                input={
                  <input
                    className="h-4 w-4"
                    type="checkbox"
                    {...form.register(name as Path<RestaurantFormValues>)}
                  />
                }
                key={name}
              >
                {label}
              </CheckboxLine>
            ))}
          </div>
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-6">
          <SectionHeading title="Sodexo Information" />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              error={form.formState.errors.sodexoMid?.message}
              label="Sodexo MID"
              name="restaurant-sodexo-mid"
            >
              <Input id="restaurant-sodexo-mid" {...form.register('sodexoMid')} />
            </Field>
            <Field
              error={form.formState.errors.sodexoTid?.message}
              label="Sodexo TID"
              name="restaurant-sodexo-tid"
            >
              <Input id="restaurant-sodexo-tid" {...form.register('sodexoTid')} />
            </Field>
          </div>
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-6">
          <SectionHeading title="ERP Fields" />
          <div className="grid gap-5 sm:grid-cols-3">
            <Field error={form.formState.errors.sunBu?.message} label="Field SUN BU" name="restaurant-sun-bu">
              <Input id="restaurant-sun-bu" {...form.register('sunBu')} />
            </Field>
            <Field error={form.formState.errors.sunT1?.message} label="Field T1" name="restaurant-sun-t1">
              <Input id="restaurant-sun-t1" {...form.register('sunT1')} />
            </Field>
            <Field error={form.formState.errors.sunT2?.message} label="Field T2" name="restaurant-sun-t2">
              <Input id="restaurant-sun-t2" {...form.register('sunT2')} />
            </Field>
          </div>
        </div>
        <FormWarning
          isVisible={hospitalOptionsQuery.isError}
          message={getApiErrorMessage(hospitalOptionsQuery.error)}
        />
        <div className="flex justify-end">
          <SubmitButton
            disabled={!canSubmitRestaurant}
            isPending={saveRestaurantMutation.isPending || isUploadingImages}
            label={isEditMode ? 'Update Restaurant' : 'Create Restaurant'}
          />
        </div>
      </form>
    </FormShell>
  );
}

export function RestaurantCreatePageClient() {
  return <RestaurantFormPageClient />;
}

export function RestaurantEditPageClient({ restaurantId }: Readonly<{ restaurantId: string }>) {
  return <RestaurantFormPageClient restaurantId={restaurantId} />;
}

export function CounterCreatePageClient() {
  const form = useForm<CounterFormValues>({
    defaultValues: {
      counterCode: '',
      counterName: '',
      hospitalId: '',
      isActive: true,
      paymentDeviceId: '',
      pineLabsDeviceId: '',
      posDeviceId: '',
      restaurantId: '',
    },
  });
  const hospitalId = form.watch('hospitalId');
  const hospitalOptionsQuery = useHospitalOptions();
  const restaurantOptionsQuery = useRestaurantOptions(hospitalId);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showToast } = useToast();
  const createCounterMutation = useMutation({
    mutationFn: (body: CounterInput) => organizationApi.createCounter(body),
    onError(error) {
      showToast({
        description: getApiErrorMessage(error),
        title: 'Counter was not created',
        variant: 'error',
      });
    },
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ['counters'] });
      showToast({
        title: 'Counter created',
        variant: 'success',
      });
      router.push('/masters/counters');
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    const parsed = counterSchema.safeParse(values);

    if (!parsed.success) {
      applyValidationErrors(form, parsed.error);
      return;
    }

    createCounterMutation.mutate({
      counterCode: parsed.data.counterCode,
      counterName: parsed.data.counterName,
      hospitalId: parsed.data.hospitalId,
      isActive: parsed.data.isActive,
      paymentDeviceId: optionalValue(parsed.data.paymentDeviceId),
      pineLabsDeviceId: optionalValue(parsed.data.pineLabsDeviceId),
      posDeviceId: optionalValue(parsed.data.posDeviceId),
      restaurantId: parsed.data.restaurantId,
    });
  });

  return (
    <FormShell
      backHref="/masters/counters"
      icon={CreditCard}
      subtitle="Create a counter for restaurant billing and service."
      title="Create Counter"
    >
      <form
        className="grid gap-5"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            error={form.formState.errors.hospitalId?.message}
            label="Location"
            name="counter-hospital"
          >
            <Select
              disabled={hospitalOptionsQuery.isLoading}
              id="counter-hospital"
              {...form.register('hospitalId')}
            >
              <option value="">Select location</option>
              {hospitalOptionsQuery.data?.map((hospital) => (
                <option key={hospital.id} value={hospital.id}>
                  {formatLocationOption(hospital)}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            error={form.formState.errors.restaurantId?.message}
            label="Restaurant"
            name="counter-restaurant"
          >
            <Select
              disabled={!hospitalId || restaurantOptionsQuery.isLoading}
              id="counter-restaurant"
              {...form.register('restaurantId')}
            >
              <option value="">Select restaurant</option>
              {restaurantOptionsQuery.data?.map((restaurant) => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.restaurantName}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            error={form.formState.errors.counterName?.message}
            label="Counter Name"
            name="counter-name"
          >
            <Input id="counter-name" {...form.register('counterName')} />
          </Field>
          <Field
            error={form.formState.errors.counterCode?.message}
            label="Counter Code"
            name="counter-code"
          >
            <Input id="counter-code" {...form.register('counterCode')} />
          </Field>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <Field
            error={form.formState.errors.posDeviceId?.message}
            label="POS Device ID"
            name="counter-pos-device"
          >
            <Input id="counter-pos-device" {...form.register('posDeviceId')} />
          </Field>
          <Field
            error={form.formState.errors.paymentDeviceId?.message}
            label="Payment Device ID"
            name="counter-payment-device"
          >
            <Input id="counter-payment-device" {...form.register('paymentDeviceId')} />
          </Field>
          <Field
            error={form.formState.errors.pineLabsDeviceId?.message}
            label="Pine Labs Device ID"
            name="counter-pinelabs-device"
          >
            <Input id="counter-pinelabs-device" {...form.register('pineLabsDeviceId')} />
          </Field>
        </div>
        <CheckboxLine
          input={<input className="h-4 w-4" type="checkbox" {...form.register('isActive')} />}
        >
          Active
        </CheckboxLine>
        <FormWarning
          isVisible={hospitalOptionsQuery.isError || restaurantOptionsQuery.isError}
          message={getApiErrorMessage(hospitalOptionsQuery.error ?? restaurantOptionsQuery.error)}
        />
        <div className="flex justify-end">
          <SubmitButton isPending={createCounterMutation.isPending} label="Create Counter" />
        </div>
      </form>
    </FormShell>
  );
}

export function DashboardOverview() {
  const hospitalsQuery = useEntityTotal('hospitals', () =>
    organizationApi.listHospitals({ limit: 1 }),
  );
  const storesQuery = useEntityTotal('stores', () => organizationApi.listStores({ limit: 1 }));
  const kitchensQuery = useEntityTotal('kitchens', () =>
    organizationApi.listKitchens({ limit: 1 }),
  );
  const restaurantsQuery = useEntityTotal('restaurants', () =>
    organizationApi.listRestaurants({ limit: 1 }),
  );
  const itemsQuery = useEntityTotal('items', () => organizationApi.listItems({ limit: 1 }));
  const employeesQuery = useEntityTotal('employees', () =>
    organizationApi.listEmployees({ limit: 1 }),
  );
  const recentGrnsQuery = useQuery({
    queryFn: async () => {
      const response = await organizationApi.listGrns({
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      return response.data.items;
    },
    queryKey: ['dashboard', 'recent-grns'],
  });
  const recentTransfersQuery = useQuery({
    queryFn: async () => {
      const response = await organizationApi.listTransfers({
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      return response.data.items;
    },
    queryKey: ['dashboard', 'recent-transfers'],
  });
  const pendingTransfersQuery = useQuery({
    queryFn: async () => {
      const response = await organizationApi.listTransfers({
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        status: 'PENDING_ACKNOWLEDGEMENT',
      });

      return response.data;
    },
    queryKey: ['dashboard', 'pending-acknowledgements'],
  });

  const cards = [
    {
      href: '/masters/locations',
      icon: MapPin,
      label: 'Locations',
      query: hospitalsQuery,
      tone: 'teal' as const,
    },
    {
      href: '/masters/stores',
      icon: Store,
      label: 'Stores',
      query: storesQuery,
      tone: 'emerald' as const,
    },
    {
      href: '/masters/kitchens',
      icon: ChefHat,
      label: 'Kitchens',
      query: kitchensQuery,
      tone: 'amber' as const,
    },
    {
      href: '/masters/restaurants',
      icon: Utensils,
      label: 'Restaurants',
      query: restaurantsQuery,
      tone: 'violet' as const,
    },
    {
      href: '/masters/items',
      icon: PackageOpen,
      label: 'Items',
      query: itemsQuery,
      tone: 'blue' as const,
    },
    {
      href: '/masters/employees',
      icon: UsersRound,
      label: 'Employees',
      query: employeesQuery,
      tone: 'rose' as const,
    },
  ];

  return (
    <section className="space-y-6">
      <AppPageHeader
        action={
          <Button asChild>
            <Link href="/inventory/transfers">
              <ArrowRightLeft className="h-4 w-4" />
              Review Transfers
            </Link>
          </Button>
        }
        description="Monitor location food operations, inventory movements, and pending restaurant acknowledgements."
        eyebrow="Overview"
        icon={Building2}
        title="Dashboard"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <KpiCard
            href={card.href}
            icon={card.icon}
            key={card.href}
            label={card.label}
            loading={card.query.isLoading}
            tone={card.tone}
            trend="Configured master data"
            value={card.query.data ?? 0}
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <ChartCard
          description="Placeholder trend for upcoming restaurant operations and POS modules."
          title="Food Operations Trend"
        />
        <ChartCard description="Work that needs operational attention." title="Pending Actions">
          <div className="grid gap-3">
            <MetricTile
              icon={ClipboardList}
              label="Pending Acknowledgements"
              value={
                pendingTransfersQuery.isLoading
                  ? '...'
                  : (pendingTransfersQuery.data?.meta.total ?? 0)
              }
            />
            <MetricTile
              icon={ArrowRightLeft}
              label="Recent Transfers"
              value={
                recentTransfersQuery.isLoading ? '...' : (recentTransfersQuery.data?.length ?? 0)
              }
            />
            <MetricTile
              icon={PackageOpen}
              label="Recent GRNs"
              value={recentGrnsQuery.isLoading ? '...' : (recentGrnsQuery.data?.length ?? 0)}
            />
          </div>
        </ChartCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ChartCard className="xl:col-span-1" title="Recent GRNs">
          {recentGrnsQuery.isLoading ? (
            <LoadingSkeleton rows={5} />
          ) : recentGrnsQuery.data && recentGrnsQuery.data.length > 0 ? (
            <div className="space-y-3">
              {recentGrnsQuery.data.map((grn) => (
                <Link
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                  href="/inventory/grns"
                  key={grn.id}
                >
                  <div>
                    <p className="font-medium text-slate-950 dark:text-white">{grn.grnNumber}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {grn.store.storeName} - {formatDate(grn.receivedDate)}
                    </p>
                  </div>
                  <DesignStatusBadge status={grn.status} />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No recent GRNs" description="Posted GRNs will appear here." />
          )}
        </ChartCard>

        <ChartCard className="xl:col-span-1" title="Recent Transfers">
          {recentTransfersQuery.isLoading ? (
            <LoadingSkeleton rows={5} />
          ) : recentTransfersQuery.data && recentTransfersQuery.data.length > 0 ? (
            <div className="space-y-3">
              {recentTransfersQuery.data.map((transfer) => (
                <Link
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                  href="/inventory/transfers"
                  key={transfer.id}
                >
                  <div>
                    <p className="font-medium text-slate-950 dark:text-white">
                      {transfer.transferNumber}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {transfer.sourceType} to {transfer.destinationType} -{' '}
                      {formatDate(transfer.transferDate)}
                    </p>
                  </div>
                  <DesignStatusBadge status={transfer.status} />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No recent transfers"
              description="Dispatched transfers will appear here."
            />
          )}
        </ChartCard>

        <ChartCard className="xl:col-span-1" title="Pending Acknowledgements">
          {pendingTransfersQuery.isLoading ? (
            <LoadingSkeleton rows={5} />
          ) : pendingTransfersQuery.data?.items.length ? (
            <div className="space-y-3">
              {pendingTransfersQuery.data.items.map((transfer) => (
                <Link
                  className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 transition hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950 dark:hover:bg-amber-900"
                  href="/inventory/transfers"
                  key={transfer.id}
                >
                  <div>
                    <p className="font-medium text-slate-950 dark:text-white">
                      {transfer.transferNumber}
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Awaiting restaurant acknowledgement
                    </p>
                  </div>
                  <DesignStatusBadge status={transfer.status} />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No pending acknowledgements"
              description="Restaurant acknowledgement tasks are clear."
            />
          )}
        </ChartCard>
      </div>
    </section>
  );
}
