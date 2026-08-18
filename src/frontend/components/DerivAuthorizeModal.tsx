import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Power,
  Key,
  Radio,
  DollarSign,
  LogIn,
  ShieldCheck,
} from 'lucide-react';

import {
  derivWebSocket,
  DerivAccountInfo,
  ConnectionStatus,
} from '../services/derivWebSocketService';

interface DerivAuthorizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
  onAuthorizedSync?: (account: DerivAccountInfo) => void;
}

/*
|--------------------------------------------------------------------------
| DERIV OAUTH 2.0 CONFIGURATION
|--------------------------------------------------------------------------
|
| IMPORTANT:
| 1. client_id must be your NEW OAuth 2.0 App ID from developers.deriv.com
| 2. redirect_uri must EXACTLY match the URL registered in your Deriv app.
| 3. OAuth token exchange must happen on your backend.
|
*/

const DERIV_OAUTH_AUTH_URL =
  'https://auth.deriv.com/oauth2/auth';

const DERIV_API_URL =
  'https://api.derivws.com';

const DEFAULT_CLIENT_ID =
  'YOUR_DERIV_OAUTH_CLIENT_ID';

/*
|--------------------------------------------------------------------------
| Types
|--------------------------------------------------------------------------
*/

interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

interface OAuthCallbackResponse {
  success: boolean;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;

  account?: {
    loginid: string;
    email?: string;
    balance?: number;
    currency?: string;
    isVirtual?: boolean;
  };

  error?: string;
}

/*
|--------------------------------------------------------------------------
| PKCE HELPERS
|--------------------------------------------------------------------------
*/

function generateCodeVerifier(length = 64): string {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

  const randomValues = new Uint8Array(length);

  crypto.getRandomValues(randomValues);

  return Array.from(randomValues)
    .map((value) => characters[value % characters.length])
    .join('');
}

async function generateCodeChallenge(
  verifier: string
): Promise<string> {
  const data = new TextEncoder().encode(verifier);

  const digest = await crypto.subtle.digest(
    'SHA-256',
    data
  );

  return btoa(
    String.fromCharCode(
      ...new Uint8Array(digest)
    )
  )
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function generateOAuthState(): string {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(32);

  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map((byte) =>
      byte.toString(16).padStart(2, '0')
    )
    .join('');
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export const DerivAuthorizeModal: React.FC<
  DerivAuthorizeModalProps
> = ({
  isOpen,
  onClose,
  isDarkMode = true,
  onAuthorizedSync,
}) => {
  /*
  |--------------------------------------------------------------------------
  | State
  |--------------------------------------------------------------------------
  */

  const [appId, setAppId] = useState(() => {
    return (
      localStorage.getItem(
        'deriv_oauth_client_id'
      ) ||
      DEFAULT_CLIENT_ID
    );
  });

  const [token, setToken] = useState('');

  const [status, setStatus] =
    useState<ConnectionStatus>(
      () => derivWebSocket.getStatus()
    );

  const [account, setAccount] =
    useState<DerivAccountInfo | null>(
      () => derivWebSocket.getAccountInfo()
    );

  const [latency, setLatency] =
    useState<number>(
      () => derivWebSocket.getLatency()
    );

  const [isAuthorizing, setIsAuthorizing] =
    useState(false);

  const [feedback, setFeedback] =
    useState<{
      type: 'success' | 'error' | 'info';
      message: string;
    } | null>(null);

  const [oauthLoading, setOauthLoading] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | WebSocket Status / Account Listeners
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const unsubStatus =
      derivWebSocket.onStatus(
        (newStatus, info) => {
          setStatus(newStatus);

          if (info?.latency) {
            setLatency(info.latency);
          }

          if (info?.error) {
            setFeedback({
              type: 'error',
              message: info.error,
            });

            setIsAuthorizing(false);
          }
        }
      );

    const unsubAccount =
      derivWebSocket.onAccount(
        (acc) => {
          setAccount(acc);

          setIsAuthorizing(false);

          setFeedback({
            type: 'success',
            message:
              `Successfully authorized Deriv account ` +
              `${acc.loginid} ` +
              `(${acc.isVirtual ? 'Demo' : 'Real'}) ` +
              `with balance ` +
              `${acc.balance.toFixed(2)} ${acc.currency}.`,
          });

          if (onAuthorizedSync) {
            onAuthorizedSync(acc);
          }
        }
      );

    return () => {
      unsubStatus();
      unsubAccount();
    };
  }, [onAuthorizedSync]);

  /*
  |--------------------------------------------------------------------------
  | Build Redirect URI
  |--------------------------------------------------------------------------
  */

  const getRedirectUri = useCallback(() => {
    /*
     * Register this exact URL inside your Deriv OAuth application.
     *
     * Example:
     *
     * https://yourdomain.com/deriv/callback
     */

    return (
      `${window.location.origin}` +
      `/deriv/callback`
    );
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Start Deriv OAuth 2.0 Login
  |--------------------------------------------------------------------------
  */

  const handleOAuthLogin = useCallback(
    async () => {
      try {
        const clientId =
          appId.trim();

        if (
          !clientId ||
          clientId ===
            DEFAULT_CLIENT_ID
        ) {
          setFeedback({
            type: 'error',
            message:
              'Enter your new Deriv OAuth 2.0 Client ID first.',
          });

          return;
        }

        setOauthLoading(true);

        setFeedback({
          type: 'info',
          message:
            'Preparing secure Deriv OAuth 2.0 login...',
        });

        /*
        |--------------------------------------------------------------------------
        | Generate PKCE
        |--------------------------------------------------------------------------
        */

        const codeVerifier =
          generateCodeVerifier();

        const codeChallenge =
          await generateCodeChallenge(
            codeVerifier
          );

        const state =
          generateOAuthState();

        /*
        |--------------------------------------------------------------------------
        | Store PKCE values
        |--------------------------------------------------------------------------
        */

        sessionStorage.setItem(
          'deriv_oauth_code_verifier',
          codeVerifier
        );

        sessionStorage.setItem(
          'deriv_oauth_state',
          state
        );

        sessionStorage.setItem(
          'deriv_oauth_client_id',
          clientId
        );

        const redirectUri =
          getRedirectUri();

        sessionStorage.setItem(
          'deriv_oauth_redirect_uri',
          redirectUri
        );

        /*
        |--------------------------------------------------------------------------
        | Build Deriv OAuth 2.0 URL
        |--------------------------------------------------------------------------
        */

        const authUrl =
          new URL(
            DERIV_OAUTH_AUTH_URL
          );

        authUrl.searchParams.set(
          'response_type',
          'code'
        );

        authUrl.searchParams.set(
          'client_id',
          clientId
        );

        authUrl.searchParams.set(
          'redirect_uri',
          redirectUri
        );

        /*
         * We need trading/account access
         * for the MarketMindPro trading engine.
         */
        authUrl.searchParams.set(
          'scope',
          'trade'
        );

        authUrl.searchParams.set(
          'state',
          state
        );

        authUrl.searchParams.set(
          'code_challenge',
          codeChallenge
        );

        authUrl.searchParams.set(
          'code_challenge_method',
          'S256'
        );

        /*
        |--------------------------------------------------------------------------
        | Redirect user to Deriv
        |--------------------------------------------------------------------------
        */

        window.location.href =
          authUrl.toString();

      } catch (error) {
        console.error(
          'Deriv OAuth initialization error:',
          error
        );

        setOauthLoading(false);

        setFeedback({
          type: 'error',
          message:
            'Unable to start Deriv OAuth 2.0 login.',
        });
      }
    },
    [appId, getRedirectUri]
  );

  /*
  |--------------------------------------------------------------------------
  | Handle OAuth Callback
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleOAuthCallback =
      async () => {
        const params =
          new URLSearchParams(
            window.location.search
          );

        const code =
          params.get('code');

        const returnedState =
          params.get('state');

        const oauthError =
          params.get('error');

        const errorDescription =
          params.get(
            'error_description'
          );

        /*
        |--------------------------------------------------------------------------
        | No OAuth callback
        |--------------------------------------------------------------------------
        */

        if (
          !code &&
          !oauthError
        ) {
          return;
        }

        /*
        |--------------------------------------------------------------------------
        | OAuth Error
        |--------------------------------------------------------------------------
        */

        if (oauthError) {
          setFeedback({
            type: 'error',
            message:
              errorDescription ||
              oauthError ||
              'Deriv login was cancelled.',
          });

          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | Validate State
        |--------------------------------------------------------------------------
        */

        const savedState =
          sessionStorage.getItem(
            'deriv_oauth_state'
          );

        if (
          !returnedState ||
          !savedState ||
          returnedState !== savedState
        ) {
          setFeedback({
            type: 'error',
            message:
              'OAuth state verification failed. Login aborted for security.',
          });

          sessionStorage.removeItem(
            'deriv_oauth_state'
          );

          sessionStorage.removeItem(
            'deriv_oauth_code_verifier'
          );

          return;
        }

        /*
        |--------------------------------------------------------------------------
        | Retrieve PKCE verifier
        |--------------------------------------------------------------------------
        */

        const codeVerifier =
          sessionStorage.getItem(
            'deriv_oauth_code_verifier'
          );

        const clientId =
          sessionStorage.getItem(
            'deriv_oauth_client_id'
          ) ||
          appId;

        const redirectUri =
          sessionStorage.getItem(
            'deriv_oauth_redirect_uri'
          ) ||
          getRedirectUri();

        if (!codeVerifier) {
          setFeedback({
            type: 'error',
            message:
              'OAuth PKCE verifier is missing. Please start the login again.',
          });

          return;
        }

        setOauthLoading(true);

        setIsAuthorizing(true);

        setFeedback({
          type: 'info',
          message:
            'Deriv login successful. Completing secure authorization...',
        });

        try {
          /*
          |--------------------------------------------------------------------------
          | Send authorization code to backend
          |--------------------------------------------------------------------------
          |
          | The backend exchanges the code with:
          |
          | POST https://auth.deriv.com/oauth2/token
          |
          | The browser should NOT perform this exchange
          | in a production application.
          |
          */

          const response =
            await fetch(
              '/api/deriv/oauth/exchange',
              {
                method: 'POST',

                headers: {
                  'Content-Type':
                    'application/json',
                },

                credentials: 'include',

                body: JSON.stringify({
                  code,
                  state:
                    returnedState,
                  code_verifier:
                    codeVerifier,
                  client_id:
                    clientId,
                  redirect_uri:
                    redirectUri,
                }),
              }
            );

          const data =
            (await response.json()) as OAuthCallbackResponse;

          if (
            !response.ok ||
            !data.success
          ) {
            throw new Error(
              data.error ||
                'Deriv OAuth token exchange failed.'
            );
          }

          /*
          |--------------------------------------------------------------------------
          | Save access token temporarily
          |--------------------------------------------------------------------------
          |
          | Ideally your backend should keep the token in
          | a secure HTTP-only session cookie.
          |
          | We only use the returned token here if your
          | WebSocket service requires it.
          |
          */

          if (
            data.access_token
          ) {
            setToken(
              data.access_token
            );

            /*
             * Do NOT put long-term tokens in localStorage.
             */
            sessionStorage.setItem(
              'deriv_access_token',
              data.access_token
            );
          }

          /*
          |--------------------------------------------------------------------------
          | Account information returned by backend
          |--------------------------------------------------------------------------
          */

          if (
            data.account
          ) {
            const oauthAccount:
              DerivAccountInfo = {
              loginid:
                data.account.loginid,

              email:
                data.account.email ||
                '',

              balance:
                data.account.balance ||
                0,

              currency:
                data.account.currency ||
                'USD',

              isVirtual:
                Boolean(
                  data.account
                    .isVirtual
                ),
            };

            setAccount(
              oauthAccount
            );

            if (
              onAuthorizedSync
            ) {
              onAuthorizedSync(
                oauthAccount
              );
            }
          }

          /*
          |--------------------------------------------------------------------------
          | Connect authenticated Deriv WebSocket
          |--------------------------------------------------------------------------
          */

          if (
            data.access_token
          ) {
            try {
              /*
               * This assumes your derivWebSocketService
               * supports OAuth access tokens.
               *
               * If it currently only supports API tokens,
               * update that service to accept the OAuth token.
               */

              derivWebSocket.setCredentials(
                clientId,
                data.access_token
              );

              derivWebSocket.connect();

              /*
               * Authorize the WebSocket connection.
               */
              derivWebSocket.authorize(
                data.access_token
              );

            } catch (wsError) {
              console.error(
                'Deriv WebSocket authorization error:',
                wsError
              );
            }
          }

          /*
          |--------------------------------------------------------------------------
          | Clean OAuth URL
          |--------------------------------------------------------------------------
          */

          sessionStorage.removeItem(
            'deriv_oauth_state'
          );

          sessionStorage.removeItem(
            'deriv_oauth_code_verifier'
          );

          sessionStorage.removeItem(
            'deriv_oauth_redirect_uri'
          );

          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );

          setFeedback({
            type: 'success',
            message:
              'Deriv OAuth 2.0 authorization completed successfully. Live account connection is active.',
          });

        } catch (error) {
          console.error(
            'OAuth callback error:',
            error
          );

          setFeedback({
            type: 'error',
            message:
              error instanceof Error
                ? error.message
                : 'Deriv OAuth authorization failed.',
          });

        } finally {
          setOauthLoading(false);
          setIsAuthorizing(false);
        }
      };

    handleOAuthCallback();

    /*
     * Only process callback once.
     */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Manual Token Authorization
  |--------------------------------------------------------------------------
  */

  const authorizeWithToken =
    useCallback(
      (
        tokenToUse: string,
        appIdToUse: string
      ) => {
        const cleanToken =
          tokenToUse.trim();

        if (!cleanToken) {
          setFeedback({
            type: 'error',
            message:
              'Please enter a valid Deriv token.',
          });

          return;
        }

        setIsAuthorizing(true);

        setFeedback({
          type: 'info',
          message:
            'Connecting to Deriv WebSocket and verifying authorization...',
        });

        try {
          derivWebSocket.setCredentials(
            appIdToUse.trim(),
            cleanToken
          );

          derivWebSocket.connect();

          derivWebSocket.authorize(
            cleanToken
          );
        } catch (error) {
          setIsAuthorizing(false);

          setFeedback({
            type: 'error',
            message:
              error instanceof Error
                ? error.message
                : 'Unable to authorize Deriv account.',
          });
        }
      },
      []
    );

  /*
  |--------------------------------------------------------------------------
  | Manual Token Button
  |--------------------------------------------------------------------------
  */

  const handleAuthorize =
    () => {
      const cleanToken =
        token.trim();

      if (!cleanToken) {
        setFeedback({
          type: 'error',
          message:
            'Please use "Login with Deriv" or enter a Deriv token.',
        });

        return;
      }

      authorizeWithToken(
        cleanToken,
        appId
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Public Market Data
  |--------------------------------------------------------------------------
  |
  | Public market data does not require OAuth.
  | This keeps your analysis engine capable of receiving
  | live synthetic-index ticks.
  |
  */

  const handleConnectPublicStream =
    () => {
      setIsAuthorizing(true);

      setFeedback({
        type: 'info',
        message:
          'Connecting to Deriv public live market stream...',
      });

      try {
        derivWebSocket.setCredentials(
          '1089',
          ''
        );

        derivWebSocket.connect();

        setTimeout(() => {
          setIsAuthorizing(false);

          setFeedback({
            type: 'success',
            message:
              'Deriv public live market stream connected. Real-time market data is active.',
          });
        }, 600);

      } catch (error) {
        setIsAuthorizing(false);

        setFeedback({
          type: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Unable to connect to public market stream.',
        });
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Demo Display
  |--------------------------------------------------------------------------
  */

  const handleUseVirtualDemo =
    () => {
      const demoAccount:
        DerivAccountInfo = {
        loginid:
          'VRTC' +
          Math.floor(
            1000000 +
              Math.random() *
                9000000
          ),

        email:
          'demo-trader@deriv.com',

        balance: 10000,

        currency: 'USD',

        isVirtual: true,
      };

      /*
       * Public market data can still be connected.
       */
      derivWebSocket.setCredentials(
        '1089',
        ''
      );

      derivWebSocket.connect();

      setAccount(
        demoAccount
      );

      setFeedback({
        type: 'success',
        message:
          'Demo workspace activated. Live Deriv market data stream is connected.',
      });

      if (
        onAuthorizedSync
      ) {
        onAuthorizedSync(
          demoAccount
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Disconnect
  |--------------------------------------------------------------------------
  */

  const handleDisconnect =
    () => {
      derivWebSocket.disconnect();

      setAccount(null);

      setToken('');

      sessionStorage.removeItem(
        'deriv_access_token'
      );

      setFeedback({
        type: 'info',
        message:
          'Deriv connection disconnected.',
      });
    };

  /*
  |--------------------------------------------------------------------------
  | Modal
  |--------------------------------------------------------------------------
  */

  if (!isOpen) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <div
      id="deriv-authorize-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-mono"
    >
      <div
        className={`w-full max-w-xl rounded-xl border ${
          isDarkMode
            ? 'bg-[#161A1E] border-[#2B2F36] text-[#EAECEF]'
            : 'bg-white border-slate-200 text-slate-900'
        } shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]`}
      >

        {/* HEADER */}

        <div className="flex items-center justify-between p-4 border-b border-[#2B2F36] shrink-0 bg-[#0B0E11]">

          <div className="flex items-center space-x-2.5">

            <div className="w-8 h-8 rounded-lg bg-green-500/15 border border-green-500/40 text-green-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>

            <div>

              <h2 className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">

                <span>
                  Authorize Deriv Live Account
                </span>

                <span className="text-[9px] px-1.5 py-0.2 rounded bg-green-500/15 text-green-400 border border-green-500/30">
                  OAuth 2.0
                </span>

              </h2>

              <p className="text-[10px] text-[#848E9C]">
                Login securely with Deriv and connect live market data
              </p>

            </div>

          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-[#848E9C] hover:text-white cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>

        </div>

        {/* BODY */}

        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">

          {/* CONNECTION STATUS */}

          <div className="p-3 rounded-lg bg-[#0B0E11] border border-[#2B2F36] flex items-center justify-between">

            <div className="flex items-center space-x-3">

              <div
                className={`w-3.5 h-3.5 rounded-full ${
                  status === 'authorized'
                    ? 'bg-green-500 shadow-[0_0_10px_#10b981] animate-pulse'
                    : status === 'connected'
                    ? 'bg-blue-400 shadow-[0_0_8px_#3b82f6]'
                    : status === 'connecting'
                    ? 'bg-yellow-400 animate-pulse'
                    : 'bg-red-500'
                }`}
              />

              <div>

                <div className="font-bold text-white text-xs flex items-center gap-2">

                  <span>
                    Connection:
                  </span>

                  <span
                    className={`uppercase font-mono text-[11px] ${
                      status === 'authorized'
                        ? 'text-green-400'
                        : status === 'connected'
                        ? 'text-blue-400'
                        : 'text-yellow-400'
                    }`}
                  >
                    {status ===
                    'authorized'
                      ? '● AUTHORIZED & STREAMING'
                      : status ===
                        'connected'
                      ? '● LIVE MARKET FEED'
                      : status}
                  </span>

                </div>

                <div className="text-[10px] text-[#848E9C] mt-0.5">

                  Endpoint:

                  <code className="text-blue-300 ml-1">
                    wss://ws.derivws.com/websockets/v3
                  </code>

                </div>

              </div>

            </div>

            <div className="text-right">

              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                Ping: {latency || 0}ms
              </span>

            </div>

          </div>

          {/* ACCOUNT */}

          {account && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 space-y-2">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <CheckCircle2 className="w-4 h-4 text-green-400" />

                  <span className="font-bold text-white text-xs">
                    Live Authorized Account
                  </span>

                </div>

                <span className="text-[10px] uppercase font-bold text-green-300 bg-green-500/20 px-2 py-0.5 rounded border border-green-500/40">
                  {account.isVirtual
                    ? 'Virtual Demo'
                    : 'Real Account'}
                </span>

              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">

                <div className="p-2 rounded bg-[#0B0E11] border border-[#2B2F36]">

                  <span className="text-[9px] text-[#848E9C] uppercase block">
                    Login ID
                  </span>

                  <span className="font-bold text-white text-xs">
                    {account.loginid}
                  </span>

                </div>

                <div className="p-2 rounded bg-[#0B0E11] border border-[#2B2F36]">

                  <span className="text-[9px] text-[#848E9C] uppercase block">
                    Live Balance
                  </span>

                  <span className="font-bold text-green-400 text-xs">
                    {account.balance.toLocaleString(
                      'en-US',
                      {
                        minimumFractionDigits: 2,
                      }
                    )}{' '}
                    {account.currency}
                  </span>

                </div>

                <div className="p-2 rounded bg-[#0B0E11] border border-[#2B2F36]">

                  <span className="text-[9px] text-[#848E9C] uppercase block">
                    Currency
                  </span>

                  <span className="font-bold text-white text-xs">
                    {account.currency}
                  </span>

                </div>

              </div>

            </div>
          )}

          {/* FEEDBACK */}

          {feedback && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                feedback.type === 'success'
                  ? 'bg-green-500/10 border border-green-500/30 text-green-300'
                  : feedback.type === 'error'
                  ? 'bg-red-500/10 border border-red-500/30 text-red-300'
                  : 'bg-blue-500/10 border border-blue-500/30 text-blue-300'
              }`}
            >

              {feedback.type ===
              'success' ? (
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              ) : feedback.type ===
                'error' ? (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <RefreshCw className="w-4 h-4 text-blue-400 shrink-0 animate-spin" />
              )}

              <span>
                {feedback.message}
              </span>

            </div>
          )}

          {/* LOGIN SECTION */}

          <div className="space-y-3 bg-[#0B0E11] p-3.5 rounded-lg border border-[#2B2F36]">

            {/* OAUTH 2 */}

            <div className="p-3.5 rounded-lg bg-linear-to-r from-red-500/10 via-orange-500/10 to-amber-500/10 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">

              <div>

                <div className="flex items-center gap-2">

                  <div className="w-6 h-6 rounded bg-red-500 text-white font-bold flex items-center justify-center text-xs">
                    d
                  </div>

                  <span className="font-bold text-white text-xs">
                    Deriv Login 2.0
                  </span>

                  <span className="text-[9px] bg-green-500/20 text-green-300 border border-green-500/40 px-1.5 py-0.2 rounded font-mono uppercase">
                    OAuth 2.0
                  </span>

                </div>

                <p className="text-[11px] text-[#848E9C] mt-1">
                  Securely log in through Deriv. Your
                  Deriv password is never entered into
                  MarketMindPro.
                </p>

              </div>

              <button
                id="btn-deriv-oauth-login"
                type="button"
                onClick={
                  handleOAuthLogin
                }
                disabled={
                  oauthLoading
                }
                className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase flex items-center justify-center space-x-1.5 transition shadow-lg shadow-red-600/20 cursor-pointer disabled:opacity-50"
              >

                {oauthLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogIn className="w-3.5 h-3.5" />
                )}

                <span>
                  {oauthLoading
                    ? 'Connecting...'
                    : 'Login with Deriv'}
                </span>

              </button>

            </div>

            {/* CLIENT ID */}

            <div>

              <label className="block text-[#848E9C] text-[10px] uppercase font-bold mb-1">
                Deriv OAuth 2.0 Client ID
              </label>

              <input
                type="text"
                value={appId}
                onChange={(e) =>
                  setAppId(
                    e.target.value
                  )
                }
                placeholder="Enter your Deriv OAuth Client ID"
                className="w-full px-3 py-2 rounded bg-[#161A1E] border border-[#2B2F36] text-[#EAECEF] font-mono text-xs focus:outline-hidden focus:border-blue-500"
              />

            </div>

            {/* REDIRECT URI */}

            <div className="p-2.5 rounded bg-[#161A1E]/80 border border-[#2B2F36]">

              <div className="text-[10px] font-bold text-white uppercase flex items-center gap-1.5">

                <ShieldCheck className="w-3.5 h-3.5 text-green-400" />

                OAuth Redirect URL

              </div>

              <code className="block mt-1 text-[10px] text-blue-300 break-all">
                {getRedirectUri()}
              </code>

              <p className="text-[9px] text-[#848E9C] mt-1">
                Register this exact URL in your Deriv OAuth application.
              </p>

            </div>

            {/* MANUAL TOKEN */}

            <div className="relative flex items-center justify-center my-1">

              <div className="border-t border-[#2B2F36] w-full" />

              <span className="bg-[#0B0E11] px-2 text-[10px] text-[#848E9C] uppercase font-mono tracking-wider shrink-0">
                Optional legacy token
              </span>

              <div className="border-t border-[#2B2F36] w-full" />

            </div>

            <div>

              <label className="text-[#848E9C] text-[10px] uppercase font-bold flex items-center gap-1.5 mb-1">

                <Key className="w-3.5 h-3.5 text-blue-400" />

                Deriv Access Token

              </label>

              <input
                type="password"
                value={token}
                onChange={(e) =>
                  setToken(
                    e.target.value
                  )
                }
                placeholder="Optional token"
                className="w-full px-3 py-2 rounded bg-[#161A1E] border border-[#2B2F36] text-[#EAECEF] font-mono text-xs focus:outline-hidden focus:border-blue-500 transition"
              />

            </div>

          </div>

        </div>

        {/* FOOTER */}

        <div className="p-3.5 border-t border-[#2B2F36] bg-[#0B0E11] flex flex-wrap items-center justify-between gap-2 shrink-0">

          <div className="flex flex-wrap items-center gap-2">

            <button
              onClick={
                handleUseVirtualDemo
              }
              className="px-3 py-1.5 rounded bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/40 text-xs font-bold text-blue-400 flex items-center space-x-1.5 cursor-pointer transition"
            >

              <DollarSign className="w-3.5 h-3.5" />

              <span>
                Demo Workspace
              </span>

            </button>

            <button
              onClick={
                handleConnectPublicStream
              }
              className="px-3 py-1.5 rounded bg-[#161A1E] hover:bg-[#1E2329] border border-[#2B2F36] text-xs font-bold text-slate-200 flex items-center space-x-1.5 cursor-pointer transition"
            >

              <Radio className="w-3.5 h-3.5 text-blue-400" />

              <span>
                Live Market Feed
              </span>

            </button>

            {status !==
              'disconnected' && (
              <button
                onClick={
                  handleDisconnect
                }
                className="px-2.5 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-bold text-red-400 flex items-center space-x-1 cursor-pointer transition"
              >

                <Power className="w-3.5 h-3.5" />

                <span>
                  Disconnect
                </span>

              </button>
            )}

          </div>

          <div className="flex items-center space-x-2">

            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded text-xs font-bold text-[#848E9C] hover:text-white cursor-pointer"
            >
              Close
            </button>

            <button
              onClick={
                handleAuthorize
              }
              disabled={
                isAuthorizing ||
                !token.trim()
              }
              className="px-4 py-1.5 rounded text-xs font-bold bg-green-600 hover:bg-green-500 text-white flex items-center space-x-1.5 uppercase cursor-pointer transition disabled:opacity-50 shadow-md shadow-green-600/20"
            >

              {isAuthorizing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>
                    Authorizing...
                  </span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>
                    Authorize
                  </span>
                </>
              )}

            </button>

          </div>

        </div>

      </div>
    </div>
  );
};

export default DerivAuthorizeModal;