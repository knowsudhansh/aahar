'use client';

import { Button } from '@aahar/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRightLeft,
  Building2,
  ChefHat,
  ClipboardList,
  CreditCard,
  Eye,
  Hospital,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  PackageOpen,
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
import { useEffect, useState, type ReactNode } from 'react';
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
import { Badge, Field, Input, Panel, Select, Skeleton } from '@/components/ui';
import { getApiErrorMessage, organizationApi } from '@/lib/api';
import { cn } from '@/lib/utils';

const listLimit = 10;
const skeletonRows = ['row-1', 'row-2', 'row-3', 'row-4', 'row-5'];
const optionalText = (maxLength: number) =>
  z.string().trim().max(maxLength, `Use ${maxLength} characters or fewer.`);
const optionalUuid = z.string().uuid().or(z.literal(''));
const timeField = z
  .string()
  .trim()
  .regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm format.');

const hospitalSchema = z.object({
  address: optionalText(255),
  billPrefix: optionalText(20),
  city: optionalText(80),
  gstApplicable: z.boolean(),
  hospitalCode: z.string().trim().min(1, 'Hospital code is required.').max(50),
  hospitalName: z.string().trim().min(1, 'Hospital name is required.').max(150),
  isActive: z.boolean(),
  state: optionalText(80),
});

const locationSchema = z.object({
  address: optionalText(255),
  area: optionalText(100),
  building: optionalText(100),
  floor: optionalText(50),
  hospitalId: z.string().uuid('Select a hospital.'),
  isActive: z.boolean(),
  locationName: z.string().trim().min(1, 'Location name is required.').max(150),
});

const storeSchema = z.object({
  address: optionalText(255),
  hospitalId: z.string().uuid('Select a hospital.'),
  isActive: z.boolean(),
  storeCode: z.string().trim().min(1, 'Store code is required.').max(50),
  storeName: z.string().trim().min(1, 'Store name is required.').max(150),
  storeType: optionalText(80),
});

const kitchenSchema = z.object({
  closingTime: timeField,
  hospitalId: z.string().uuid('Select a hospital.'),
  isActive: z.boolean(),
  kitchenCode: z.string().trim().min(1, 'Kitchen code is required.').max(50),
  kitchenName: z.string().trim().min(1, 'Kitchen name is required.').max(150),
  openingTime: timeField,
});

const restaurantSchema = z.object({
  address: optionalText(255),
  b2cQrEnabled: z.boolean(),
  closingTime: timeField,
  hospitalId: z.string().uuid('Select a hospital.'),
  inRoomDiningEnabled: z.boolean(),
  isActive: z.boolean(),
  kitchenId: optionalUuid,
  onlineOrderingEnabled: z.boolean(),
  openingTime: timeField,
  restaurantCode: z.string().trim().min(1, 'Restaurant code is required.').max(50),
  restaurantName: z.string().trim().min(1, 'Restaurant name is required.').max(150),
  storeId: optionalUuid,
});

const counterSchema = z.object({
  counterCode: z.string().trim().min(1, 'Counter code is required.').max(50),
  counterName: z.string().trim().min(1, 'Counter name is required.').max(150),
  hospitalId: z.string().uuid('Select a hospital.'),
  isActive: z.boolean(),
  paymentDeviceId: optionalText(100),
  pineLabsDeviceId: optionalText(100),
  posDeviceId: optionalText(100),
  restaurantId: z.string().uuid('Select a restaurant.'),
});

type ActiveFilter = '' | 'active' | 'inactive';
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

function optionalId(value: string | undefined): string | undefined {
  return value || undefined;
}

function isUuid(value: string | undefined): boolean {
  return z.string().uuid().safeParse(value).success;
}

function hasRequiredText(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function nullableText(value: string | null | undefined): string {
  return value || 'Not set';
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
              Create
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
        sortBy: 'hospitalName',
        sortOrder: 'asc',
      });

      return response.data.items;
    },
    queryKey: ['hospital-options'],
  });
}

function useStoreOptions(hospitalId?: string) {
  return useQuery<StoreRecord[]>({
    enabled: Boolean(hospitalId),
    queryFn: async () => {
      const response = await organizationApi.listStores({
        hospitalId,
        isActive: true,
        limit: 100,
        sortBy: 'storeName',
        sortOrder: 'asc',
      });

      return response.data.items;
    },
    queryKey: ['store-options', hospitalId],
  });
}

function useKitchenOptions(hospitalId?: string) {
  return useQuery<Kitchen[]>({
    enabled: Boolean(hospitalId),
    queryFn: async () => {
      const response = await organizationApi.listKitchens({
        hospitalId,
        isActive: true,
        limit: 100,
        sortBy: 'kitchenName',
        sortOrder: 'asc',
      });

      return response.data.items;
    },
    queryKey: ['kitchen-options', hospitalId],
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
  return (
    <EntityListPage<HospitalRecord>
      config={{
        columns: [
          {
            className: 'w-[28%]',
            header: 'Hospital',
            render: (hospital) => (
              <div>
                <p className="font-medium text-slate-950">{hospital.hospitalName}</p>
                <p className="text-xs text-slate-500">{hospital.hospitalCode}</p>
              </div>
            ),
          },
          {
            className: 'w-[22%]',
            header: 'City',
            render: (hospital) => nullableText(hospital.city),
          },
          {
            className: 'w-[18%]',
            header: 'State',
            render: (hospital) => nullableText(hospital.state),
          },
          {
            className: 'w-[18%]',
            header: 'Bill Prefix',
            render: (hospital) => nullableText(hospital.billPrefix),
          },
          {
            className: 'w-[24%]',
            header: 'Actions',
            render: (hospital) => (
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={`/masters/hospitals/${hospital.id}/locations#details`}>
                    <Eye className="h-4 w-4" />
                    View
                  </Link>
                </Button>
                <Button asChild className="bg-teal-600 hover:bg-teal-700" size="sm">
                  <Link href={`/masters/hospitals/${hospital.id}/locations#locations`}>
                    <MapPin className="h-4 w-4" />
                    Locations
                  </Link>
                </Button>
              </div>
            ),
          },
        ],
        createHref: '/masters/hospitals/new',
        emptyLabel: 'hospitals',
        entityKey: 'hospitals',
        icon: Hospital,
        list: (query) => organizationApi.listHospitals(query),
        sortOptions: [
          { label: 'Created date', value: 'createdAt' },
          { label: 'Hospital name', value: 'hospitalName' },
          { label: 'Hospital code', value: 'hospitalCode' },
          { label: 'City', value: 'city' },
          { label: 'State', value: 'state' },
          { label: 'Status', value: 'isActive' },
        ],
        subtitle: 'Manage hospitals using the AAHAR operating hierarchy.',
        title: 'Hospitals',
      }}
    />
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
        <Link href="/masters/hospitals">
          <ArrowLeft className="h-4 w-4" />
          Back to Hospitals
        </Link>
      </Button>
      <PageHeader
        eyebrow="Hospital Management"
        icon={Hospital}
        subtitle="View hospital details and manage service locations."
        title={hospital?.hospitalName ?? 'Hospital'}
      />
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <a href="#details">
            <Eye className="h-4 w-4" />
            Hospital Details
          </a>
        </Button>
        <Button asChild className="bg-teal-600 hover:bg-teal-700" size="sm">
          <a href="#locations">
            <MapPin className="h-4 w-4" />
            Locations
          </a>
        </Button>
      </div>

      <Panel className="p-5" id="details">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-normal text-slate-950">
              Hospital Details
            </h2>
            <p className="text-sm text-slate-500">Top-level setup for this hospital.</p>
          </div>
          {hospital ? <StatusBadge isActive={hospital.isActive} /> : null}
        </div>
        {hospitalQuery.isLoading ? (
          <div className="grid gap-3 md:grid-cols-3">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : hospitalQuery.isError ? (
          <p className="text-sm font-medium text-red-600">
            {getApiErrorMessage(hospitalQuery.error)}
          </p>
        ) : hospital ? (
          <div className="grid gap-4 text-sm md:grid-cols-3">
            <div>
              <p className="font-medium text-slate-500">Code</p>
              <p className="mt-1 font-semibold text-slate-950">{hospital.hospitalCode}</p>
            </div>
            <div>
              <p className="font-medium text-slate-500">City</p>
              <p className="mt-1 font-semibold text-slate-950">{nullableText(hospital.city)}</p>
            </div>
            <div>
              <p className="font-medium text-slate-500">State</p>
              <p className="mt-1 font-semibold text-slate-950">{nullableText(hospital.state)}</p>
            </div>
            <div>
              <p className="font-medium text-slate-500">Bill Prefix</p>
              <p className="mt-1 font-semibold text-slate-950">
                {nullableText(hospital.billPrefix)}
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-500">GST</p>
              <p className="mt-1 font-semibold text-slate-950">
                {hospital.gstApplicable ? 'Applicable' : 'Not applicable'}
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-500">Address</p>
              <p className="mt-1 font-semibold text-slate-950">{nullableText(hospital.address)}</p>
            </div>
          </div>
        ) : null}
      </Panel>

      <Panel className="p-5" id="locations">
        <div className="mb-5">
          <h2 className="text-lg font-semibold tracking-normal text-slate-950">Locations</h2>
          <p className="text-sm text-slate-500">
            Add floors, buildings, and service areas for this hospital.
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
            header: 'Hospital',
            render: (location) => location.hospital.hospitalName,
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
        subtitle: 'Manage hospital campus, floor, and service locations.',
        title: 'Locations',
      }}
    />
  );
}

export function StoresPageClient() {
  return (
    <EntityListPage<StoreRecord>
      config={{
        columns: [
          {
            className: 'w-[26%]',
            header: 'Store/F&B',
            render: (store) => (
              <div>
                <p className="font-medium text-slate-950">{store.storeName}</p>
                <p className="text-xs text-slate-500">{store.storeCode}</p>
              </div>
            ),
          },
          {
            className: 'w-[22%]',
            header: 'Hospital',
            render: (store) => store.hospital.hospitalName,
          },
          {
            className: 'w-[20%]',
            header: 'Location',
            render: (store) => store.location?.locationName ?? 'Not set',
          },
          {
            className: 'w-[18%]',
            header: 'Type',
            render: (store) => nullableText(store.storeType),
          },
        ],
        createHref: '/masters/stores/new',
        emptyLabel: 'stores',
        entityKey: 'stores',
        icon: Store,
        list: (query) => organizationApi.listStores(query),
        sortOptions: [
          { label: 'Created date', value: 'createdAt' },
          { label: 'Store name', value: 'storeName' },
          { label: 'Store code', value: 'storeCode' },
          { label: 'Store type', value: 'storeType' },
          { label: 'Status', value: 'isActive' },
        ],
        subtitle: 'Manage F&B stores linked to hospitals and locations.',
        title: 'Stores',
      }}
    />
  );
}

export function KitchensPageClient() {
  return (
    <EntityListPage<Kitchen>
      config={{
        columns: [
          {
            className: 'w-[26%]',
            header: 'Kitchen',
            render: (kitchen) => (
              <div>
                <p className="font-medium text-slate-950">{kitchen.kitchenName}</p>
                <p className="text-xs text-slate-500">{kitchen.kitchenCode}</p>
              </div>
            ),
          },
          {
            className: 'w-[22%]',
            header: 'Hospital',
            render: (kitchen) => kitchen.hospital.hospitalName,
          },
          {
            className: 'w-[20%]',
            header: 'Location',
            render: (kitchen) => kitchen.location?.locationName ?? 'Not set',
          },
          {
            className: 'w-[18%]',
            header: 'Hours',
            render: (kitchen) =>
              kitchen.openingTime || kitchen.closingTime
                ? `${nullableText(kitchen.openingTime)} to ${nullableText(kitchen.closingTime)}`
                : 'Not set',
          },
        ],
        createHref: '/masters/kitchens/new',
        emptyLabel: 'kitchens',
        entityKey: 'kitchens',
        icon: ChefHat,
        list: (query) => organizationApi.listKitchens(query),
        sortOptions: [
          { label: 'Created date', value: 'createdAt' },
          { label: 'Kitchen name', value: 'kitchenName' },
          { label: 'Kitchen code', value: 'kitchenCode' },
          { label: 'Status', value: 'isActive' },
        ],
        subtitle: 'Manage production kitchens for hospital food service.',
        title: 'Kitchens',
      }}
    />
  );
}

export function RestaurantsPageClient() {
  return (
    <EntityListPage<Restaurant>
      config={{
        columns: [
          {
            className: 'w-[26%]',
            header: 'Restaurant',
            render: (restaurant) => (
              <div>
                <p className="font-medium text-slate-950">{restaurant.restaurantName}</p>
                <p className="text-xs text-slate-500">{restaurant.restaurantCode}</p>
              </div>
            ),
          },
          {
            className: 'w-[20%]',
            header: 'Hospital',
            render: (restaurant) => restaurant.hospital.hospitalName,
          },
          {
            className: 'w-[18%]',
            header: 'Location',
            render: (restaurant) => restaurant.location?.locationName ?? 'Not set',
          },
          {
            className: 'w-[22%]',
            header: 'Store / Kitchen',
            render: (restaurant) =>
              `${restaurant.store?.storeName ?? 'No store'} / ${
                restaurant.kitchen?.kitchenName ?? 'No kitchen'
              }`,
          },
        ],
        createHref: '/masters/restaurants/new',
        emptyLabel: 'restaurants',
        entityKey: 'restaurants',
        icon: Utensils,
        list: (query) => organizationApi.listRestaurants(query),
        sortOptions: [
          { label: 'Created date', value: 'createdAt' },
          { label: 'Restaurant name', value: 'restaurantName' },
          { label: 'Restaurant code', value: 'restaurantCode' },
          { label: 'Status', value: 'isActive' },
        ],
        subtitle: 'Manage restaurants linked to hospital service areas.',
        title: 'Restaurants',
      }}
    />
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
            header: 'Hospital',
            render: (counter) => counter.hospital.hospitalName,
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
    defaultValues: {
      address: '',
      billPrefix: '',
      city: '',
      gstApplicable: true,
      hospitalCode: '',
      hospitalName: '',
      isActive: true,
      state: '',
    },
  });
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showToast } = useToast();
  const createHospitalMutation = useMutation({
    mutationFn: (body: HospitalInput) => organizationApi.createHospital(body),
    onError(error) {
      showToast({
        description: getApiErrorMessage(error),
        title: 'Hospital was not created',
        variant: 'error',
      });
    },
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ['hospitals'] });
      void queryClient.invalidateQueries({ queryKey: ['hospital-options'] });
      showToast({
        title: 'Hospital created',
        variant: 'success',
      });
      router.push('/masters/hospitals');
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    const parsed = hospitalSchema.safeParse(values);

    if (!parsed.success) {
      applyValidationErrors(form, parsed.error);
      return;
    }

    createHospitalMutation.mutate({
      address: optionalValue(parsed.data.address),
      billPrefix: optionalValue(parsed.data.billPrefix),
      city: optionalValue(parsed.data.city),
      gstApplicable: parsed.data.gstApplicable,
      hospitalCode: parsed.data.hospitalCode,
      hospitalName: parsed.data.hospitalName,
      isActive: parsed.data.isActive,
      state: optionalValue(parsed.data.state),
    });
  });

  return (
    <FormShell
      backHref="/masters/hospitals"
      icon={Hospital}
      subtitle="Create a hospital for food and cafeteria operations."
      title="Create Hospital"
    >
      <form
        className="grid gap-5"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            error={form.formState.errors.hospitalName?.message}
            label="Hospital Name"
            name="hospital-name"
          >
            <Input id="hospital-name" {...form.register('hospitalName')} />
          </Field>
          <Field
            error={form.formState.errors.hospitalCode?.message}
            label="Hospital Code"
            name="hospital-code"
          >
            <Input id="hospital-code" {...form.register('hospitalCode')} />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field error={form.formState.errors.city?.message} label="City" name="hospital-city">
            <Input id="hospital-city" {...form.register('city')} />
          </Field>
          <Field error={form.formState.errors.state?.message} label="State" name="hospital-state">
            <Input id="hospital-state" {...form.register('state')} />
          </Field>
          <Field
            error={form.formState.errors.billPrefix?.message}
            label="Bill Prefix"
            name="hospital-bill-prefix"
          >
            <Input id="hospital-bill-prefix" {...form.register('billPrefix')} />
          </Field>
        </div>
        <Field
          error={form.formState.errors.address?.message}
          label="Address"
          name="hospital-address"
        >
          <Input id="hospital-address" {...form.register('address')} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <CheckboxLine
            input={
              <input className="h-4 w-4" type="checkbox" {...form.register('gstApplicable')} />
            }
          >
            GST applicable
          </CheckboxLine>
          <CheckboxLine
            input={<input className="h-4 w-4" type="checkbox" {...form.register('isActive')} />}
          >
            Active
          </CheckboxLine>
        </div>
        <div className="flex justify-end">
          <SubmitButton isPending={createHospitalMutation.isPending} label="Create Hospital" />
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
      subtitle="Create a location under an active hospital."
      title="Create Location"
    >
      <form
        className="grid gap-5"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      >
        <Field
          error={form.formState.errors.hospitalId?.message}
          label="Hospital"
          name="location-hospital"
        >
          <Select
            disabled={hospitalOptionsQuery.isLoading}
            id="location-hospital"
            {...form.register('hospitalId')}
          >
            <option value="">Select hospital</option>
            {hospitalOptionsQuery.data?.map((hospital) => (
              <option key={hospital.id} value={hospital.id}>
                {hospital.hospitalName}
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
      address: '',
      hospitalId: '',
      isActive: true,
      storeCode: '',
      storeName: '',
      storeType: 'F&B',
    },
  });
  const hospitalId = form.watch('hospitalId');
  const storeName = form.watch('storeName');
  const storeCode = form.watch('storeCode');
  const hospitalOptionsQuery = useHospitalOptions();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showToast } = useToast();
  const canSubmitStore =
    isUuid(hospitalId) && hasRequiredText(storeName) && hasRequiredText(storeCode);

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
      address: optionalValue(parsed.data.address),
      hospitalId: parsed.data.hospitalId,
      isActive: parsed.data.isActive,
      storeCode: parsed.data.storeCode,
      storeName: parsed.data.storeName,
      storeType: optionalValue(parsed.data.storeType),
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
            label="Hospital"
            name="store-hospital"
          >
            <Select
              disabled={hospitalOptionsQuery.isLoading}
              id="store-hospital"
              {...form.register('hospitalId')}
            >
              <option value="">Select hospital</option>
              {hospitalOptionsQuery.data?.map((hospital) => (
                <option key={hospital.id} value={hospital.id}>
                  {hospital.hospitalName}
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
            error={form.formState.errors.storeCode?.message}
            label="Store Code"
            name="store-code"
          >
            <Input id="store-code" {...form.register('storeCode')} />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            error={form.formState.errors.storeType?.message}
            label="Store Type"
            name="store-type"
          >
            <Input id="store-type" {...form.register('storeType')} />
          </Field>
          <Field
            error={form.formState.errors.address?.message}
            label="Address"
            name="store-address"
          >
            <Input id="store-address" {...form.register('address')} />
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
      closingTime: '',
      hospitalId: '',
      isActive: true,
      kitchenCode: '',
      kitchenName: '',
      openingTime: '',
    },
  });
  const hospitalId = form.watch('hospitalId');
  const kitchenName = form.watch('kitchenName');
  const kitchenCode = form.watch('kitchenCode');
  const hospitalOptionsQuery = useHospitalOptions();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showToast } = useToast();
  const canSubmitKitchen =
    isUuid(hospitalId) && hasRequiredText(kitchenName) && hasRequiredText(kitchenCode);

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
      closingTime: optionalValue(parsed.data.closingTime),
      hospitalId: parsed.data.hospitalId,
      isActive: parsed.data.isActive,
      kitchenCode: parsed.data.kitchenCode,
      kitchenName: parsed.data.kitchenName,
      openingTime: optionalValue(parsed.data.openingTime),
    });
  });

  return (
    <FormShell
      backHref="/masters/kitchens"
      icon={ChefHat}
      subtitle="Create a kitchen for hospital food production."
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
            label="Hospital"
            name="kitchen-hospital"
          >
            <Select
              disabled={hospitalOptionsQuery.isLoading}
              id="kitchen-hospital"
              {...form.register('hospitalId')}
            >
              <option value="">Select hospital</option>
              {hospitalOptionsQuery.data?.map((hospital) => (
                <option key={hospital.id} value={hospital.id}>
                  {hospital.hospitalName}
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
            error={form.formState.errors.kitchenCode?.message}
            label="Kitchen Code"
            name="kitchen-code"
          >
            <Input id="kitchen-code" {...form.register('kitchenCode')} />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            error={form.formState.errors.openingTime?.message}
            label="Opening Time"
            name="kitchen-opening-time"
          >
            <Input
              id="kitchen-opening-time"
              placeholder="07:00"
              {...form.register('openingTime')}
            />
          </Field>
          <Field
            error={form.formState.errors.closingTime?.message}
            label="Closing Time"
            name="kitchen-closing-time"
          >
            <Input
              id="kitchen-closing-time"
              placeholder="22:00"
              {...form.register('closingTime')}
            />
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

export function RestaurantCreatePageClient() {
  const form = useForm<RestaurantFormValues>({
    defaultValues: {
      address: '',
      b2cQrEnabled: false,
      closingTime: '',
      hospitalId: '',
      inRoomDiningEnabled: false,
      isActive: true,
      kitchenId: '',
      onlineOrderingEnabled: false,
      openingTime: '',
      restaurantCode: '',
      restaurantName: '',
      storeId: '',
    },
  });
  const hospitalId = form.watch('hospitalId');
  const restaurantName = form.watch('restaurantName');
  const restaurantCode = form.watch('restaurantCode');
  const { setValue } = form;
  const hospitalOptionsQuery = useHospitalOptions();
  const storeOptionsQuery = useStoreOptions(hospitalId);
  const kitchenOptionsQuery = useKitchenOptions(hospitalId);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { showToast } = useToast();
  const canSubmitRestaurant =
    isUuid(hospitalId) && hasRequiredText(restaurantName) && hasRequiredText(restaurantCode);

  useEffect(() => {
    setValue('kitchenId', '');
    setValue('storeId', '');
  }, [hospitalId, setValue]);

  const createRestaurantMutation = useMutation({
    mutationFn: (body: RestaurantInput) => organizationApi.createRestaurant(body),
    onError(error) {
      showToast({
        description: getApiErrorMessage(error),
        title: 'Restaurant was not created',
        variant: 'error',
      });
    },
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ['restaurants'] });
      void queryClient.invalidateQueries({ queryKey: ['restaurant-options'] });
      showToast({
        title: 'Restaurant created',
        variant: 'success',
      });
      router.push('/masters/restaurants');
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    const parsed = restaurantSchema.safeParse(values);

    if (!parsed.success) {
      applyValidationErrors(form, parsed.error);
      return;
    }

    createRestaurantMutation.mutate({
      address: optionalValue(parsed.data.address),
      b2cQrEnabled: parsed.data.b2cQrEnabled,
      closingTime: optionalValue(parsed.data.closingTime),
      hospitalId: parsed.data.hospitalId,
      inRoomDiningEnabled: parsed.data.inRoomDiningEnabled,
      isActive: parsed.data.isActive,
      kitchenId: optionalId(parsed.data.kitchenId),
      onlineOrderingEnabled: parsed.data.onlineOrderingEnabled,
      openingTime: optionalValue(parsed.data.openingTime),
      restaurantCode: parsed.data.restaurantCode,
      restaurantName: parsed.data.restaurantName,
      storeId: optionalId(parsed.data.storeId),
    });
  });

  const hasOptionError =
    hospitalOptionsQuery.isError || storeOptionsQuery.isError || kitchenOptionsQuery.isError;
  const optionError =
    hospitalOptionsQuery.error ?? storeOptionsQuery.error ?? kitchenOptionsQuery.error;

  return (
    <FormShell
      backHref="/masters/restaurants"
      icon={Utensils}
      subtitle="Create a restaurant linked to a hospital location."
      title="Create Restaurant"
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
            label="Hospital"
            name="restaurant-hospital"
          >
            <Select
              disabled={hospitalOptionsQuery.isLoading}
              id="restaurant-hospital"
              {...form.register('hospitalId')}
            >
              <option value="">Select hospital</option>
              {hospitalOptionsQuery.data?.map((hospital) => (
                <option key={hospital.id} value={hospital.id}>
                  {hospital.hospitalName}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            error={form.formState.errors.restaurantName?.message}
            label="Restaurant Name"
            name="restaurant-name"
          >
            <Input id="restaurant-name" {...form.register('restaurantName')} />
          </Field>
          <Field
            error={form.formState.errors.restaurantCode?.message}
            label="Restaurant Code"
            name="restaurant-code"
          >
            <Input id="restaurant-code" {...form.register('restaurantCode')} />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            error={form.formState.errors.storeId?.message}
            label="Store/F&B"
            name="restaurant-store"
          >
            <Select
              disabled={!hospitalId || storeOptionsQuery.isLoading}
              id="restaurant-store"
              {...form.register('storeId')}
            >
              <option value="">No store selected</option>
              {storeOptionsQuery.data?.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.storeName}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            error={form.formState.errors.kitchenId?.message}
            label="Kitchen"
            name="restaurant-kitchen"
          >
            <Select
              disabled={!hospitalId || kitchenOptionsQuery.isLoading}
              id="restaurant-kitchen"
              {...form.register('kitchenId')}
            >
              <option value="">No kitchen selected</option>
              {kitchenOptionsQuery.data?.map((kitchen) => (
                <option key={kitchen.id} value={kitchen.id}>
                  {kitchen.kitchenName}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field
          error={form.formState.errors.address?.message}
          label="Address"
          name="restaurant-address"
        >
          <Input id="restaurant-address" {...form.register('address')} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            error={form.formState.errors.openingTime?.message}
            label="Opening Time"
            name="restaurant-opening-time"
          >
            <Input
              id="restaurant-opening-time"
              placeholder="07:00"
              {...form.register('openingTime')}
            />
          </Field>
          <Field
            error={form.formState.errors.closingTime?.message}
            label="Closing Time"
            name="restaurant-closing-time"
          >
            <Input
              id="restaurant-closing-time"
              placeholder="22:00"
              {...form.register('closingTime')}
            />
          </Field>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <CheckboxLine
            input={
              <input
                className="h-4 w-4"
                type="checkbox"
                {...form.register('onlineOrderingEnabled')}
              />
            }
          >
            Online ordering
          </CheckboxLine>
          <CheckboxLine
            input={
              <input
                className="h-4 w-4"
                type="checkbox"
                {...form.register('inRoomDiningEnabled')}
              />
            }
          >
            Room service
          </CheckboxLine>
          <CheckboxLine
            input={<input className="h-4 w-4" type="checkbox" {...form.register('b2cQrEnabled')} />}
          >
            B2C QR
          </CheckboxLine>
          <CheckboxLine
            input={<input className="h-4 w-4" type="checkbox" {...form.register('isActive')} />}
          >
            Active
          </CheckboxLine>
        </div>
        <FormWarning isVisible={hasOptionError} message={getApiErrorMessage(optionError)} />
        <div className="flex justify-end">
          <SubmitButton
            disabled={!canSubmitRestaurant}
            isPending={createRestaurantMutation.isPending}
            label="Create Restaurant"
          />
        </div>
      </form>
    </FormShell>
  );
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
            label="Hospital"
            name="counter-hospital"
          >
            <Select
              disabled={hospitalOptionsQuery.isLoading}
              id="counter-hospital"
              {...form.register('hospitalId')}
            >
              <option value="">Select hospital</option>
              {hospitalOptionsQuery.data?.map((hospital) => (
                <option key={hospital.id} value={hospital.id}>
                  {hospital.hospitalName}
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
      href: '/masters/hospitals',
      icon: Hospital,
      label: 'Hospitals',
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
        description="Monitor hospital food operations, inventory movements, and pending restaurant acknowledgements."
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
