import { type Position } from '../type';

// Bresenham's line algorithm to enumerate integer grid positions between two points (inclusive)
function bresenhamLine(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): Position[] {
  const points: Position[] = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0;
  let y = y0;
  while (true) {
    points.push({ x, y });
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
  return points;
}

/**
 * 給定使用者滑鼠在世界座標中的採樣路徑，推算對應的方塊直線路徑。
 * 目前策略：
 * 1. 取第一與最後採樣點作為直線端點（使用者意圖畫直線）。
 * 2. 使用 Bresenham 取得所有經過的整數方塊座標。
 * 3. 去除重複（Bresenham 已保證唯一）並回傳。
 * 若未來要支援多段或自由曲線，可在此改為串接多段。
 */
export function findPathOfBlocks(mousePath: Position[]): Position[] {
  // 將使用者的採樣路徑視為折線，對每一對相鄰點執行 Bresenham，合併並去重。
  if (!mousePath || mousePath.length < 2) return [];

  const result: Position[] = [];
  const seen = new Set<string>();

  const pushPoint = (p: Position) => {
    const key = `${p.x},${p.y}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(p);
    }
  };

  for (let i = 0; i < mousePath.length - 1; i++) {
    const a = mousePath[i]!;
    const b = mousePath[i + 1]!;
    // 同一格就略過（仍確保加入一次）
    const ax = Math.floor(a.x);
    const ay = Math.floor(a.y);
    const bx = Math.floor(b.x);
    const by = Math.floor(b.y);
    if (i === 0) pushPoint({ x: ax, y: ay });
    if (ax === bx && ay === by) continue;
    const seg = bresenhamLine(ax, ay, bx, by);
    // 第一個點已經加入（除了 i>0 時要避免重複），因此從 1 開始
    for (let j = 1; j < seg.length; j++) pushPoint(seg[j]!);
  }

  return result;
}

/**
 * 單純根據起點與終點，回傳一條直線（含兩端點）的方塊座標清單。
 * 若 start 與 end 同格，回傳單一方塊。
 */
export function findLineBetween(start: Position, end: Position): Position[] {
  const x0 = Math.floor(start.x);
  const y0 = Math.floor(start.y);
  const x1 = Math.floor(end.x);
  const y1 = Math.floor(end.y);
  if (x0 === x1 && y0 === y1) return [{ x: x0, y: y0 }];
  return bresenhamLine(x0, y0, x1, y1);
}
export function getRectangleBetween(
  start: Position,
  end: Position,
): Position[] {
  const x0 = Math.floor(start.x);
  const y0 = Math.floor(start.y);
  const x1 = Math.floor(end.x);
  const y1 = Math.floor(end.y);
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);
  const result: Position[] = [];

  for (let x = minX; x <= maxX; x++) {
    result.push({ x, y: minY });
    if (minY !== maxY) result.push({ x, y: maxY });
  }
  for (let y = minY + 1; y < maxY; y++) {
    result.push({ x: minX, y });
    if (minX !== maxX) result.push({ x: maxX, y });
  }
  return result;
}

export function getCircleBetween(center: Position, radius: number): Position[] {
  const result: Position[] = [];
  const x0 = Math.floor(center.x - radius);
  const y0 = Math.floor(center.y - radius);
  const x1 = Math.floor(center.x + radius);
  const y1 = Math.floor(center.y + radius);
  const r = Math.abs(radius);

  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      const dist = Math.hypot(x - center.x, y - center.y);
      // Only include points close to the circle's border (within 0.5 for pixel-perfect outline)
      if (dist >= r - 0.5 && dist <= r + 0.5) {
        result.push({ x, y });
      }
    }
  }
  return result;
}

export function getFilledRectangleBetween(
  start: Position,
  end: Position,
): Position[] {
  const x0 = Math.floor(start.x);
  const y0 = Math.floor(start.y);
  const x1 = Math.floor(end.x);
  const y1 = Math.floor(end.y);
  const result: Position[] = [];
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      result.push({ x, y });
    }
  }
  return result;
}

export function getFilledCircleBetween(
  center: Position,
  radius: number,
): Position[] {
  /**
   * 優化：原本演算法對 (2r+1)^2 個點逐一 Math.hypot (O(r^2) 次 sqrt)。
   * 這裡改為掃描線：對每個 dy 計算一次 dx = floor(sqrt(r^2 - dy^2))，
   * 再填滿該列 [cx-dx, cx+dx]。僅需 O(r) 次 sqrt，仍輸出所有像素 (必要的 O(r^2) push)。
   */
  const result: Position[] = [];
  if (radius <= 0)
    return [{ x: Math.round(center.x), y: Math.round(center.y) }];

  const cx = Math.round(center.x);
  const cy = Math.round(center.y);
  const r = Math.round(Math.abs(radius));
  const r2 = r * r;

  for (let dy = -r; dy <= r; dy++) {
    const dy2 = dy * dy;
    if (dy2 > r2) continue; // 保險檢查
    // 水平半徑 (dx)；僅對每列開根號一次
    const dx = Math.floor(Math.sqrt(r2 - dy2));
    const y = cy + dy;
    for (let x = cx - dx; x <= cx + dx; x++) {
      result.push({ x, y });
    }
  }
  return result;
}
