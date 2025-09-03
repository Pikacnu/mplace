export type User = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export type Position = {
  x: number;
  y: number;
};

export type WSMessage = {
  type: string;
  payload: any;
  messageId?: string;
};

export type WithClientIds<T> = T & { clientIds: string[] };

export type BlockInfo = {
  blockId: string;
  properties?: Record<string, any>;
};

export enum PaintToolType {
  None = 'none',
  Pen = 'pen',
  Line = 'line',
  Rectangle = 'rectangle',
  Circle = 'circle',
  FilledRectangle = 'filled_rectangle',
  FilledCircle = 'filled_circle',
  Bucket = 'bucket',
}

export type BlockDetail = {
  x: number;
  y: number;
  z: number;
  placerInfo: {
    name: string;
    avatar: string;
  };
  blockId: string;
};
