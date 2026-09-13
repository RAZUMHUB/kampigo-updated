'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown } from 'lucide-react';

interface University {
  id: string;
  name: string;
}

interface Campus {
  id: string;
  universityId: string;
  name: string;
}

type Stage = 'university' | 'email' | 'otp';
type AuthMode = 'register' | 'login';
type ResetStage = 'email' | 'otp' | 'password';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const RESEND_COOLDOWN_SECONDS = 45;

export function AuthFlow() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<AuthMode>('register');
  const [stage, setStage] = useState<Stage>('university');
  const [university, setUniversity] = useState<University | null>(null);
  const [campus, setCampus] = useState<Campus | null>(null);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const [resetMode, setResetMode] = useState(false);
  const [resetStage, setResetStage] = useState<ResetStage>('email');
  const [resetCode, setResetCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const {
    data: universities,
    isLoading: universitiesLoading,
    isError: universitiesError,
    error: universitiesQueryError,
  } = useQuery<University[]>({
    queryKey: ['universities'],
    queryFn: async () => {
      const data = await api.get<University[]>('/universities');
      return data;
    },
  });

  const {
    data: campuses,
    isLoading: campusesLoading,
    isError: campusesError,
    error: campusesQueryError,
  } = useQuery<Campus[]>({
    queryKey: ['campuses', university?.id],
    queryFn: () =>
      api.get<Campus[]>(`/universities/${university?.id}/campuses`),
    enabled:
      mode === 'register' &&
      !resetMode &&
      stage === 'email' &&
      Boolean(university?.id),
  });

  const requestOtpMutation = useMutation({
    mutationFn: () => {
      if (!university) {
        throw new Error('Please select your university');
      }

      if (mode === 'register') {
        if (!campus) {
          throw new Error('Please select your campus');
        }

        return api.post('/auth/registration/request-otp', {
          universityId: university.id,
          campusId: campus.id,
          institutionalEmail: email,
          displayName,
          password,
        });
      }

      return api.post('/auth/login/request-otp', {
        universityId: university.id,
        institutionalEmail: email,
        password,
      });
    },
    onSuccess: () => {
      setCode('');
      setStage('otp');
      startCooldown();
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: () => {
      if (!university) {
        throw new Error('Please select your university');
      }

      if (mode === 'register') {
        if (!campus) {
          throw new Error('Please select your campus');
        }

        return api.post<AuthTokens>('/auth/registration/verify-otp', {
          universityId: university.id,
          campusId: campus.id,
          institutionalEmail: email,
          code,
          displayName,
          password,
        });
      }

      return api.post<AuthTokens>('/auth/login/verify-otp', {
        universityId: university.id,
        institutionalEmail: email,
        code,
      });
    },
    onSuccess: async (tokens) => {
      api.setTokens(tokens.accessToken, tokens.refreshToken);

      await queryClient.resetQueries({
        predicate: (query) => query.queryKey[0] !== 'universities',
      });

      router.replace('/');
      router.refresh();
    },
  });

  const requestPasswordResetMutation = useMutation({
    mutationFn: () => {
      if (!university) {
        throw new Error('Please select your university');
      }

      if (!email.trim()) {
        throw new Error('Please enter your institutional email');
      }

      return api.post('/auth/password-reset/request-otp', {
        universityId: university.id,
        institutionalEmail: email.trim(),
      });
    },
    onSuccess: () => {
      setResetCode('');
      setResetStage('otp');
      startCooldown();
    },
  });

  const verifyPasswordResetMutation = useMutation({
    mutationFn: () => {
      if (!university) {
        throw new Error('Please select your university');
      }

      return api.post<{ resetToken: string }>(
        '/auth/password-reset/verify-otp',
        {
          universityId: university.id,
          institutionalEmail: email.trim(),
          code: resetCode,
        },
      );
    },
    onSuccess: ({ resetToken: token }) => {
      setResetToken(token);
      setNewPassword('');
      setConfirmPassword('');
      setResetStage('password');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () => {
      if (!resetToken) {
        throw new Error('Password reset session has expired');
      }

      if (newPassword.length < 8 || newPassword.length > 128) {
        throw new Error('Password must be between 8 and 128 characters');
      }

      if (newPassword !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      return api.post('/auth/password-reset/reset', {
        resetToken,
        newPassword,
      });
    },
    onSuccess: () => {
      setResetMode(false);
      setResetStage('email');
      setResetCode('');
      setResetToken('');
      setNewPassword('');
      setConfirmPassword('');
      setUniversity(null);
      setCampus(null);
      setEmail('');
      setStage('university');
      setCooldown(0);

      requestPasswordResetMutation.reset();
      verifyPasswordResetMutation.reset();
      resetPasswordMutation.reset();
    },
  });

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN_SECONDS);

    const interval = setInterval(() => {
      setCooldown((current) => {
        if (current <= 1) {
          clearInterval(interval);
          return 0;
        }

        return current - 1;
      });
    }, 1000);
  }

  function changeMode(nextMode: AuthMode) {
    setResetMode(false);
    setMode(nextMode);
    setStage('university');
    setUniversity(null);
    setCampus(null);
    setEmail('');
    setDisplayName('');
    setPassword('');
    setCode('');
    setCooldown(0);

    setResetStage('email');
    setResetCode('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');

    requestOtpMutation.reset();
    verifyOtpMutation.reset();
    requestPasswordResetMutation.reset();
    verifyPasswordResetMutation.reset();
    resetPasswordMutation.reset();
  }

  function startPasswordReset() {
    setResetMode(true);
    setResetStage('email');
    setUniversity(null);
    setCampus(null);
    setEmail('');
    setResetCode('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setCooldown(0);

    requestPasswordResetMutation.reset();
    verifyPasswordResetMutation.reset();
    resetPasswordMutation.reset();
  }

  function cancelPasswordReset() {
    setResetMode(false);
    setResetStage('email');
    setUniversity(null);
    setCampus(null);
    setEmail('');
    setResetCode('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    setCooldown(0);

    requestPasswordResetMutation.reset();
    verifyPasswordResetMutation.reset();
    resetPasswordMutation.reset();
  }

  return (
    <main className="flex min-h-[calc(100dvh-6rem)] items-center px-4 py-8 sm:px-6 md:min-h-[calc(100dvh-4rem)] md:px-8 md:py-12">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-ink-100 bg-surface-raised shadow-sm lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden flex-col justify-between bg-ink-700 p-10 text-white lg:flex">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <span className="font-display text-lg font-bold">LF</span>
            </div>

            <p className="mt-10 text-sm font-medium text-white/60">
              Private campus network
            </p>

            <h1 className="mt-3 max-w-md font-display text-4xl font-bold tracking-tight">
              Everything you need, within your campus.
            </h1>

            <p className="mt-5 max-w-md text-sm leading-7 text-white/65">
              Report lost items, publish found items and discover possible
              matches inside your university community.
            </p>
          </div>

          <p className="mt-12 text-xs leading-5 text-white/45">
            Institutional email verification keeps the network limited to your
            university community.
          </p>
        </section>

        <section className="flex min-h-[420px] flex-col justify-center p-5 sm:min-h-[500px] sm:p-8 md:min-h-[560px] md:p-10 lg:p-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-6">
              <p className="text-sm font-medium text-ink-400">Campigo</p>

              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
                {resetMode
                  ? 'Reset your password.'
                  : mode === 'register'
                    ? 'Join your campus network.'
                    : 'Welcome back.'}
              </h1>

              <p className="mt-3 text-sm leading-6 text-ink-400">
                {resetMode
                  ? 'Securely recover access to your Campigo account.'
                  : mode === 'register'
                    ? 'Create your account using your institutional email.'
                    : 'Sign in using your institutional email.'}
              </p>
            </div>

            {!resetMode && (
              <div className="mb-8 grid grid-cols-2 rounded-xl bg-ink-50 p-1">
                <button
                  type="button"
                  onClick={() => changeMode('register')}
                  className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                    mode === 'register'
                      ? 'bg-surface-raised text-ink-900 shadow-sm'
                      : 'text-ink-400 hover:text-ink-700'
                  }`}
                >
                  Create account
                </button>

                <button
                  type="button"
                  onClick={() => changeMode('login')}
                  className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                    mode === 'login'
                      ? 'bg-surface-raised text-ink-900 shadow-sm'
                      : 'text-ink-400 hover:text-ink-700'
                  }`}
                >
                  Sign in
                </button>
              </div>
            )}

            {resetMode ? (
              <div className="flex flex-col gap-4">
                {resetStage === 'email' && (
                  <>
                    <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-700">
                      University

                      {universitiesLoading ? (
                        <Skeleton className="h-12 w-full" />
                      ) : universitiesError ? (
                        <p className="text-sm text-red-600">
                          {(universitiesQueryError as Error).message}
                        </p>
                      ) : (
                        <div className="relative">
                          <select
                            className="input h-12 appearance-none pr-10"
                            value={university?.id ?? ''}
                            onChange={(event) => {
                              const selected = universities?.find(
                                (item) => item.id === event.target.value,
                              );

                              if (!selected) return;

                              setUniversity(selected);
                            }}
                          >
                            <option value="" disabled>
                              Select your university
                            </option>

                            {universities?.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>

                          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
                        </div>
                      )}
                    </label>

                    <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-700">
                      Institutional email
                      <input
                        className="input"
                        type="email"
                        autoComplete="email"
                        placeholder="yourname@university.edu"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                      />
                    </label>

                    {requestPasswordResetMutation.isError && (
                      <p className="text-sm text-red-600">
                        {(requestPasswordResetMutation.error as Error).message}
                      </p>
                    )}

                    <Button
                      className="w-full"
                      disabled={
                        !university ||
                        !email.trim() ||
                        requestPasswordResetMutation.isPending
                      }
                      onClick={() => requestPasswordResetMutation.mutate()}
                    >
                      {requestPasswordResetMutation.isPending
                        ? 'Sending code...'
                        : 'Send reset code'}
                    </Button>
                  </>
                )}

                {resetStage === 'otp' && (
                  <>
                    <p className="text-sm text-ink-400">
                      Enter the verification code sent to{' '}
                      <span className="font-medium text-ink-700">{email}</span>
                    </p>

                    <input
                      className="input text-center text-lg tracking-[0.5em]"
                      maxLength={6}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={resetCode}
                      onChange={(event) =>
                        setResetCode(event.target.value.replace(/\D/g, ''))
                      }
                    />

                    {verifyPasswordResetMutation.isError && (
                      <p className="text-sm text-red-600">
                        {(verifyPasswordResetMutation.error as Error).message}
                      </p>
                    )}

                    <Button
                      className="w-full"
                      disabled={
                        resetCode.length !== 6 ||
                        verifyPasswordResetMutation.isPending
                      }
                      onClick={() => verifyPasswordResetMutation.mutate()}
                    >
                      {verifyPasswordResetMutation.isPending
                        ? 'Verifying...'
                        : 'Verify code'}
                    </Button>

                    <button
                      type="button"
                      disabled={
                        cooldown > 0 ||
                        requestPasswordResetMutation.isPending
                      }
                      onClick={() => requestPasswordResetMutation.mutate()}
                      className="text-sm font-medium text-ink-500 disabled:text-ink-300"
                    >
                      {cooldown > 0
                        ? `Resend code in ${cooldown}s`
                        : 'Resend code'}
                    </button>
                  </>
                )}

                {resetStage === 'password' && (
                  <>
                    <p className="text-sm text-ink-400">
                      Create a new password for your Campigo account.
                    </p>

                    <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-700">
                      New password
                      <input
                        className="input"
                        type="password"
                        autoComplete="new-password"
                        minLength={8}
                        maxLength={128}
                        value={newPassword}
                        onChange={(event) =>
                          setNewPassword(event.target.value)
                        }
                      />
                    </label>

                    <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-700">
                      Confirm new password
                      <input
                        className="input"
                        type="password"
                        autoComplete="new-password"
                        minLength={8}
                        maxLength={128}
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                      />
                    </label>

                    {newPassword &&
                      confirmPassword &&
                      newPassword !== confirmPassword && (
                        <p className="text-sm text-red-600">
                          Passwords do not match.
                        </p>
                      )}

                    {resetPasswordMutation.isError && (
                      <p className="text-sm text-red-600">
                        {(resetPasswordMutation.error as Error).message}
                      </p>
                    )}

                    <Button
                      className="w-full"
                      disabled={
                        newPassword.length < 8 ||
                        newPassword.length > 128 ||
                        newPassword !== confirmPassword ||
                        resetPasswordMutation.isPending
                      }
                      onClick={() => resetPasswordMutation.mutate()}
                    >
                      {resetPasswordMutation.isPending
                        ? 'Updating password...'
                        : 'Update password'}
                    </Button>
                  </>
                )}

                <button
                  type="button"
                  onClick={cancelPasswordReset}
                  className="text-sm font-medium text-ink-500 hover:text-ink-800"
                >
                  Back to sign in
                </button>
              </div>
            ) : (
              <>
                {stage === 'university' && (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm font-medium text-ink-700">
                      Select your university
                    </p>

                    {universitiesLoading ? (
                      <Skeleton className="h-12 w-full" />
                    ) : universitiesError ? (
                      <p className="text-sm text-red-600">
                        {(universitiesQueryError as Error).message}
                      </p>
                    ) : (
                      <div className="relative">
                        <select
                          className="input h-12 appearance-none pr-10"
                          value={university?.id ?? ''}
                          onChange={(event) => {
                            const selected = universities?.find(
                              (item) => item.id === event.target.value,
                            );

                            if (!selected) return;

                            setUniversity(selected);
                            setCampus(null);
                            setStage('email');
                          }}
                        >
                          <option value="" disabled>
                            Select your university
                          </option>

                          {universities?.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>

                        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
                      </div>
                    )}
                  </div>
                )}

                {stage === 'email' && university && (
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-ink-400">
                      {mode === 'register'
                        ? 'Creating an account for '
                        : 'Signing in to '}
                      <span className="font-medium text-ink-700">
                        {university.name}
                      </span>
                    </p>

                    {mode === 'register' && (
                      <>
                        <div className="flex flex-col gap-1.5">
                          <p className="text-sm font-medium text-ink-700">
                            Campus
                          </p>

                          {campusesLoading ? (
                            <Skeleton className="h-12 w-full" />
                          ) : campusesError ? (
                            <p className="text-sm text-red-600">
                              {(campusesQueryError as Error).message}
                            </p>
                          ) : (
                            <div className="grid gap-2">
                              {campuses?.map((item) => (
                                <button
                                  type="button"
                                  key={item.id}
                                  onClick={() => setCampus(item)}
                                  className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                                    campus?.id === item.id
                                      ? 'border-ink-700 bg-ink-50 text-ink-900'
                                      : 'border-ink-100 bg-surface text-ink-700 hover:border-ink-300'
                                  }`}
                                >
                                  {item.name}
                                </button>
                              ))}

                              {campuses?.length === 0 && (
                                <p className="text-sm text-ink-400">
                                  No active campus is available for this
                                  university.
                                </p>
                              )}
                            </div>
                          )}
                        </div>

                        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-700">
                          Full name
                          <input
                            className="input"
                            value={displayName}
                            onChange={(event) =>
                              setDisplayName(event.target.value)
                            }
                          />
                        </label>
                      </>
                    )}

                    <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-700">
                      Institutional email
                      <input
                        className="input"
                        type="email"
                        placeholder="yourname@university.edu"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                      />
                    </label>

                    <label className="flex flex-col gap-1.5 text-sm font-medium text-ink-700">
                      Password
                      <input
                        className="input"
                        type="password"
                        autoComplete={
                          mode === 'register'
                            ? 'new-password'
                            : 'current-password'
                        }
                        minLength={8}
                        maxLength={128}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                      />
                    </label>

                    {requestOtpMutation.isError && (
                      <p className="text-sm text-red-600">
                        {(requestOtpMutation.error as Error).message}
                      </p>
                    )}

                    <Button
                      disabled={
                        !email ||
                        password.length < 8 ||
                        (mode === 'register' &&
                          (!displayName.trim() || !campus)) ||
                        requestOtpMutation.isPending
                      }
                      onClick={() => requestOtpMutation.mutate()}
                    >
                      {requestOtpMutation.isPending
                        ? 'Sending code...'
                        : 'Send verification code'}
                    </Button>

                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={startPasswordReset}
                        className="text-sm font-medium text-ink-500 hover:text-ink-800"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                )}

                {stage === 'otp' && (
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-ink-400">
                      Enter the verification code sent to{' '}
                      <span className="font-medium text-ink-700">
                        {email}
                      </span>
                    </p>

                    <input
                      className="input text-center text-lg tracking-[0.5em]"
                      maxLength={6}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      value={code}
                      onChange={(event) =>
                        setCode(event.target.value.replace(/\D/g, ''))
                      }
                    />

                    {verifyOtpMutation.isError && (
                      <p className="text-sm text-red-600">
                        {(verifyOtpMutation.error as Error).message}
                      </p>
                    )}

                    <Button
                      className="w-full"
                      disabled={
                        code.length !== 6 || verifyOtpMutation.isPending
                      }
                      onClick={() => verifyOtpMutation.mutate()}
                    >
                      {verifyOtpMutation.isPending
                        ? 'Verifying...'
                        : mode === 'register'
                          ? 'Verify & create account'
                          : 'Verify & sign in'}
                    </Button>

                    <button
                      type="button"
                      disabled={
                        cooldown > 0 || requestOtpMutation.isPending
                      }
                      onClick={() => requestOtpMutation.mutate()}
                      className="text-sm font-medium text-ink-500 disabled:text-ink-300"
                    >
                      {cooldown > 0
                        ? `Resend code in ${cooldown}s`
                        : 'Resend code'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
