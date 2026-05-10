"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { MessageSquare, Phone, Search, Send } from "lucide-react";
import { fetchJson } from "@/lib/api";
import { type SessionUser, getSession } from "@/lib/auth-session";
import { getRealtimeUrl } from "@/lib/realtime";
import { MobileShell } from "./passenger-mobile-routes";
import { PassengerDesktopShell } from "./passenger-desktop-routes";
import { DriverShell } from "./driver-mobile-routes";
import { DriverDesktopShell } from "./driver-desktop-routes";

type ConversationListResponse = {
  conversations: ConversationSummary[];
};

type ConversationThreadResponse = {
  conversation: {
    rideId: string;
    status: string;
    pickup: string;
    destination: string;
    otherParticipant: {
      id: string;
      name: string;
      phone: string;
      role: "PASSENGER" | "DRIVER";
    };
  };
  messages: ChatMessage[];
};

type ConversationSummary = {
  rideId: string;
  status: string;
  pickup: string;
  destination: string;
  updatedAt: string;
  unreadCount: number;
  otherParticipant: {
    id: string;
    name: string;
    phone: string;
    role: "PASSENGER" | "DRIVER";
  };
  latestMessage: {
    id: string;
    body: string;
    createdAt: string;
    senderId: string;
    senderName: string;
    senderRole: "PASSENGER" | "DRIVER";
    readAt?: string | null;
  } | null;
};

type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  readAt?: string | null;
  isMine: boolean;
  sender: {
    id: string;
    name: string;
    role: "PASSENGER" | "DRIVER";
  };
};

function useRideChat() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeRideId, setActiveRideId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] =
    useState<ConversationThreadResponse["conversation"] | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const loadConversations = async () => {
    const payload = await fetchJson<ConversationListResponse>("/messages/conversations");
    setConversations(payload.conversations);
    setActiveRideId((current) => current ?? payload.conversations[0]?.rideId ?? null);
  };

  useEffect(() => {
    loadConversations()
      .catch(() => {
        setConversations([]);
        setActiveRideId(null);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeRideId) {
      setActiveConversation(null);
      setMessages([]);
      return;
    }

    fetchJson<ConversationThreadResponse>(`/messages/conversations/${activeRideId}`)
      .then((payload) => {
        setActiveConversation(payload.conversation);
        setMessages(payload.messages);
        setConversations((current) =>
          current.map((conversation) =>
            conversation.rideId === activeRideId
              ? { ...conversation, unreadCount: 0 }
              : conversation
          )
        );
      })
      .catch(() => {
        setActiveConversation(null);
        setMessages([]);
      });
  }, [activeRideId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const session = getSession();

    if (!session?.token) {
      return;
    }

    const socket = new WebSocket(getRealtimeUrl(session.token));

    socket.addEventListener("message", (event) => {
      try {
        const envelope = JSON.parse(event.data) as {
          type?: string;
          payload?: {
            rideId?: string;
            message?: {
              id: string;
              body: string;
              createdAt: string;
              senderId: string;
              senderName: string;
              senderRole: "PASSENGER" | "DRIVER";
              readAt?: string | null;
            };
          };
        };

        if (envelope.type !== "chat.message" || !envelope.payload?.rideId || !envelope.payload.message) {
          return;
        }

        const rideId = envelope.payload.rideId;
        const incoming = envelope.payload.message;
        const me = getSession()?.user.id;

        setConversations((current) =>
          current.map((conversation) =>
            conversation.rideId === rideId
              ? {
                  ...conversation,
                  updatedAt: incoming.createdAt,
                  unreadCount:
                    activeRideId === rideId || incoming.senderId === me
                      ? 0
                      : conversation.unreadCount + 1,
                  latestMessage: incoming
                }
              : conversation
          )
        );

        if (activeRideId === rideId) {
          setMessages((current) => {
            if (current.some((message) => message.id === incoming.id)) {
              return current;
            }

            return [
              ...current,
              {
                id: incoming.id,
                body: incoming.body,
                createdAt: incoming.createdAt,
                readAt: incoming.readAt ?? null,
                isMine: incoming.senderId === me,
                sender: {
                  id: incoming.senderId,
                  name: incoming.senderName,
                  role: incoming.senderRole
                }
              }
            ];
          });
        }
      } catch {
        // Ignore malformed realtime payloads in the client.
      }
    });

    return () => {
      socket.close();
    };
  }, [activeRideId]);

  const sendMessage = async () => {
    const body = draft.trim();

    if (!activeRideId || !body || sending) {
      return;
    }

    setSending(true);

    try {
      const payload = await fetchJson<{ message: ChatMessage }>(`/messages/conversations/${activeRideId}`, {
        method: "POST",
        body: JSON.stringify({ body })
      });

      setMessages((current) =>
        current.some((message) => message.id === payload.message.id)
          ? current
          : [...current, payload.message]
      );
      setConversations((current) =>
        current.map((conversation) =>
          conversation.rideId === activeRideId
            ? {
                ...conversation,
                updatedAt: payload.message.createdAt,
                latestMessage: {
                  id: payload.message.id,
                  body: payload.message.body,
                  createdAt: payload.message.createdAt,
                  senderId: payload.message.sender.id,
                  senderName: payload.message.sender.name,
                  senderRole: payload.message.sender.role,
                  readAt: payload.message.readAt ?? null
                }
              }
            : conversation
        )
      );
      setDraft("");
    } finally {
      setSending(false);
    }
  };

  return {
    loading,
    conversations,
    activeRideId,
    setActiveRideId,
    activeConversation,
    messages,
    draft,
    setDraft,
    sendMessage,
    sending,
    bottomRef
  };
}

function formatStamp(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function ChatEmpty({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
      <MessageSquare className="mb-4 h-12 w-12 opacity-20" />
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-1 text-sm">{description}</p>
    </div>
  );
}

function ConversationRows({
  conversations,
  activeRideId,
  setActiveRideId
}: {
  conversations: ConversationSummary[];
  activeRideId: string | null;
  setActiveRideId: (rideId: string) => void;
}) {
  if (!conversations.length) {
    return (
      <ChatEmpty
        title="No ride conversations yet"
        description="Once a driver accepts a ride, the shared trip chat will appear here."
      />
    );
  }

  return (
    <div className="space-y-2">
      {conversations.map((conversation) => (
        <button
          key={conversation.rideId}
          onClick={() => setActiveRideId(conversation.rideId)}
          className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
            activeRideId === conversation.rideId
              ? "border-primary bg-primary/8"
              : "border-border bg-card hover:bg-muted/50"
          }`}
          type="button"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
            {conversation.otherParticipant.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate font-bold">{conversation.otherParticipant.name}</h3>
              <span className="shrink-0 text-[11px] text-muted-foreground">
                {formatStamp(conversation.latestMessage?.createdAt ?? conversation.updatedAt)}
              </span>
            </div>
            <p className="mt-1 truncate text-xs font-medium text-primary">
              {conversation.pickup} to {conversation.destination}
            </p>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {conversation.latestMessage?.body ?? "No messages yet. Start the trip conversation here."}
            </p>
          </div>
          {conversation.unreadCount > 0 ? (
            <div className="rounded-full bg-primary px-2 py-1 text-[10px] font-bold text-primary-foreground">
              {conversation.unreadCount}
            </div>
          ) : null}
        </button>
      ))}
    </div>
  );
}

function ThreadPane({
  activeConversation,
  messages,
  draft,
  setDraft,
  sendMessage,
  sending,
  bottomRef
}: {
  activeConversation: ConversationThreadResponse["conversation"] | null;
  messages: ChatMessage[];
  draft: string;
  setDraft: (value: string) => void;
  sendMessage: () => Promise<void>;
  sending: boolean;
  bottomRef: RefObject<HTMLDivElement | null>;
}) {
  if (!activeConversation) {
    return (
      <ChatEmpty
        title="Open a ride thread"
        description="Choose a conversation to view the shared chat between passenger and driver."
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border bg-card px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold">{activeConversation.otherParticipant.name}</h2>
            <p className="truncate text-xs font-medium text-primary">
              {activeConversation.pickup} to {activeConversation.destination}
            </p>
          </div>
          <a
            href={`tel:${activeConversation.otherParticipant.phone}`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary"
          >
            <Phone className="h-5 w-5" />
          </a>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <div className="space-y-4">
          {!messages.length ? (
            <ChatEmpty
              title="No messages yet"
              description="Send the first message to coordinate pickup and arrival."
            />
          ) : null}
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  message.isMine
                    ? "rounded-tr-sm bg-primary text-primary-foreground"
                    : "rounded-tl-sm border border-border bg-card text-foreground"
                }`}
              >
                {!message.isMine ? (
                  <div className="mb-1 text-[11px] font-bold text-primary">{message.sender.name}</div>
                ) : null}
                <div>{message.body}</div>
                <div className={`mt-2 text-[10px] ${message.isMine ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {formatStamp(message.createdAt)}
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendMessage();
              }
            }}
            className="h-12 flex-1 rounded-full border border-border bg-muted/50 px-4 text-sm outline-none"
            placeholder="Type a message..."
          />
          <button
            onClick={() => void sendMessage()}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-60"
            disabled={sending || !draft.trim()}
            type="button"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function PassengerMessagesMobileLive({ user }: { user: SessionUser }) {
  const chat = useRideChat();

  return (
    <MobileShell title="Messages" active="messages">
      {chat.loading ? (
        <ChatEmpty title="Loading conversations" description="Qiilu is syncing your ride chat." />
      ) : (
        <div className="space-y-4">
          <ConversationRows
            conversations={chat.conversations}
            activeRideId={chat.activeRideId}
            setActiveRideId={chat.setActiveRideId}
          />
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <ThreadPane {...chat} />
          </div>
        </div>
      )}
    </MobileShell>
  );
}

export function PassengerMessagesDesktopLive({ user }: { user: SessionUser }) {
  const chat = useRideChat();

  return (
    <PassengerDesktopShell user={user} title="Messages" active="messages">
      <div className="grid h-full min-h-[42rem] grid-cols-[22rem_minmax(0,1fr)] overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-r border-border bg-card">
          <div className="border-b border-border p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input className="h-10 w-full rounded-full bg-muted/50 pl-9 pr-4 text-sm outline-none" placeholder="Search conversations..." />
            </div>
          </div>
          <div className="p-3">
            <ConversationRows
              conversations={chat.conversations}
              activeRideId={chat.activeRideId}
              setActiveRideId={chat.setActiveRideId}
            />
          </div>
        </div>
        <ThreadPane {...chat} />
      </div>
    </PassengerDesktopShell>
  );
}

export function DriverMessagesMobileLive({ user }: { user: SessionUser }) {
  const chat = useRideChat();

  return (
    <DriverShell title="Messages" active="messages">
      {chat.loading ? (
        <ChatEmpty title="Loading conversations" description="Qiilu is syncing your ride chat." />
      ) : (
        <div className="space-y-4">
          <ConversationRows
            conversations={chat.conversations}
            activeRideId={chat.activeRideId}
            setActiveRideId={chat.setActiveRideId}
          />
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <ThreadPane {...chat} />
          </div>
        </div>
      )}
    </DriverShell>
  );
}

export function DriverMessagesDesktopLive({ user }: { user: SessionUser }) {
  const chat = useRideChat();

  return (
    <DriverDesktopShell user={user} title="Messages" active="messages">
      <div className="grid min-h-[42rem] grid-cols-[22rem_minmax(0,1fr)] overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="border-r border-border bg-card">
          <div className="border-b border-border p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input className="h-12 w-full rounded-full bg-muted/50 pl-9 pr-4 text-base outline-none" placeholder="Search conversations..." />
            </div>
          </div>
          <div className="p-4">
            <ConversationRows
              conversations={chat.conversations}
              activeRideId={chat.activeRideId}
              setActiveRideId={chat.setActiveRideId}
            />
          </div>
        </div>
        <ThreadPane {...chat} />
      </div>
    </DriverDesktopShell>
  );
}
