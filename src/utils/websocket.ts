import { TickData } from "../types/market";

export class DerivWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isManualClose = false;

  constructor(
    private url: string,
    private onMessage: (data: any) => void,
    private onStatusChange: (connected: boolean) => void,
    private onError: (error: string) => void
  ) {}

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.isManualClose = false;

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.onStatusChange(true);
      };

      this.ws.onclose = (event) => {
        this.onStatusChange(false);

        if (
          !this.isManualClose &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
          }, this.reconnectDelay * this.reconnectAttempts);
        }
      };

      this.ws.onerror = (error) => {
        this.onError(`WebSocket error: ${error}`);
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.onMessage(data);
        } catch (error) {
          this.onError(`Failed to parse message: ${error}`);
        }
      };
    } catch (error) {
      this.onError(`Failed to connect: ${error}`);
    }
  }

  disconnect(): void {
    this.isManualClose = true;
    this.reconnectAttempts = 0;

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  subscribe(symbol: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = {
        ticks: symbol,
        subscribe: 1,
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  unsubscribe(symbol: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = {
        forget: symbol,
        unsubscribe: 1,
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Message parsers
export const parseTickMessage = (data: any): TickData | null => {
  if (data.msg_type === "tick" && data.tick) {
    return {
      epoch: data.tick.epoch,
      quote: data.tick.quote,
      symbol: data.tick.symbol,
      id: data.tick.id,
    };
  }
  return null;
};

export const parseErrorMessage = (data: any): string | null => {
  if (data.msg_type === "error" && data.error) {
    return data.error.message;
  }
  return null;
};

// Connection health monitoring
export const monitorConnectionHealth = (
  lastMessageTime: number,
  timeout: number = 10000
): boolean => {
  return Date.now() - lastMessageTime < timeout;
};
