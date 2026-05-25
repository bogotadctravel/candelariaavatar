'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import { TokenSource } from 'livekit-client';
import {
  RoomAudioRenderer,
  SessionProvider,
  StartAudio,
  useSession,
  useSessionContext,
} from '@livekit/components-react';
import type { AppConfig } from '@/app-config';
import { ViewController } from '@/components/app/view-controller';
import { Toaster } from '@/components/livekit/toaster';
import { useTranslation } from '@/hooks/use-translation';
import { useAgentErrors } from '@/hooks/useAgentErrors';
import { useDebugMode } from '@/hooks/useDebug';
import { type Lang, useLanguage } from '@/lib/language-context';
// ajusta la ruta
// import { useLanguage } from '@/lib/language-context';
import numberCountry from '@/lib/numberCountry.json';
import { getSandboxTokenSource } from '@/lib/utils';

const IN_DEVELOPMENT = process.env.NODE_ENV !== 'production';

function AppSetup() {
  useDebugMode({ enabled: IN_DEVELOPMENT });
  useAgentErrors();

  return null;
}

interface AppProps {
  appConfig: AppConfig;
}
interface UserMetadata {
  documentType: string;
  documentNumber: string;
  user_id: string;
  user_name: string;
  user_phone: string;
}

export function App({ appConfig }: AppProps) {
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPolicies, setAcceptPolicies] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showModalFrame, setShowModalFrame] = useState(false);

  const [currentModal, setCurrentModal] = useState<string | null>(null);

  const [activeField, setActiveField] = useState<string | null>(null);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const keyboardRef = useRef<any>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [keyboardPosition, setKeyboardPosition] = useState({ top: 0, left: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [disabledButton, setDisabledButton] = useState(false);
  //   language
  const { lang, setLang } = useLanguage();
  const { t } = useTranslation();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isInsideForm = formRef.current?.contains(target);
      const isKeyboard = target.closest('.simple-keyboard');
      if (!isInsideForm && !isKeyboard) {
        setShowKeyboard(false);
        setActiveField(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!showKeyboard || !activeField) return;

    const timeout = setTimeout(() => {
      if (!keyboardRef.current) return;

      const value =
        activeField === 'documentNumber' ? userMetadata.documentNumber : userMetadata.user_name;

      keyboardRef.current.setInput(value, activeField);
    }, 50);

    return () => clearTimeout(timeout);
  }, [showKeyboard, activeField]);

  const openModal = (type: string) => {
    setCurrentModal(type);
    setShowModal(true);
  };

  const openIframe = () => {
    setShowModal(false);
    setShowModalFrame(true);
  };

  const handleFocus = (fieldName: string, e: React.FocusEvent<HTMLInputElement>) => {
    keyboardRef.current = null;
    setActiveField(fieldName);
    setShowKeyboard(true);

    const rect = e.target.getBoundingClientRect();
    setKeyboardPosition({
      top: rect.bottom + 10,
      left: rect.left,
    });
  };

  const handleKeyboardChange = (input: string) => {
    if (!activeField) return;
    setUserMetadata((prev) => ({
      ...prev,
      [activeField]: input,
    }));
  };

  const handleKeyPress = (button: string) => {
    if (button === '{enter}') {
      setShowKeyboard(false);
      setActiveField(null);
    }
  };

  const isNumericField = activeField === 'documentNumber';

  const numericLayout = {
    default: ['1 2 3', '4 5 6', '7 8 9', '{bksp} 0 {enter}'],
  };

  const numericDisplay = {
    '{bksp}': '⌫',
    '{enter}': '✓',
  };

  const acceptModal = () => {
    setShowModal(false);
  };

  const [userMetadata, setUserMetadata] = useState<UserMetadata>({
    documentType: '+57',
    documentNumber: '',
    user_id: '',
    user_name: '',
    user_phone: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userMetadata.documentNumber && !userMetadata.user_name) {
      setUserMetadata((prev) => ({
        ...prev,
        user_id: (Math.floor(Math.random() * 1_000_000) + 1).toString(),
        user_name: 'anonimo',
        user_phone: (Math.floor(Math.random() * 1_000_000) + 1).toString(),
      }));
      setIsFormSubmitted(true);
      return false;
    }
    const user_id = `${userMetadata.documentType}_${userMetadata.documentNumber}`;

    setUserMetadata((prev) => ({
      ...prev,
      user_id,
    }));

    setUserMetadata((prev) => ({
      ...prev,
      user_phone: `${userMetadata.documentType}_${userMetadata.documentNumber}`,
    }));

    if (userMetadata.documentType && userMetadata.documentNumber && userMetadata.user_name) {
      setIsFormSubmitted(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserMetadata((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    if (userMetadata.documentNumber !== '' || userMetadata.user_name !== '') {
      setDisabledButton(
        !(
          userMetadata.documentType &&
          userMetadata.documentNumber &&
          userMetadata.user_name &&
          acceptPolicies &&
          acceptTerms
        )
      );
    } else {
      setDisabledButton(false);
    }
  }, [userMetadata, acceptPolicies, acceptTerms]);

  const tokenSource = useMemo(() => {
    if (!isFormSubmitted) return null;
    console.log('metadata: ', userMetadata);
    console.log(typeof process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT);
    const sandboxEndpoint = process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT?.trim();

    return sandboxEndpoint
      ? getSandboxTokenSource(appConfig)
      : TokenSource.endpoint(
          `/api/connection-details?user_id=${userMetadata.user_id}&user_name=${userMetadata.user_name}&user_phone=${userMetadata.user_phone}&lang=${lang}`
        );
  }, [appConfig, userMetadata, isFormSubmitted, lang]);

  const session = useSession(
    tokenSource!,
    appConfig.agentName ? { agentName: appConfig.agentName } : undefined
  );

  useEffect(() => {
    if (!session) return;

    console.log('session.connectionState: ', session);

    if (session.connectionState === 'disconnected') {
      console.log('Session disconnected, resetting UI...');
      setLang('es');
      setUserMetadata({
        documentType: '+57',
        documentNumber: '',
        user_id: '',
        user_name: '',
        user_phone: '',
      });
      setAcceptPolicies(false);
      setAcceptTerms(false);
      setIsFormSubmitted(false);
    }
  }, [session?.connectionState]);

  if (!isFormSubmitted || !tokenSource) {
    return (
      <div className="bg-opacity-50 bg-background min-h-screen overflow-y-auto bg-[url('/background-img-avatar.png')] bg-cover bg-center p-4 font-[Helvetica,sans-serif]">
        <div className="fixed top-0 right-0 left-0 z-50 flex items-center justify-center bg-[#264892] px-4 py-2">
          <img
            src="/idt_a2.png"
            alt="Bogotá"
            className="h-15 rounded-md object-contain p-1 md:h-16"
          />
        </div>

        <div
          ref={formRef}
          className="mx-auto w-full max-w-[2236px] rounded-lg p-10"
          style={{ position: 'relative' }}
        >
          <div className="relative top-[40px] left-[40px]">
            <img
              src="/avatarfront.jpg"
              alt="Candelaria"
              className="w-full max-w-[200px] rounded-2xl shadow-[0_4px_6px_rgba(0,0,0,0.3)]"
            />
          </div>

          <div className="mx-auto mt-[1%] rounded-[30px] bg-white p-14 pt-2 pb-6">
            <div className="">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="top-16 right-4 mb-1 flex gap-4 text-black">
                  <div className="z-2 flex w-full flex-row items-center justify-end">
                    <img src="/world-icon.png" alt="Candelaria" className="w-4" />
                    <select
                      value={lang}
                      onChange={(e) => setLang(e.target.value as 'es' | 'en')}
                      className="rounded-xl border-none px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="es">Español</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
                <p className="mb-2 text-2xl font-bold">{t('title')}</p>
                <div className="mb-2 flex gap-2">
                  <div className="w-1/4">
                    <select
                      id="documentType"
                      name="documentType"
                      value={userMetadata.documentType}
                      onChange={handleInputChange}
                      className="h-full w-full rounded-md border p-1 text-lg"
                    >
                      <option disabled value="">
                        Indicativo
                      </option>
                      {numberCountry.map((country, index) => (
                        <option key={index} value={country.dial_code}>
                          {`${country.flag} ${country.dial_code}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      id="documentNumber"
                      name="documentNumber"
                      autoComplete="off"
                      placeholder={t('phone')}
                      value={userMetadata.documentNumber}
                      onChange={handleInputChange}
                      onFocus={(e) => handleFocus('documentNumber', e)}
                      className="w-full rounded-md border p-1 text-lg"
                    />
                  </div>
                </div>

                <div className="mb-2">
                  <input
                    type="text"
                    id="user_name"
                    name="user_name"
                    autoComplete="off"
                    placeholder={t('name')}
                    value={userMetadata.user_name}
                    onChange={handleInputChange}
                    onFocus={(e) => handleFocus('user_name', e)}
                    className="w-full rounded-md border p-1 text-lg"
                  />
                </div>

                {showKeyboard && (
                  <div
                    key={activeField}
                    style={
                      isMobile
                        ? {
                            position: 'fixed',
                            top: keyboardPosition.top,
                            right: 10,
                            zIndex: 9999,
                            background: 'white',
                            padding: '8px',
                            borderRadius: '8px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                            width: isNumericField ? '260px' : '340px',
                            maxWidth: '95vw',
                            transform: isNumericField ? 'none' : 'translateX(-20px)',
                          }
                        : {
                            position: 'fixed',
                            top: keyboardPosition.top,
                            left: keyboardPosition.left,
                            zIndex: 9999,
                            background: 'white',
                            padding: '10px',
                            borderRadius: '8px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                            width: isNumericField ? '260px' : '650px',
                            transform: isNumericField ? 'scale(0.8)' : 'scale(0.75)',
                            transformOrigin: 'top left',
                          }
                    }
                  >
                    {isNumericField ? (
                      <Keyboard
                        keyboardRef={(r) => (keyboardRef.current = r)}
                        inputName={activeField ?? 'documentNumber'}
                        layout={numericLayout}
                        display={numericDisplay}
                        onChange={handleKeyboardChange}
                        onKeyPress={handleKeyPress}
                        theme="hg-theme-default hg-layout-numeric numeric-theme"
                      />
                    ) : (
                      <Keyboard
                        keyboardRef={(r) => (keyboardRef.current = r)}
                        inputName={activeField ?? 'user_name'}
                        onChange={handleKeyboardChange}
                        theme="hg-theme-default hg-layout-default"
                        layoutName="default"
                        layout={{
                          default: [
                            'q w e r t y u i o p',
                            'a s d f g h j k l ñ',
                            '{shift} z x c v b n m {bksp}',
                            '{numbers} {space} {enter}',
                          ],
                          shift: [
                            'Q W E R T Y U I O P',
                            'A S D F G H J K L Ñ',
                            '{shift} Z X C V B N M {bksp}',
                            '{numbers} {space} {enter}',
                          ],
                          numbers: [
                            '1 2 3 4 5 6 7 8 9 0',
                            '- / : ; ( ) $ & @ "',
                            "{symbols} . , ? ! ' {bksp}",
                            '{abc} {space} {enter}',
                          ],
                          symbols: [
                            '[ ] { } # % ^ * + =',
                            '_ \\ | ~ < > € £ ¥ ·',
                            "{numbers} . , ? ! ' {bksp}",
                            '{abc} {space} {enter}',
                          ],
                        }}
                        display={{
                          '{bksp}': '⌫',
                          '{enter}': '✓',
                          '{shift}': '⇧',
                          '{numbers}': '123',
                          '{abc}': 'ABC',
                          '{symbols}': '#+=',
                          '{space}': ' ',
                        }}
                        onKeyPress={(button) => {
                          if (button === '{enter}') {
                            setShowKeyboard(false);
                            setActiveField(null);
                          }
                          if (button === '{shift}') {
                            keyboardRef.current?.setOptions({
                              layoutName:
                                keyboardRef.current?.options.layoutName === 'shift'
                                  ? 'default'
                                  : 'shift',
                            });
                          }
                          if (button === '{numbers}') {
                            keyboardRef.current?.setOptions({ layoutName: 'numbers' });
                          }
                          if (button === '{symbols}') {
                            keyboardRef.current?.setOptions({ layoutName: 'symbols' });
                          }
                          if (button === '{abc}') {
                            keyboardRef.current?.setOptions({ layoutName: 'default' });
                          }
                        }}
                      />
                    )}
                  </div>
                )}

                <div className="mb-1 space-y-2">
                  <div className="mb-1 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      readOnly
                      onClick={() => setAcceptTerms(!acceptTerms)}
                      className="h-4 w-4" // tamaño consistente y sin margin
                    />
                    <span className="text-lg font-bold">
                      {t('accept')}{' '}
                      <span
                        className="underline hover:cursor-pointer"
                        onClick={() => openModal('terms')}
                      >
                        {t('terms')}
                      </span>
                    </span>
                  </div>

                  <div className="mb-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={acceptPolicies}
                      readOnly
                      onClick={() => setAcceptPolicies(!acceptPolicies)}
                      className="h-4 w-4"
                    />
                    <span className="text-lg font-bold">
                      {t('accept')}{' '}
                      <span
                        className="underline hover:cursor-pointer"
                        onClick={() => openModal('policies')}
                      >
                        {t('policy')}
                      </span>
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={disabledButton}
                  className={`w-full rounded-lg px-4 py-1 text-lg text-white ${disabledButton ? 'cursor-not-allowed bg-gray-400' : 'bg-[#264892] hover:bg-blue-700'}`}
                >
                  {t('start')}
                </button>
              </form>
            </div>

            <div className="mt-2">
              <p className="text-[12px] leading-[14px] font-medium text-[#00000]">
                {t('finalAccept')}
              </p>
            </div>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50">
            <div className="mt-[25%] w-full max-w-md rounded-md bg-white/95 p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {currentModal === 'terms'
                    ? lang === 'es'
                      ? 'Términos de Autorización de Uso'
                      : 'Terms of Use'
                    : lang === 'es'
                      ? 'Políticas de Tratamiento de Datos'
                      : 'Data Processing Policies'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-md border border-[#F2F2F2] bg-[#F2F2F2] p-2 pr-3 pl-3 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>
              <p className="mb-4 text-sm text-gray-600">
                {currentModal === 'terms' ? (
                  <>
                    <span>{t('termsText')}</span>
                    <br />
                    <br />
                    <button
                      onClick={openIframe}
                      className="w-full rounded-md border border-[#264892] bg-[#264892] p-2 pr-3 pl-3 text-white hover:bg-[#1a3366]"
                      aria-label="Cerrar"
                    >
                      {t('buttonTerms')}
                    </button>
                  </>
                ) : (
                  <>
                    <span>
                      {t('policyText')}
                      <br />
                      <br />
                      {t('policyText2')}
                    </span>
                    <br />
                    <br />
                    <button
                      onClick={openIframe}
                      className="w-full rounded-md border border-[#264892] bg-[#264892] p-2 pr-3 pl-3 text-white hover:bg-[#1a3366]"
                      aria-label="Cerrar"
                    >
                      {t('buttonPolicy')}
                    </button>
                  </>
                )}
              </p>
              <div className="flex justify-end gap-2"></div>
            </div>
          </div>
        )}

        {showModalFrame && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-xl rounded-md bg-white/95 p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {currentModal === 'terms'
                    ? lang === 'es'
                      ? 'Términos de Autorización de Uso'
                      : 'Terms of Use'
                    : lang === 'es'
                      ? 'Políticas de Tratamiento de Datos'
                      : 'Data Processing Policies'}
                </h2>
                <button
                  onClick={() => setShowModalFrame(false)}
                  className="rounded-md border border-[#F2F2F2] bg-[#F2F2F2] p-2 pr-3 pl-3 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  aria-label="Cerrar"
                >
                  ✕
                </button>
              </div>
              <p className="mb-4">
                {currentModal === 'terms' ? (
                  <iframe src="/privacidad.pdf" className="h-[700px] w-full" />
                ) : (
                  <iframe src="/tratamiento-datos.pdf" className="h-[700px] w-full" />
                )}
              </p>
              <div className="flex justify-end gap-2"></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <SessionProvider session={session}>
      <AppSetup />
      <main className="bg-opacity-50 bg-background grid h-svh min-h-screen grid-cols-1 place-content-center overflow-y-auto bg-[url('/background-img-avatar.png')] bg-cover bg-center p-4">
        <ViewController appConfig={appConfig} />
      </main>
      <StartAudio label="Start Audio" />
      <RoomAudioRenderer />
      <Toaster />
    </SessionProvider>
  );
}
