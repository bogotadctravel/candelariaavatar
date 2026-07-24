'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, type HTMLMotionProps, motion } from 'motion/react';
import { type ReceivedMessage } from '@livekit/components-react';
import { ChatEntry } from '@/components/livekit/chat-entry';

const MotionContainer = motion.create('div');
const MotionChatEntry = motion.create(ChatEntry);

const CONTAINER_MOTION_PROPS = {
  variants: {
    hidden: {
      opacity: 0,
      transition: {
        ease: 'easeOut',
        duration: 0.3,
        staggerChildren: 0.1,
        staggerDirection: -1,
      },
    },
    visible: {
      opacity: 1,
      transition: {
        delay: 0.2,
        ease: 'easeOut',
        duration: 0.3,
        stagerDelay: 0.2,
        staggerChildren: 0.1,
        staggerDirection: 1,
      },
    },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
};

const MESSAGE_MOTION_PROPS = {
  variants: {
    hidden: {
      opacity: 0,
      translateY: 10,
    },
    visible: {
      opacity: 1,
      translateY: 0,
    },
  },
};

interface ChatTranscriptProps {
  hidden?: boolean;
  messages?: ReceivedMessage[];
}

export function ChatTranscript({
  hidden = false,
  messages = [],
  ...props
}: ChatTranscriptProps & Omit<HTMLMotionProps<'div'>, 'ref'>) {
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const previousLastId = useRef<string | undefined>(undefined);

  useEffect(() => {
    const lastMessage = messages.at(-1);

    if (!lastMessage) return;

    if (lastMessage.id !== previousLastId.current) {
      lastMessageRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });

      previousLastId.current = lastMessage.id;
    }
  }, [messages]);

  return (
    <AnimatePresence>
      {!hidden && (
        <MotionContainer {...CONTAINER_MOTION_PROPS} {...props}>
          {messages.map((receivedMessage, index) => {
            const { id, timestamp, from, message } = receivedMessage;
            const locale = navigator?.language ?? 'en-US';
            const messageOrigin = from?.isLocal ? 'local' : 'remote';
            const hasBeenEdited =
              receivedMessage.type === 'chatMessage' && !!receivedMessage.editTimestamp;
            const isLast = index === messages.length - 1;

            return (
              <div key={id} ref={isLast ? lastMessageRef : undefined}>
                <MotionChatEntry
                  // key={id}
                  locale={locale}
                  timestamp={timestamp}
                  message={message}
                  messageOrigin={messageOrigin}
                  hasBeenEdited={hasBeenEdited}
                  {...MESSAGE_MOTION_PROPS}
                />
              </div>
            );
          })}
        </MotionContainer>
      )}
    </AnimatePresence>
  );
}
