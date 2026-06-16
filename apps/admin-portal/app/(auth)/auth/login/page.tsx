'use client';

import { Button } from '@aahar/ui';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight, ChefHat, CookingPot, Soup, Utensils } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm, type Path, type UseFormReturn } from 'react-hook-form';
import { z, type ZodError } from 'zod';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/components/toast-provider';
import { Field, Input } from '@/components/ui';
import { authApi, getApiErrorMessage } from '@/lib/api';

const sendOtpSchema = z.object({
  email: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().email('Enter a valid email address.').optional(),
  ),
  mobile: z.string().regex(/^\d{10}$/, 'Enter a valid 10 digit mobile number.')
});

const verifyOtpSchema = sendOtpSchema.extend({
  otp: z.string().regex(/^\d{6}$/, 'Enter the 6 digit OTP.')
});

type LoginFormValues = z.input<typeof verifyOtpSchema>;

function applyValidationErrors<TFormValues extends Record<string, unknown>>(
  form: UseFormReturn<TFormValues>,
  error: ZodError,
) {
  form.clearErrors();

  error.issues.forEach((issue) => {
    const fieldName = issue.path[0];

    if (typeof fieldName === 'string') {
      form.setError(fieldName as Path<TFormValues>, {
        message: issue.message
      });
    }
  });
}

export default function LoginPage() {
  const router = useRouter();
  const { accessToken, isReady, signIn } = useAuth();
  const { showToast } = useToast();
  const [isOtpStep, setIsOtpStep] = useState(false);
  const form = useForm<LoginFormValues>({
    defaultValues: {
      email: '',
      mobile: '',
      otp: ''
    }
  });

  useEffect(() => {
    if (isReady && accessToken) {
      router.replace('/dashboard');
    }
  }, [accessToken, isReady, router]);

  const sendOtpMutation = useMutation({
    mutationFn: (body: z.output<typeof sendOtpSchema>) => authApi.sendOtp(body),
    onError(error) {
      showToast({
        description: getApiErrorMessage(error),
        title: 'OTP request failed',
        variant: 'error'
      });
    },
    onSuccess() {
      setIsOtpStep(true);
      showToast({
        title: 'OTP sent',
        variant: 'success'
      });
    }
  });

  const verifyOtpMutation = useMutation({
    mutationFn: (body: z.output<typeof verifyOtpSchema>) => authApi.verifyOtp(body),
    onError(error) {
      showToast({
        description: getApiErrorMessage(error),
        title: 'Login failed',
        variant: 'error'
      });
    },
    onSuccess(response) {
      signIn(response.data);
      showToast({
        title: 'Signed in',
        variant: 'success'
      });
      router.replace('/dashboard');
    }
  });

  const handleSendOtp = form.handleSubmit((values) => {
    const parsed = sendOtpSchema.safeParse(values);

    if (!parsed.success) {
      applyValidationErrors(form, parsed.error);
      return;
    }

    sendOtpMutation.mutate(parsed.data);
  });

  const handleVerifyOtp = form.handleSubmit((values) => {
    const parsed = verifyOtpSchema.safeParse(values);

    if (!parsed.success) {
      applyValidationErrors(form, parsed.error);
      return;
    }

    verifyOtpMutation.mutate(parsed.data);
  });

  return (
    <main className="min-h-screen bg-[#eef8f5] px-4 py-8 text-slate-950">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl overflow-hidden rounded-lg border bg-white shadow-xl shadow-teal-950/10 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-teal-500">
                  <Utensils className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-xl font-semibold leading-6">AAHAR</p>
                  <p className="text-sm text-slate-300">Max Healthcare</p>
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-white px-4 py-3 text-slate-950 shadow-lg shadow-black/10">
                <p className="text-sm font-semibold leading-4">MAX</p>
                <p className="text-xs font-medium text-slate-500">Healthcare</p>
              </div>
            </div>
            <div className="mt-16 max-w-md">
              <p className="text-sm font-semibold uppercase tracking-normal text-teal-300">
                Max Healthcare
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-normal">AAHAR</h1>
              <p className="mt-4 text-lg font-medium leading-7 text-slate-200">
                Food & Cafeteria Management Platform
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: Soup, label: 'Fresh meals' },
              { icon: CookingPot, label: 'Cafeteria operations' },
              { icon: ChefHat, label: 'Room service' },
              { icon: Utensils, label: 'Employee food ordering' }
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  className="min-h-24 rounded-lg border border-white/10 bg-white/5 p-4 shadow-sm shadow-black/10"
                  key={item.label}
                >
                  <Icon className="h-5 w-5 text-teal-300" />
                  <p className="mt-4 text-sm font-semibold leading-5 text-slate-100">
                    {item.label}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid place-items-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-teal-600 text-white">
                <Utensils className="h-5 w-5" />
              </span>
              <div>
                <p className="text-lg font-semibold leading-5">AAHAR</p>
                <p className="text-xs font-medium text-slate-500">Max Healthcare</p>
              </div>
            </div>
            <p className="text-sm font-semibold uppercase tracking-normal text-teal-700">
              Authentication
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal text-slate-950">
              Sign in with OTP
            </h2>

            <form
              className="mt-8 space-y-5"
              onSubmit={(event) => {
                void (isOtpStep ? handleVerifyOtp : handleSendOtp)(event);
              }}
            >
              <Field error={form.formState.errors.mobile?.message} label="Mobile Number" name="mobile">
                <Input
                  autoComplete="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="9999999999"
                  {...form.register('mobile')}
                />
              </Field>
              <Field error={form.formState.errors.email?.message} label="Email" name="email">
                <Input
                  autoComplete="email"
                  placeholder="admin@aahar.local"
                  type="email"
                  {...form.register('email')}
                />
              </Field>
              {isOtpStep ? (
                <Field error={form.formState.errors.otp?.message} label="OTP" name="otp">
                  <Input
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    {...form.register('otp')}
                  />
                </Field>
              ) : null}
              <Button
                className="w-full bg-teal-600 hover:bg-teal-700"
                disabled={sendOtpMutation.isPending || verifyOtpMutation.isPending}
                type="submit"
              >
                {isOtpStep ? 'Verify OTP' : 'Send OTP'}
                <ArrowRight className="h-4 w-4" />
              </Button>
              {isOtpStep ? (
                <Button
                  className="w-full"
                  disabled={sendOtpMutation.isPending || verifyOtpMutation.isPending}
                  onClick={() => {
                    form.setValue('otp', '');
                    setIsOtpStep(false);
                  }}
                  type="button"
                  variant="ghost"
                >
                  Change login details
                </Button>
              ) : null}
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
