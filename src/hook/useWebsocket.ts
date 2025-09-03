import type { WSMessage } from '../type';
import { useRef } from 'react';

export function useWebsocket({
  onConnect = () => {},
  onMessage = (message: WSMessage) => {},
  onError = (error: Event) => {},
  onDisconnect = (event: CloseEvent) => {},
}) {
  let ws = useRef<WebSocket | null>(null);
  let isConnecting = useRef<boolean>(false);
  let isConnected = useRef<boolean>(false);

  function connect() {
    if (isConnecting.current || isConnected.current) return;
    isConnecting.current = true;
    const connectURL = `${location.protocol.replace('http', 'ws')}//${
      location.host
    }/ws`;
    ws.current = new WebSocket(connectURL);

    ws.current.addEventListener('open', () => {
      onConnect();
      isConnecting.current = false;
      isConnected.current = true;
    });

    ws.current.addEventListener('message', (event) => {
      let data: WSMessage;
      try {
        data = JSON.parse(event.data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        return;
      }
      ws.current?.send(
        JSON.stringify({
          type: 'messageReceiveCheck',
          payload: {
            messageId: data.messageId,
          },
        }),
      );
      onMessage(data);
    });

    ws.current.addEventListener('error', (event) => {
      onError(event);
    });

    ws.current.addEventListener('close', (event) => {
      onDisconnect(event);
      setTimeout(() => {
        console.log('WebSocket disconnected, attempting to reconnect...');
        connect();
      }, 1000);
    });
    setTimeout(() => {
      if (!isConnected.current) {
        console.log('WebSocket is not connected, attempting to reconnect...');
        connect();
      }
    }, 1000);
  }

  connect();

  function sendMessage(message: WSMessage) {
    if (ws.current && isConnected.current) {
      ws.current.send(JSON.stringify(message));
    }
  }

  return {
    ws,
    sendMessage,
  };
}
