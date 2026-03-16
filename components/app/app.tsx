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
import { useAgentErrors } from '@/hooks/useAgentErrors';
import { useDebugMode } from '@/hooks/useDebug';
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

  //   const [userMetadata, setUserMetadata] = useState<UserMetadata>({
  //     user_id: '1012318544',
  //     user_name: 'Yurley Osorio',
  //     user_phone: '3174603758',
  //   });
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!showKeyboard || !activeField || !isMobile) return;

    setTimeout(() => {
      const el = document.getElementById(activeField);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }, [showKeyboard, activeField, isMobile]);

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
        user_id: '+0_00012345',
        user_name: 'anonimo',
        user_phone: '+0_00012345',
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

  //const user_id = `1012318544`;
  const tokenSource = useMemo(() => {
    if (!isFormSubmitted) return null;
    console.log('metadata: ', userMetadata);
    console.log(typeof process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT);
    return typeof process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT === 'string'
      ? getSandboxTokenSource(appConfig)
      : TokenSource.endpoint(
          `/api/connection-details?user_id=${userMetadata.user_id}&user_name=${userMetadata.user_name}&user_phone=${userMetadata.user_phone}`
        );
  }, [appConfig, userMetadata, isFormSubmitted]);

  const session = useSession(
    tokenSource!,
    appConfig.agentName ? { agentName: appConfig.agentName } : undefined
  );

  useEffect(() => {
    if (!session) return;

    console.log('session.connectionState: ', session);

    if (session.connectionState === 'disconnected') {
      console.log('🔴 Session disconnected, resetting UI...');
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
      <div className="bg-opacity-50 bg-background flex items-center justify-center overflow-y-auto p-4">
        <div
          ref={formRef}
          className="mx-auto my-auto w-full max-w-[700px] rounded-lg bg-white p-6"
          style={{
            marginBottom: isMobile && showKeyboard ? '380px' : '24px',
            transition: 'margin-bottom 0.3s ease',
          }}
        >
          <div className="mb-6 flex justify-between gap-4">
            <div className="w-1/3">
              <img src="/avatarfront.jpg" alt="Candelaria" className="mx-auto rounded-lg" />
            </div>
            <div className="w-1/3">
              <img src="/idt_a.png" alt="Logo" className="mx-auto rounded-lg" />
            </div>
          </div>
          <div className="">
            ¡Hola! soy Candelaria, tu guía digital. Te brindaré información clave sobre nuestra
            ciudad y te ofreceré recomendaciones personalizadas para crear itinerarios perfectos y
            vivir una experiencia inolvidable.
          </div>

          {/* <h2 className="mb-6 text-2xl font-bold">Ingresa tus datos</h2> */}
          <p className="mt-3 mb-3">Por favor, ingresa los siguientes datos.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <div className="w-1/3">
                {/* <label htmlFor="documentType" className="mb-1 block text-sm font-medium">
                Tipo de Documento
              </label> */}
                <select
                  id="documentType"
                  name="documentType"
                  value={userMetadata.documentType}
                  onChange={handleInputChange}
                  className="h-full w-full rounded-md border p-2"
                >
                  <option disabled value="">
                    Selecciona un indicativo de país
                  </option>
                  {numberCountry.map((country, index) => (
                    <option key={index} value={country.dial_code}>
                      {country.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                {/* <label htmlFor="documentNumber" className="mb-1 block text-sm font-medium">
                Número de Documento
              </label> */}
                <input
                  type="number"
                  id="documentNumber"
                  name="documentNumber"
                  autoComplete="off"
                  placeholder="Número de teléfono"
                  value={userMetadata.documentNumber}
                  onChange={handleInputChange}
                  onFocus={(e) => handleFocus('documentNumber', e)}
                  className="w-full rounded-md border p-2"
                />
              </div>
            </div>
            <div>
              <label htmlFor="user_name" className="mb-1 block text-sm font-medium">
                Nombre
              </label>
              <input
                type="text"
                id="user_name"
                name="user_name"
                autoComplete="off"
                value={userMetadata.user_name}
                onChange={handleInputChange}
                onFocus={(e) => handleFocus('user_name', e)}
                className="w-full rounded-md border p-2"
              />
            </div>

            {showKeyboard && (
              <div
                key={activeField}
                style={
                  isMobile
                    ? {
                        position: 'fixed',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 9999,
                        background: 'white',
                        padding: isMobile && showKeyboard ? '0px' : '10px',
                        borderRadius: '12px 12px 0 0',
                        boxShadow: '0 -4px 20px rgba(0,0,0,0.2)',
                        width: '100%',
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
                    // onKeyPress={handleKeyPress}
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

            <div className="">
              <div className="flex items-start gap-2">
                <span className="text-sm text-[#666666]">
                  Al diligenciar este formulario, certifico que los datos personales que proporciono
                  son veraces, completos y actualizados. Autorizo de manera libre, expresa, previa e
                  informada al Instituto Distrital de Turismo – IDT, para que realicen el
                  tratamiento de mis datos personales, incluyendo su recolección, almacenamiento,
                  uso, análisis, evaluación, transferencia y supresión, conforme a lo establecido en
                  la Ley 1581 de 2012, el Decreto 1377 de 2013 y demás normas aplicables.
                </span>
              </div>
              <div className="mt-3 flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  readOnly
                  onClick={() => {
                    if (!acceptTerms) {
                      setAcceptTerms(true);
                    } else {
                      setAcceptTerms(false);
                    }
                  }}
                  className="mt-1"
                />
                <span className="text-sm">
                  Acepto{' '}
                  <span
                    className="underline hover:cursor-pointer"
                    onClick={() => openModal('terms')}
                  >
                    términos de autorización de uso
                  </span>
                </span>
              </div>

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={acceptPolicies}
                  readOnly
                  onClick={() => {
                    if (!acceptPolicies) {
                      setAcceptPolicies(true);
                    } else {
                      setAcceptPolicies(false);
                    }
                  }}
                  className="mt-1"
                />

                <span className="text-sm">
                  Acepto{' '}
                  <span
                    className="underline hover:cursor-pointer"
                    onClick={() => openModal('policies')}
                  >
                    políticas de tratamiento y uso de datos
                  </span>
                </span>
              </div>
            </div>

            <div className="items-start text-right">
              <button
                type="submit"
                disabled={disabledButton}
                className={`w-[200px] rounded-md px-4 py-2 text-white ${disabledButton ? 'cursor-not-allowed bg-gray-400' : 'bg-[#264892] hover:bg-blue-700'}`}
              >
                Comenzar
              </button>
            </div>
          </form>
        </div>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-md bg-white/95 p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {currentModal === 'terms'
                    ? 'Términos de Autorización de Uso'
                    : 'Políticas de Tratamiento de Datos'}
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
                    <span>
                      Al continuar, autorizo de manera libre, previa, expresa e informada al
                      Instituto Distrital de Turismo – IDT para realizar el tratamiento de mis datos
                      personales, incluyendo su recolección, almacenamiento, uso y análisis, con el
                      fin de gestionar la atención a la ciudadanía, brindar información y mejorar
                      los servicios institucionales.
                    </span>
                    <br />
                    <br />
                    <button
                      onClick={openIframe}
                      className="w-full rounded-md border border-[#264892] bg-[#264892] p-2 pr-3 pl-3 text-white hover:bg-[#1a3366]"
                      aria-label="Cerrar"
                    >
                      Ver términos
                    </button>
                  </>
                ) : (
                  <>
                    <span>
                      El Instituto Distrital de Turismo recopila y utiliza datos personales con el
                      fin de prestar servicios, atender solicitudes ciudadanas, realizar estudios,
                      gestionar actividades institucionales y mejorar la atención al usuario. El
                      tratamiento de esta información se realiza conforme a la normativa vigente
                      garantizando la protección de su información y el ejercicio de sus derechos
                      como titular de los datos.
                      <br />
                      <br />
                      Si desea conocer más sobre el tratamiento de sus datos personales, puede
                      consultar la Política de Tratamiento de Datos Personales del IDT:
                    </span>
                    <br />
                    <br />
                    <button
                      onClick={openIframe}
                      className="w-full rounded-md border border-[#264892] bg-[#264892] p-2 pr-3 pl-3 text-white hover:bg-[#1a3366]"
                      aria-label="Cerrar"
                    >
                      Ver políticas
                    </button>
                  </>
                )}
              </p>

              <div className="flex justify-end gap-2"></div>
            </div>
          </div>
        )}
        {/* iframe pdf */}
        {showModalFrame && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-xl rounded-md bg-white/95 p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {currentModal === 'terms'
                    ? 'Términos de Autorización de Uso'
                    : 'Políticas de Tratamiento de Datos'}
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
      <main className="grid h-svh grid-cols-1 place-content-center">
        <ViewController appConfig={appConfig} />
      </main>
      <StartAudio label="Start Audio" />
      <RoomAudioRenderer />
      <Toaster />
    </SessionProvider>
  );
}
