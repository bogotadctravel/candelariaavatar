export interface AppConfig {
  pageTitle: string;
  pageDescription: string;
  companyName: string;

  supportsChatInput: boolean;
  supportsVideoInput: boolean;
  supportsScreenShare: boolean;
  isPreConnectBufferEnabled: boolean;

  logo: string;
  startButtonText: string;
  accent?: string;
  logoDark?: string;
  accentDark?: string;

  // for LiveKit Cloud Sandbox
  sandboxId?: string;
  agentName?: string;
}

export const APP_CONFIG_DEFAULTS: AppConfig = {
  companyName: 'Instituto Distrital de Turismo',
  pageTitle: 'Candelaria - Avatar IDT',
  pageDescription: 'Candelaria nuestra experta en turismo en la ciudad de Bogotá',

  supportsChatInput: false,
  supportsVideoInput: false,
  supportsScreenShare: false,
  isPreConnectBufferEnabled: false,

  logo: '/idt_favicon.png',
  logoDark: '/idt_favicon.png',
  //   logo: '/lk-logo.svg',
  accent: '#002cf2',
  //   logoDark: '/lk-logo-dark.svg',
  accentDark: '#1fd5f9',
  startButtonText: 'Iniciar',

  // for LiveKit Cloud Sandbox
  sandboxId: undefined,
  agentName: undefined,
};
