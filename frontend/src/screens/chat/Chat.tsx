"use client";

import { ChatContainer } from "@/features/chat/chatContainer/ChatContainer";
import { ChatMessage } from "@/features/chat/chatMessage/ChatMessage";
import { formatDateDDMMYYYY } from "@/helpers/formatDate/formatDate";
import { useEffect, useRef, useState } from "react";
import { ChatMessageForms } from "./ChatMessageForms";
import { ChatMessagePanel } from "./components/ChatMessagePanel";
import { ChatMessageHindFill } from "./components/ChatMessageHindFill";
import { Body } from "@/ds/typography/Body/Body";
import { cn } from "@/ds/utils/cnMerge";
import { H2 } from "@/ds/typography/H2/H2";
import { mainApi } from "@/api-queries/mainApi";
import { useSession } from "@/stores/auth/useSession";
import { useQuerySessionList } from "@/api-queries/hooks/session/useQuerySessionList";
import { H4 } from "@/ds/typography/H4/H4";
import { useParams, useRouter } from "next/navigation";
import { getSessionMessageList } from "@/api-queries/requests/session/getSessionMessageList";
import { queryClient } from "@/api-queries/queryClient";

export function formatHourForMessageChat(dateString: string): string {
  const date = new Date(dateString);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${formatDateDDMMYYYY(date)} ${hours}:${minutes}`;
}

export enum ChatMessageSendByEnum {
  USER = "user",
  ASSISTANT = "assistant",
}

export interface ChatMessageMessage {
  id: string;
  sessionId: string;
  sendBy: ChatMessageSendByEnum;
  message: string;
  createdAt: string;
  updatedAt: string;
}
export interface Session {
  id: string;
  userId: string;
  title: string;
  chatVersion: string;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}

// Helper: "Outubro de 2025" (pt-BR), com mês capitalizado
function formatMonthPtBR(date: Date): string {
  const s = date.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "America/Bahia",
  }); // ex: "outubro de 2025"
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Agrupa sessões em:
 *   [0] => últimas N (default 30) dias
 *   [1..] => grupos por mês (YYYY-MM) para o restante, do mais recente ao mais antigo
 * Observação: usa fuso local (America/Bahia) via getters locais.
 */
export function groupSessionsByRecencyAndMonth(
  input: Session[],
  opts: { days?: number; now?: Date } = {}
): Session[][] {
  const days = opts.days ?? 30;
  const now = opts.now ?? new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Normaliza e ordena por createdAt desc
  const sessions = input
    .map((s) => ({
      ...s,
      createdAt:
        s.createdAt instanceof Date ? s.createdAt : new Date(s.createdAt),
      updatedAt:
        s.updatedAt instanceof Date ? s.updatedAt : new Date(s.updatedAt),
    }))
    .filter((s) => !isNaN(s.createdAt.getTime()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const recent: Session[] = [];
  const olderByMonth = new Map<string, Session[]>();

  for (const s of sessions) {
    if (s.createdAt.getTime() > now.getTime()) continue;

    if (s.createdAt.getTime() >= cutoff.getTime()) {
      recent.push(s);
    } else {
      // Agrupamento por mês usando horário local
      const y = s.createdAt.getFullYear();
      const m = String(s.createdAt.getMonth() + 1).padStart(2, "0");
      const key = `${y}-${m}`; // YYYY-MM
      const arr = olderByMonth.get(key) ?? [];
      arr.push(s);
      olderByMonth.set(key, arr);
    }
  }

  const monthKeysDesc = Array.from(olderByMonth.keys()).sort((a, b) =>
    a < b ? 1 : a > b ? -1 : 0
  );

  return [recent, ...monthKeysDesc.map((k) => olderByMonth.get(k)!)];
}

/**
 * Versão com rótulos:
 *   - index 0: "30 dias atrás"
 *   - demais: mês por extenso, ex.: "Outubro de 2025"
 */
export function groupSessionsLabeled(
  input: Session[],
  opts: { days?: number; now?: Date } = {}
): { label: string; sessions: Session[] }[] {
  const days = opts.days ?? 30;
  const now = opts.now ?? new Date();
  const buckets = groupSessionsByRecencyAndMonth(input, { days, now });

  const labeled: { label: string; sessions: Session[] }[] = [];
  if (buckets.length === 0) return labeled;

  // Primeiro bucket (últimos N dias) -> label fixo
  if (buckets[0].length) {
    labeled.push({ label: "Últimos 30 dias", sessions: buckets[0] });
  }

  // Demais buckets -> mês por extenso
  for (let i = 1; i < buckets.length; i++) {
    const bucket = buckets[i];
    if (!bucket.length) continue;
    const label = formatMonthPtBR(bucket[0].createdAt);
    labeled.push({ label, sessions: bucket });
  }

  return labeled;
}
export function ChatScreen({
  blockSendMessage,
  noAnimation,
}: {
  blockSendMessage?: boolean;
  noAnimation?: boolean;
}) {
  const submitRef = useRef<HTMLButtonElement>(null);
  const { userId, userData } = useSession();
  const { data: sessionList } = useQuerySessionList();
  const [sessionId, setSessionId] = useState<string>("");
  const [data, setData] = useState<ChatMessageMessage[]>([]);
  const params = useParams<{ sessionId?: string }>();
  const routeSessionId = (params?.sessionId || "").trim();
  const router = useRouter();

  const refreshMessagesFromDB = async (sid: string) => {
    const response = await getSessionMessageList({ id: sid });
    const mapped: ChatMessageMessage[] = response.map((m) => ({
      id: m.id,
      sessionId: m.sessionId,
      sendBy:
        m.role === "user"
          ? ChatMessageSendByEnum.USER
          : ChatMessageSendByEnum.ASSISTANT,
      message: m.content,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt || m.createdAt,
    }));
    setData(mapped);
  };

  useEffect(() => {
    const sid = routeSessionId;
    if (!sid) return;

    // evita refetch desnecessário
    if (sid === sessionId && data.length) return;

    (async () => {
      try {
        setSessionId(sid);

        // 🚀 escolha um endpoint compatível com o seu backend:
        // 1) /session/:id/messages
        const response = await getSessionMessageList({ id: sid });
        // 2) ou /messages?sessionId=:id
        // const { data: api } = await mainApi.get<ApiMessage[]>(`/messages`, { params: { sessionId: sid } });

        // mapeia para o shape da sua UI
        const mapped: ChatMessageMessage[] = response.map((m) => ({
          id: m.id,
          sessionId: m.sessionId,
          sendBy:
            m.role === "user"
              ? ChatMessageSendByEnum.USER
              : ChatMessageSendByEnum.ASSISTANT,
          message: m.content,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt || m.createdAt,
        }));

        setData(mapped);
      } catch (e) {
        console.error("Falha ao carregar mensagens da sessão:", e);
        router.replace(`/chat`, { scroll: false });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeSessionId]);

  const handleSendMessage = async (text: string) => {
    // 1️⃣ Cria ou obtém a sessão
    let sid = sessionId;
    if (!sid) {
      const { data: session } = await mainApi.post("/session", {
        userId,
        content: text,
      });
      sid = session.id;
      setSessionId(sid);
      await queryClient.invalidateQueries({
        queryKey: ["sessionList"],
      });
    }

    // 2️⃣ Adiciona mensagem do usuário
    const now = new Date().toISOString();
    const userIdMsg = Math.random().toString(36).substr(2);
    setData((prev) => [
      ...prev,
      {
        id: userIdMsg,
        sessionId: sid,
        sendBy: ChatMessageSendByEnum.USER,
        message: text,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    // 3️⃣ Placeholder do assistente
    const botId = Math.random().toString(36).substr(2);
    setData((prev) => [
      ...prev,
      {
        id: botId,
        sessionId: sid,
        sendBy: ChatMessageSendByEnum.ASSISTANT,
        message: "",
        createdAt: now,
        updatedAt: now,
      },
    ]);

    // 4️⃣ Fetch puro para SSE
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/session/${sid}/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${mainApi.defaults.headers.common.Authorization}`,
      },
      body: JSON.stringify({ sessionId: sid, userId, content: text }),
    });

    if (!res.body) {
      console.error("Streaming não disponível");
      return;
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    let streamBuf = "";
    let dataLines: string[] = []; // acumula linhas data: de um mesmo evento

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      streamBuf += decoder.decode(value, { stream: true });

      let nlIndex: number;
      while ((nlIndex = streamBuf.indexOf("\n")) !== -1) {
        let line = streamBuf.slice(0, nlIndex);
        streamBuf = streamBuf.slice(nlIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1); // CRLF -> LF

        // linha em branco = fim do evento
        if (line === "") {
          if (dataLines.length > 0) {
            // junta APENAS entre múltiplas linhas data:
            const token =
              dataLines.length === 1 ? dataLines[0] : dataLines.join("\n");
            dataLines = [];

            if (token === "[END]") {
              // encerra o stream
              reader.cancel();
              // atualiza a lista pelo BD para preservar quebras de linha
              await refreshMessagesFromDB(sid);

              // navega só depois que o stream acaba
              setTimeout(() => {
                if ((params?.sessionId || "") !== sid) {
                  router.replace(`/chat/${sid}`, { scroll: false });
                }
              }, 0);

              return;
            }

            setData((prev) =>
              prev.map((m) =>
                m.id === botId
                  ? {
                      ...m,
                      message: m.message + token, // sem \n extra aqui
                      updatedAt: new Date().toISOString(),
                    }
                  : m
              )
            );

            // flush final, se fechar sem linha em branco
            if (dataLines.length > 0) {
              const token =
                dataLines.length === 1 ? dataLines[0] : dataLines.join("\n");
              setData((prev) =>
                prev.map((m) =>
                  m.id === botId
                    ? {
                        ...m,
                        message: m.message + token,
                        updatedAt: new Date().toISOString(),
                      }
                    : m
                )
              );

              // encerra e navega ao fim do stream
              reader.cancel();

                await refreshMessagesFromDB(sid);

              setTimeout(() => {
                if ((params?.sessionId || "") !== sid) {
                  router.replace(`/chat/${sid}`, { scroll: false });
                }
              }, 0);

              return;
            }
          }
          continue;
        }

        // apenas campo data:
        if (line.startsWith("data:")) {
          // remove "data:" e UM espaço opcional após os dois pontos
          let dl = line.slice(5);
          if (dl.startsWith(" ")) dl = dl.slice(1);
          dataLines.push(dl);
        }
      }
    }

    // flush final, se fechar sem linha em branco
    if (dataLines.length > 0) {
      const token =
        dataLines.length === 1 ? dataLines[0] : dataLines.join("\n");
      setData((prev) =>
        prev.map((m) =>
          m.id === botId
            ? {
                ...m,
                message: m.message + token,
                updatedAt: new Date().toISOString(),
              }
            : m
        )
      );
    }
  };

  return (
    <>
      <ChatMessagePanel active>
        <div className="w-full h-full overflow-y-auto px-4 py-6">
          <div
            onClick={() => {
              router.replace(`/chat`, { scroll: false });
            }}
            className="p-2 cursor-pointer flex flex-row items-center gap-1 hover:bg-[#F1F2F4] rounded-md w-full mb-6 transition-colors duration-300"
          >
            <Body weight="Regular" className=" text-[#1D1D1D]">
              Nova dúvida
            </Body>
          </div>

          {sessionList &&
            groupSessionsLabeled(sessionList)?.map(
              ({ label, sessions }, index) => {
                return (
                  <div
                    key={index}
                    className="mb-6 flex flex-col gap-1 cursor-default transition-colors duration-300"
                  >
                    <H4
                      weight="Medium"
                      font="poppins"
                      className="w-full px-0 py-2 mb-4 rounded-md truncate"
                    >
                      {label}
                    </H4>
                    {sessions.map(({ title, id }, index) => {
                      return (
                        <div
                          key={index}
                          className={cn(
                            "w-full px-2 py-1 rounded-md transition-colors duration-300 hover:bg-[#F1F2F4] cursor-pointer",
                            id === sessionId ? "bg-[#F1F2F4]" : ""
                          )}
                          onClick={() => {
                            if (!id || id === sessionId) return;
                            setSessionId(id);
                            router.replace(`/chat/${id}`, { scroll: false });
                          }}
                        >
                          <Body
                            weight={id === sessionId ? "Bold" : "Regular"}
                            className=" text-[#1D1D1D]"
                          >
                            {title}
                          </Body>
                        </div>
                      );
                    })}
                  </div>
                );
              }
            )}
        </div>
      </ChatMessagePanel>

      <ChatMessageHindFill activePanel>
        <div className="flex flex-col justify-between items-center w-full flex-1 pt-8 relative h-full">
          <ChatContainer className="pb-[9.6rem] px-6">
            {data.slice().map(({ id, sendBy, message, updatedAt }) => (
              <ChatMessage
                userName={userData?.name || "TD"}
                key={id + message + message.length}
                ownerSendBy={ChatMessageSendByEnum.ASSISTANT}
                sendBy={sendBy}
                date={formatHourForMessageChat(updatedAt)}
              >
                {message}
              </ChatMessage>
            ))}
          </ChatContainer>

          <div
            className={cn(
              "w-full sticky bottom-0 flex flex-col justify-between items-center transition-all duration-600 px-6  max-w-[100rem]",
              data.length || noAnimation
                ? "h-[6rem]"
                : "-translate-y-[calc(50vh-3.5rem)] h-[15rem] "
            )}
          >
            <H2
              weight="Medium"
              font="poppins"
              className={cn(
                "text-center text-[#1D1D1D] transition-all duration-500 ease-in-out",
                data.length || noAnimation
                  ? "opacity-0 scale-95 pointer-events-none select-none h-0"
                  : "opacity-100 scale-100 pb-9 "
              )}
            >
              Consulte os dados dos bolsistas
            </H2>
            <div
              className={cn(
                "flex w-full flex-col justify-between items-center transition-all duration-600",
                data.length || noAnimation
                  ? ""
                  : "w-[100%] h-fit border-[0.1rem] border-[#E4E4E4] bg-[#F8F9FA] rounded-[1rem] p-6"
              )}
            >
              <ChatMessageForms
                blockSendMessage={blockSendMessage || false}
                useSubmitButtonRef={submitRef}
                onSubmit={handleSendMessage}
              />
              <Body
                weight="Regular"
                className="h-full text-[#1D1D1D] text-center py-7 max-w-[59rem]"
              >
                As respostas usam a base ativa de bolsistas CNPq, métricas estruturadas
                e inferências registradas no pipeline. Campos inferidos devem ser tratados
                como apoio analítico, não como dado oficial declarado.
              </Body>
            </div>
          </div>
        </div>
      </ChatMessageHindFill>
    </>
  );
}
