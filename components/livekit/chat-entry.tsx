import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ChatEntryProps extends React.HTMLAttributes<HTMLLIElement> {
  /** The locale to use for the timestamp. */
  locale: string;
  /** The timestamp of the message. */
  timestamp: number;
  /** The message to display. */
  message: string;
  /** The origin of the message. */
  messageOrigin: 'local' | 'remote';
  /** The sender's name. */
  name?: string;
  /** Whether the message has been edited. */
  hasBeenEdited?: boolean;
}

function eliminarJsonArray(texto: string): string {
  const inicio = texto.indexOf('[');

  if (inicio === -1) {
    return texto;
  }

  let nivel = 0;
  let dentroString = false;
  let escape = false;

  for (let i = inicio; i < texto.length; i++) {
    const char = texto[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === '\\') {
      escape = true;
      continue;
    }

    if (char === '"') {
      dentroString = !dentroString;
      continue;
    }

    if (!dentroString) {
      if (char === '[') nivel++;
      if (char === ']') nivel--;

      if (nivel === 0) {
        const posibleJson = texto.slice(inicio, i + 1);

        try {
          const parsed = JSON.parse(posibleJson);

          if (Array.isArray(parsed)) {
            return (texto.slice(0, inicio) + texto.slice(i + 1)).trim();
          }
        } catch {
          // No era JSON válido
        }

        break;
      }
    }
  }

  return texto;
}

export const ChatEntry = ({
  name,
  locale,
  timestamp,
  message,
  messageOrigin,
  hasBeenEdited = false,
  className,
  ...props
}: ChatEntryProps) => {
  const time = new Date(timestamp);
  const title = time.toLocaleTimeString(locale, { timeStyle: 'full' });

  return (
    <li
      title={title}
      data-lk-message-origin={messageOrigin}
      className={cn('group flex w-full flex-col gap-0.5', className)}
      {...props}
    >
      <header
        className={cn(
          'text-muted-foreground flex items-center gap-2 text-sm',
          messageOrigin === 'local' ? 'flex-row-reverse' : 'text-left'
        )}
      >
        {name && <strong>{name}</strong>}
        <span className="font-mono text-xs opacity-0 transition-opacity ease-linear group-hover:opacity-100">
          {hasBeenEdited && '*'}
          {time.toLocaleTimeString(locale, { timeStyle: 'short' })}
        </span>
      </header>
      <span
        className={cn(
          'max-w-4/5 rounded-[20px]',
          messageOrigin === 'local' ? 'bg-muted ml-auto p-2' : 'mr-auto bg-[#26489214] p-[0.5rem]'
        )}
      >
        {eliminarJsonArray(message)}
      </span>
    </li>
  );
};
