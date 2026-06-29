'use client';

import { Button } from '@aahar/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Loader2, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm, type FieldValues, type Path, type UseFormReturn } from 'react-hook-form';
import { z, type ZodError } from 'zod';
import type {
  Hospital,
  PaymentMachine,
  PaymentMachineInput,
  PosDevice,
  PosDeviceInput,
  PrimaryUpiProvider,
} from '@aahar/api-client';
import { AppPageHeader } from '@/components/design-system';
import { useToast } from '@/components/toast-provider';
import { Badge, Field, Input, Panel, Select, Skeleton } from '@/components/ui';
import { getApiErrorMessage, organizationApi } from '@/lib/api';
import { cn } from '@/lib/utils';

const pageLimit = 10;
const primaryUpiValues: PrimaryUpiProvider[] = ['PHONEPE', 'BHARATPE', 'GOOGLE_PAY', 'OTHER'];

const optionalText = (maxLength: number) =>
  z.string().trim().max(maxLength, `Use ${maxLength} characters or fewer.`);

const posDeviceSchema = z.object({
  code: z.string().trim().min(1, 'Code is required.').max(50),
  entity: optionalText(150),
  hospitalId: z.string().uuid('Select a location.'),
  hostName: optionalText(150),
  isActive: z.boolean(),
  isInvoicePrintEnabled: z.boolean(),
  isKotPrintEnabled: z.boolean(),
  name: z.string().trim().min(1, 'Name is required.').max(150),
  restaurantIds: z.array(z.string().uuid()).default([]),
});

const paymentMachineSchema = z.object({
  hospitalId: z.string().uuid('Select a location.'),
  isActive: z.boolean(),
  name: z.string().trim().min(1, 'Name is required.').max(150),
  pinelabImei: optionalText(100),
  pinelabMerchantId: optionalText(150),
  pinelabMerchantStorePosCode: optionalText(150),
  pinelabSecurityToken: optionalText(500),
  posDeviceId: z.string().uuid('Select a POS device.'),
  primaryUpi: z.custom<PrimaryUpiProvider | ''>(
    (value) => value === '' || primaryUpiValues.includes(value as PrimaryUpiProvider),
    { message: 'Select a valid UPI provider.' },
  ),
  serialNumber: optionalText(100),
});

type PosDeviceFormValues = z.infer<typeof posDeviceSchema>;
type PaymentMachineFormValues = z.infer<typeof paymentMachineSchema>;
type ActiveFilter = '' | 'active' | 'inactive';

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function activeFilterToBoolean(value: ActiveFilter): boolean | undefined {
  if (value === 'active') return true;
  if (value === 'inactive') return false;
  return undefined;
}

function applyValidationErrors<TValues extends FieldValues>(
  form: UseFormReturn<TValues>,
  error: ZodError,
) {
  form.clearErrors();
  error.issues.forEach((issue) => {
    const fieldName = issue.path[0];

    if (typeof fieldName === 'string') {
      form.setError(fieldName as Path<TValues>, { message: issue.message });
    }
  });
}

function optionalValue(value: string | undefined): string | undefined {
  return value?.trim() || undefined;
}

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

function formatLocationOption(hospital: Hospital): string {
  const details = [hospital.city, hospital.state, hospital.address].filter(Boolean).join(', ');

  return `${hospital.hospitalCode} - ${hospital.hospitalName}${
    details ? `, ${details}` : ''
  } (${hospital.hospitalCode})`;
}

function formatUpiProvider(value: PrimaryUpiProvider | null | undefined): string {
  if (!value) return 'Not set';

  return value
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

function formatRestaurants(restaurants: PosDevice['restaurants']): string {
  if (restaurants.length === 0) {
    return 'Not mapped';
  }

  return restaurants.map((restaurant) => restaurant.restaurantName).join(', ');
}

function StatusPill({ isActive }: Readonly<{ isActive: boolean }>) {
  return <Badge variant={isActive ? 'success' : 'danger'}>{isActive ? 'Active' : 'Inactive'}</Badge>;
}

function BooleanPill({ value }: Readonly<{ value: boolean }>) {
  return <Badge variant={value ? 'success' : 'neutral'}>{value ? 'Enabled' : 'Disabled'}</Badge>;
}

function TableState({
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
        {['one', 'two', 'three', 'four'].map((row) => (
          <tr key={row}>
            <td className="px-4 py-4" colSpan={colSpan}>
              <Skeleton className="h-9 w-full" />
            </td>
          </tr>
        ))}
      </>
    );
  }

  if (isError) {
    return (
      <tr>
        <td className="px-4 py-12 text-center text-sm font-medium text-red-600" colSpan={colSpan}>
          {getApiErrorMessage(error)}
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="px-4 py-12 text-center" colSpan={colSpan}>
        <p className="text-sm font-semibold text-slate-950 dark:text-white">No {label} found</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Add a record or adjust the filters.
        </p>
      </td>
    </tr>
  );
}

function PaginationControls({
  onPageChange,
  page,
  total,
  totalPages,
}: Readonly<{
  onPageChange: (page: number) => void;
  page: number;
  total: number;
  totalPages: number;
}>) {
  const safeTotalPages = Math.max(totalPages, 1);

  return (
    <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
      <span>
        Page {page} of {safeTotalPages} · {total} records
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

function FilterBar({
  activeFilter,
  onActiveFilterChange,
  onRefresh,
  onSearchChange,
  search,
}: Readonly<{
  activeFilter: ActiveFilter;
  onActiveFilterChange: (value: ActiveFilter) => void;
  onRefresh: () => void;
  onSearchChange: (value: string) => void;
  search: string;
}>) {
  return (
    <div className="grid gap-3 border-b p-4 dark:border-slate-800 md:grid-cols-[minmax(0,1fr)_160px_auto]">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          className="pl-9"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search"
          type="search"
          value={search}
        />
      </div>
      <Select
        onChange={(event) => onActiveFilterChange(event.target.value as ActiveFilter)}
        value={activeFilter}
      >
        <option value="">All status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </Select>
      <Button onClick={onRefresh} type="button" variant="outline">
        <RefreshCw className="h-4 w-4" />
        Refresh
      </Button>
    </div>
  );
}

function FormActions({
  isPending,
  isEditing,
  onCancel,
}: Readonly<{
  isEditing: boolean;
  isPending: boolean;
  onCancel: () => void;
}>) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
      <Button onClick={onCancel} type="button" variant="outline">
        Cancel
      </Button>
      <Button className="bg-teal-600 hover:bg-teal-700" disabled={isPending} type="submit">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {isEditing ? 'Save Changes' : 'Add New'}
      </Button>
    </div>
  );
}

function useHospitalOptions() {
  return useQuery({
    queryFn: async () =>
      (
        await organizationApi.listHospitals({
          isActive: true,
          limit: 100,
          sortBy: 'hospitalName',
          sortOrder: 'asc',
        })
      ).data.items,
    queryKey: ['pos-location-options'],
  });
}

function useRestaurantOptions(hospitalId?: string) {
  return useQuery({
    enabled: Boolean(hospitalId),
    queryFn: async () =>
      (
        await organizationApi.listRestaurants({
          hospitalId,
          isActive: true,
          limit: 100,
          sortBy: 'restaurantName',
          sortOrder: 'asc',
        })
      ).data.items,
    queryKey: ['pos-restaurant-options', hospitalId],
  });
}

function usePosDeviceOptions(hospitalId?: string) {
  return useQuery({
    enabled: Boolean(hospitalId),
    queryFn: async () =>
      (
        await organizationApi.listPosDevices({
          hospitalId,
          isActive: true,
          limit: 100,
          sortBy: 'name',
          sortOrder: 'asc',
        })
      ).data.items,
    queryKey: ['payment-machine-pos-device-options', hospitalId],
  });
}

function PosDeviceForm({
  editingDevice,
  onCancel,
}: Readonly<{
  editingDevice?: PosDevice;
  onCancel: () => void;
}>) {
  const form = useForm<PosDeviceFormValues>({
    defaultValues: {
      code: '',
      entity: '',
      hospitalId: '',
      hostName: '',
      isActive: true,
      isInvoicePrintEnabled: false,
      isKotPrintEnabled: false,
      name: '',
      restaurantIds: [],
    },
  });
  const selectedHospitalId = form.watch('hospitalId');
  const selectedRestaurantIds = form.watch('restaurantIds');
  const hospitalsQuery = useHospitalOptions();
  const restaurantsQuery = useRestaurantOptions(selectedHospitalId);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  useEffect(() => {
    if (editingDevice) {
      form.reset({
        code: editingDevice.code,
        entity: editingDevice.entity ?? '',
        hospitalId: editingDevice.hospitalId,
        hostName: editingDevice.hostName ?? '',
        isActive: editingDevice.isActive,
        isInvoicePrintEnabled: editingDevice.isInvoicePrintEnabled,
        isKotPrintEnabled: editingDevice.isKotPrintEnabled,
        name: editingDevice.name,
        restaurantIds: editingDevice.restaurantIds,
      });
    } else {
      form.reset({
        code: '',
        entity: '',
        hospitalId: '',
        hostName: '',
        isActive: true,
        isInvoicePrintEnabled: false,
        isKotPrintEnabled: false,
        name: '',
        restaurantIds: [],
      });
    }
  }, [editingDevice, form]);

  const mutation = useMutation({
    mutationFn: (body: PosDeviceInput) =>
      editingDevice
        ? organizationApi.updatePosDevice(editingDevice.id, body)
        : organizationApi.createPosDevice(body),
    onError(error) {
      showToast({
        description: getApiErrorMessage(error),
        title: editingDevice ? 'POS device was not updated' : 'POS device was not created',
        variant: 'error',
      });
    },
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ['pos-devices'] });
      void queryClient.invalidateQueries({ queryKey: ['payment-machine-pos-device-options'] });
      showToast({
        title: editingDevice ? 'POS device updated' : 'POS device created',
        variant: 'success',
      });
      onCancel();
    },
  });

  const toggleRestaurant = (restaurantId: string) => {
    const nextIds = selectedRestaurantIds.includes(restaurantId)
      ? selectedRestaurantIds.filter((id) => id !== restaurantId)
      : [...selectedRestaurantIds, restaurantId];

    form.setValue('restaurantIds', nextIds, { shouldValidate: true });
  };

  const handleSubmit = form.handleSubmit((values) => {
    const parsed = posDeviceSchema.safeParse(values);

    if (!parsed.success) {
      applyValidationErrors(form, parsed.error);
      return;
    }

    mutation.mutate({
      code: parsed.data.code,
      entity: optionalValue(parsed.data.entity),
      hospitalId: parsed.data.hospitalId,
      hostName: optionalValue(parsed.data.hostName),
      isActive: parsed.data.isActive,
      isInvoicePrintEnabled: parsed.data.isInvoicePrintEnabled,
      isKotPrintEnabled: parsed.data.isKotPrintEnabled,
      name: parsed.data.name,
      restaurantIds: parsed.data.restaurantIds,
    });
  });

  return (
    <Panel className="p-5">
      <form
        className="grid gap-5"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      >
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
            {editingDevice ? 'Edit POS Device' : 'Create New POS Device'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure POS device setup only. Billing workflows are not part of this master.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Field error={form.formState.errors.hospitalId?.message} label="Location" name="pos-location">
            <Select id="pos-location" {...form.register('hospitalId')}>
              <option value="">Select location</option>
              {hospitalsQuery.data?.map((hospital) => (
                <option key={hospital.id} value={hospital.id}>
                  {formatLocationOption(hospital)}
                </option>
              ))}
            </Select>
          </Field>
          <Field error={form.formState.errors.name?.message} label="Name" name="pos-name">
            <Input id="pos-name" {...form.register('name')} />
          </Field>
          <Field error={form.formState.errors.code?.message} label="Code" name="pos-code">
            <Input id="pos-code" {...form.register('code')} />
          </Field>
          <Field error={form.formState.errors.entity?.message} label="Entity" name="pos-entity">
            <Input id="pos-entity" placeholder="Optional" {...form.register('entity')} />
          </Field>
          <Field error={form.formState.errors.hostName?.message} label="Host Name" name="pos-host">
            <Input id="pos-host" placeholder="Optional" {...form.register('hostName')} />
          </Field>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Restaurants</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Optional. Select one or more restaurants that can use this POS device.
            </p>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {!selectedHospitalId ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                Select a location to load restaurants.
              </div>
            ) : null}
            {selectedHospitalId && restaurantsQuery.isLoading ? <Skeleton className="h-11" /> : null}
            {selectedHospitalId && restaurantsQuery.data?.length === 0 ? (
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                No active restaurants found for this location.
              </div>
            ) : null}
            {restaurantsQuery.data?.map((restaurant) => (
              <label
                className="flex min-h-10 items-center gap-3 rounded-md border bg-white px-3 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                key={restaurant.id}
              >
                <input
                  checked={selectedRestaurantIds.includes(restaurant.id)}
                  className="h-4 w-4"
                  onChange={() => toggleRestaurant(restaurant.id)}
                  type="checkbox"
                />
                {restaurant.restaurantName}
              </label>
            ))}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="flex min-h-10 items-center gap-3 rounded-md border bg-white px-3 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            <input className="h-4 w-4" type="checkbox" {...form.register('isKotPrintEnabled')} />
            KOT Print
          </label>
          <label className="flex min-h-10 items-center gap-3 rounded-md border bg-white px-3 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            <input
              className="h-4 w-4"
              type="checkbox"
              {...form.register('isInvoicePrintEnabled')}
            />
            Invoice Print
          </label>
          <label className="flex min-h-10 items-center gap-3 rounded-md border bg-white px-3 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
            <input className="h-4 w-4" type="checkbox" {...form.register('isActive')} />
            Active
          </label>
        </div>
        <FormActions
          isEditing={Boolean(editingDevice)}
          isPending={mutation.isPending}
          onCancel={onCancel}
        />
      </form>
    </Panel>
  );
}

function PosDevicesTab() {
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('');
  const [editingDevice, setEditingDevice] = useState<PosDevice | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const query = useQuery({
    queryFn: async () =>
      (
        await organizationApi.listPosDevices({
          isActive: activeFilterToBoolean(activeFilter),
          limit: pageLimit,
          page,
          search,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        })
      ).data,
    queryKey: ['pos-devices', { activeFilter, page, search }],
  });
  const items = query.data?.items ?? [];
  const meta = query.data?.meta ?? { limit: pageLimit, page, total: 0, totalPages: 1 };
  const deleteMutation = useMutation({
    mutationFn: (id: string) => organizationApi.deletePosDevice(id),
    onError(error) {
      showToast({
        description: getApiErrorMessage(error),
        title: 'POS device was not deactivated',
        variant: 'error',
      });
    },
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ['pos-devices'] });
      void queryClient.invalidateQueries({ queryKey: ['payment-machine-pos-device-options'] });
      showToast({ title: 'POS device deactivated', variant: 'success' });
    },
  });

  const openCreateForm = () => {
    setEditingDevice(undefined);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button className="bg-teal-600 hover:bg-teal-700" onClick={openCreateForm} type="button">
          <Plus className="h-4 w-4" />
          Add New
        </Button>
      </div>
      {isFormOpen ? (
        <PosDeviceForm
          editingDevice={editingDevice}
          onCancel={() => {
            setEditingDevice(undefined);
            setIsFormOpen(false);
          }}
        />
      ) : null}
      <Panel>
        <FilterBar
          activeFilter={activeFilter}
          onActiveFilterChange={(value) => {
            setActiveFilter(value);
            setPage(1);
          }}
          onRefresh={() => void query.refetch()}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          search={search}
        />
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-normal text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="w-[16%] px-4 py-3">Name</th>
                <th className="w-[10%] px-4 py-3">Code</th>
                <th className="w-[16%] px-4 py-3">Location</th>
                <th className="w-[18%] px-4 py-3">Restaurants</th>
                <th className="w-[12%] px-4 py-3">Entity</th>
                <th className="w-[12%] px-4 py-3">Host Name</th>
                <th className="w-[10%] px-4 py-3">KOT Print</th>
                <th className="w-[10%] px-4 py-3">Invoice Print</th>
                <th className="w-[10%] px-4 py-3">Status</th>
                <th className="w-[14%] px-4 py-3">Created</th>
                <th className="w-[14%] px-4 py-3">Updated</th>
                <th className="w-[150px] px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-950">
              {items.length > 0 ? (
                items.map((device) => (
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-900" key={device.id}>
                    <td className="px-4 py-4 font-medium text-slate-950 dark:text-white">
                      {device.name}
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{device.code}</td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      {device.hospital.hospitalName}
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      {formatRestaurants(device.restaurants)}
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      {device.entity ?? 'Not set'}
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      {device.hostName ?? 'Not set'}
                    </td>
                    <td className="px-4 py-4">
                      <BooleanPill value={device.isKotPrintEnabled} />
                    </td>
                    <td className="px-4 py-4">
                      <BooleanPill value={device.isInvoicePrintEnabled} />
                    </td>
                    <td className="px-4 py-4">
                      <StatusPill isActive={device.isActive} />
                    </td>
                    <td className="px-4 py-4 text-slate-500">{formatDate(device.createdAt)}</td>
                    <td className="px-4 py-4 text-slate-500">{formatDate(device.updatedAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => {
                            setEditingDevice(device);
                            setIsFormOpen(true);
                          }}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          Edit
                        </Button>
                        <Button
                          className="border-red-200 text-red-700 hover:bg-red-50"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (window.confirm('Deactivate this POS device?')) {
                              deleteMutation.mutate(device.id);
                            }
                          }}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <TableState
                  colSpan={12}
                  error={query.error}
                  isError={query.isError}
                  isLoading={query.isLoading}
                  label="POS devices"
                />
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls
          onPageChange={setPage}
          page={meta.page}
          total={meta.total}
          totalPages={meta.totalPages}
        />
      </Panel>
    </div>
  );
}

function PaymentMachineForm({
  editingMachine,
  onCancel,
}: Readonly<{
  editingMachine?: PaymentMachine;
  onCancel: () => void;
}>) {
  const form = useForm<PaymentMachineFormValues>({
    defaultValues: {
      hospitalId: '',
      isActive: true,
      name: '',
      pinelabImei: '',
      pinelabMerchantId: '',
      pinelabMerchantStorePosCode: '',
      pinelabSecurityToken: '',
      posDeviceId: '',
      primaryUpi: '',
      serialNumber: '',
    },
  });
  const selectedHospitalId = form.watch('hospitalId');
  const hospitalsQuery = useHospitalOptions();
  const posDevicesQuery = usePosDeviceOptions(selectedHospitalId);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  useEffect(() => {
    if (editingMachine) {
      form.reset({
        hospitalId: editingMachine.hospitalId,
        isActive: editingMachine.isActive,
        name: editingMachine.name,
        pinelabImei: editingMachine.pinelabImei ?? '',
        pinelabMerchantId: editingMachine.pinelabMerchantId ?? '',
        pinelabMerchantStorePosCode: editingMachine.pinelabMerchantStorePosCode ?? '',
        pinelabSecurityToken: '',
        posDeviceId: editingMachine.posDeviceId,
        primaryUpi: editingMachine.primaryUpi ?? '',
        serialNumber: editingMachine.serialNumber ?? '',
      });
    } else {
      form.reset({
        hospitalId: '',
        isActive: true,
        name: '',
        pinelabImei: '',
        pinelabMerchantId: '',
        pinelabMerchantStorePosCode: '',
        pinelabSecurityToken: '',
        posDeviceId: '',
        primaryUpi: '',
        serialNumber: '',
      });
    }
  }, [editingMachine, form]);

  const mutation = useMutation({
    mutationFn: (body: PaymentMachineInput) =>
      editingMachine
        ? organizationApi.updatePaymentMachine(editingMachine.id, body)
        : organizationApi.createPaymentMachine(body),
    onError(error) {
      showToast({
        description: getApiErrorMessage(error),
        title: editingMachine
          ? 'Payment machine was not updated'
          : 'Payment machine was not created',
        variant: 'error',
      });
    },
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ['payment-machines'] });
      showToast({
        title: editingMachine ? 'Payment machine updated' : 'Payment machine created',
        variant: 'success',
      });
      onCancel();
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    const parsed = paymentMachineSchema.safeParse(values);

    if (!parsed.success) {
      applyValidationErrors(form, parsed.error);
      return;
    }

    const body: PaymentMachineInput = {
      hospitalId: parsed.data.hospitalId,
      isActive: parsed.data.isActive,
      name: parsed.data.name,
      pinelabImei: optionalValue(parsed.data.pinelabImei),
      pinelabMerchantId: optionalValue(parsed.data.pinelabMerchantId),
      pinelabMerchantStorePosCode: optionalValue(parsed.data.pinelabMerchantStorePosCode),
      pinelabSecurityToken: optionalValue(parsed.data.pinelabSecurityToken),
      posDeviceId: parsed.data.posDeviceId,
      primaryUpi: parsed.data.primaryUpi || undefined,
      serialNumber: optionalValue(parsed.data.serialNumber),
    };

    mutation.mutate(body);
  });

  return (
    <Panel className="p-5">
      <form
        className="grid gap-5"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      >
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
            {editingMachine ? 'Edit Payment Machine' : 'Create New Payment Machine'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure device metadata only. No Pine Labs calls or payment transactions are made.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            error={form.formState.errors.hospitalId?.message}
            label="Location"
            name="payment-location"
          >
            <Select id="payment-location" {...form.register('hospitalId')}>
              <option value="">Select location</option>
              {hospitalsQuery.data?.map((hospital) => (
                <option key={hospital.id} value={hospital.id}>
                  {formatLocationOption(hospital)}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            error={form.formState.errors.posDeviceId?.message}
            label="POS Device"
            name="payment-pos-device"
          >
            <Select
              disabled={!selectedHospitalId || posDevicesQuery.isLoading}
              id="payment-pos-device"
              {...form.register('posDeviceId')}
            >
              <option value="">Select POS device</option>
              {posDevicesQuery.data?.map((device) => (
                <option key={device.id} value={device.id}>
                  {device.name} ({device.code})
                </option>
              ))}
            </Select>
          </Field>
          <Field error={form.formState.errors.name?.message} label="Name" name="payment-name">
            <Input id="payment-name" {...form.register('name')} />
          </Field>
          <Field
            error={form.formState.errors.serialNumber?.message}
            label="Serial Number"
            name="payment-serial"
          >
            <Input id="payment-serial" placeholder="Optional" {...form.register('serialNumber')} />
          </Field>
          <Field
            error={form.formState.errors.pinelabMerchantId?.message}
            label="Pine Labs Merchant ID"
            name="payment-merchant"
          >
            <Input
              id="payment-merchant"
              placeholder="Optional"
              {...form.register('pinelabMerchantId')}
            />
          </Field>
          <Field
            error={form.formState.errors.pinelabSecurityToken?.message}
            label="Pine Labs Security Token"
            name="payment-token"
          >
            <Input
              id="payment-token"
              placeholder={editingMachine ? 'Leave blank to keep existing token' : 'Optional'}
              type="password"
              {...form.register('pinelabSecurityToken')}
            />
          </Field>
          <Field
            error={form.formState.errors.pinelabImei?.message}
            label="Pine Labs IMEI"
            name="payment-imei"
          >
            <Input id="payment-imei" placeholder="Optional" {...form.register('pinelabImei')} />
          </Field>
          <Field
            error={form.formState.errors.pinelabMerchantStorePosCode?.message}
            label="Pine Labs Merchant Store POS Code"
            name="payment-store-pos-code"
          >
            <Input
              id="payment-store-pos-code"
              placeholder="Optional"
              {...form.register('pinelabMerchantStorePosCode')}
            />
          </Field>
          <Field
            error={form.formState.errors.primaryUpi?.message}
            label="Primary UPI"
            name="payment-primary-upi"
          >
            <Select id="payment-primary-upi" {...form.register('primaryUpi')}>
              <option value="">Select provider</option>
              {primaryUpiValues.map((provider) => (
                <option key={provider} value={provider}>
                  {formatUpiProvider(provider)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <label className="flex min-h-10 items-center gap-3 rounded-md border bg-white px-3 text-sm font-medium text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
          <input className="h-4 w-4" type="checkbox" {...form.register('isActive')} />
          Active
        </label>
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Pine Labs security token is masked after save. Production should move this value to Key
          Vault or encrypted storage.
        </div>
        <FormActions
          isEditing={Boolean(editingMachine)}
          isPending={mutation.isPending}
          onCancel={onCancel}
        />
      </form>
    </Panel>
  );
}

function PaymentMachinesTab() {
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('');
  const [editingMachine, setEditingMachine] = useState<PaymentMachine | undefined>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const query = useQuery({
    queryFn: async () =>
      (
        await organizationApi.listPaymentMachines({
          isActive: activeFilterToBoolean(activeFilter),
          limit: pageLimit,
          page,
          search,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        })
      ).data,
    queryKey: ['payment-machines', { activeFilter, page, search }],
  });
  const items = query.data?.items ?? [];
  const meta = query.data?.meta ?? { limit: pageLimit, page, total: 0, totalPages: 1 };
  const deleteMutation = useMutation({
    mutationFn: (id: string) => organizationApi.deletePaymentMachine(id),
    onError(error) {
      showToast({
        description: getApiErrorMessage(error),
        title: 'Payment machine was not deactivated',
        variant: 'error',
      });
    },
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: ['payment-machines'] });
      showToast({ title: 'Payment machine deactivated', variant: 'success' });
    },
  });

  const openCreateForm = () => {
    setEditingMachine(undefined);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button className="bg-teal-600 hover:bg-teal-700" onClick={openCreateForm} type="button">
          <Plus className="h-4 w-4" />
          Add New
        </Button>
      </div>
      {isFormOpen ? (
        <PaymentMachineForm
          editingMachine={editingMachine}
          onCancel={() => {
            setEditingMachine(undefined);
            setIsFormOpen(false);
          }}
        />
      ) : null}
      <Panel>
        <FilterBar
          activeFilter={activeFilter}
          onActiveFilterChange={(value) => {
            setActiveFilter(value);
            setPage(1);
          }}
          onRefresh={() => void query.refetch()}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          search={search}
        />
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-normal text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="w-[16%] px-4 py-3">Name</th>
                <th className="w-[16%] px-4 py-3">Location</th>
                <th className="w-[16%] px-4 py-3">POS Device</th>
                <th className="w-[14%] px-4 py-3">Serial Number</th>
                <th className="w-[14%] px-4 py-3">Merchant ID</th>
                <th className="w-[14%] px-4 py-3">IMEI</th>
                <th className="w-[12%] px-4 py-3">Primary UPI</th>
                <th className="w-[10%] px-4 py-3">Status</th>
                <th className="w-[14%] px-4 py-3">Created</th>
                <th className="w-[14%] px-4 py-3">Updated</th>
                <th className="w-[150px] px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-950">
              {items.length > 0 ? (
                items.map((machine) => (
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-900" key={machine.id}>
                    <td className="px-4 py-4 font-medium text-slate-950 dark:text-white">
                      {machine.name}
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      {machine.hospital.hospitalName}
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      {machine.posDevice.name} ({machine.posDevice.code})
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      {machine.serialNumber ?? 'Not set'}
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      {machine.pinelabMerchantId ?? 'Not set'}
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      {machine.pinelabImei ?? 'Not set'}
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                      {formatUpiProvider(machine.primaryUpi)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusPill isActive={machine.isActive} />
                    </td>
                    <td className="px-4 py-4 text-slate-500">{formatDate(machine.createdAt)}</td>
                    <td className="px-4 py-4 text-slate-500">{formatDate(machine.updatedAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => {
                            setEditingMachine(machine);
                            setIsFormOpen(true);
                          }}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          Edit
                        </Button>
                        <Button
                          className="border-red-200 text-red-700 hover:bg-red-50"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (window.confirm('Deactivate this payment machine?')) {
                              deleteMutation.mutate(machine.id);
                            }
                          }}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <TableState
                  colSpan={11}
                  error={query.error}
                  isError={query.isError}
                  isLoading={query.isLoading}
                  label="payment machines"
                />
              )}
            </tbody>
          </table>
        </div>
        <PaginationControls
          onPageChange={setPage}
          page={meta.page}
          total={meta.total}
          totalPages={meta.totalPages}
        />
      </Panel>
    </div>
  );
}

export function PosMasterPageClient() {
  const [activeTab, setActiveTab] = useState<'devices' | 'payments'>('devices');
  const tabs = useMemo(
    () => [
      { id: 'devices' as const, label: 'POS Devices' },
      { id: 'payments' as const, label: 'Payment Machines' },
    ],
    [],
  );

  return (
    <section className="space-y-6">
      <AppPageHeader
        description="Configure POS devices and payment machines for hospital food operations."
        eyebrow="Masters"
        icon={CreditCard}
        title="POS"
      />
      <Panel className="p-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-teal-50 hover:text-teal-700 dark:text-slate-300 dark:hover:bg-teal-950 dark:hover:text-teal-200',
                activeTab === tab.id &&
                  'bg-teal-50 text-teal-800 shadow-sm dark:bg-teal-950 dark:text-teal-200',
              )}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Panel>
      {activeTab === 'devices' ? <PosDevicesTab /> : <PaymentMachinesTab />}
    </section>
  );
}
