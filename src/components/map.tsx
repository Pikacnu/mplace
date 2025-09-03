import {
  useState,
  useEffect,
  useRef,
  type RefObject,
  type Dispatch,
  type SetStateAction,
} from 'react';
import Popup from './popup';
import { type Position } from '../type';
import { PaintToolType, type BlockDetail } from '@/websocket/type';
import {
  findLineBetween,
  findPathOfBlocks,
  getCircleBetween,
  getFilledCircleBetween,
} from '@/hook/utlis';
import { useLocalStorage } from '@/hook/useLocalStorage';
import { ImageChunkSize } from '@/config';

const minScale = (1 / 8) * 3;
const maxScale = 20;

export default function MapDisplay({
  className,
  onPixelSelect,
  onPixelUnselect,
  pixelProvidor,
  chunkSetter,
  getBlockInfoFn,
  blockInfo,
  paintTool,
  setCurrentSelectedPixels,
}: {
  className?: string;
  onPixelSelect?: (position: Position) => void;
  onPixelUnselect?: () => void;
  pixelProvidor?:
    | {
        colorNumber: number;
        position: Position;
      }
    | { colorNumber: number; position: Position }[]
    | undefined;
  chunkSetter: RefObject<Set<string | null>>;
  getBlockInfoFn?: ({ x, y }: Record<string, number>) => void;
  blockInfo?: BlockDetail | null;
  paintTool: PaintToolType;
  setCurrentSelectedPixels: Dispatch<SetStateAction<Position[]>>;
}) {
  // Element Refs
  const mapRef = useRef<HTMLCanvasElement>(null);
  const componentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);

  // Popup Settings
  const [isOpenPopup, setIsOpenPopup] = useState(false);
  const [popupContent, setPopupContent] = useState<React.ReactNode>(null);
  const [popupPosition, setPopupPosition] = useState<Position>({ x: 0, y: 0 });

  // Scale Settings
  const [scale, setScale] = useState(4);

  // Map Offset Settings
  const [mapOffset, setMapOffset] = useState<Position>({ x: 0, y: 0 });

  // Load Local Storage
  const [savedMapOffset, setSavedMapOffset] = useLocalStorage<Position>(
    'mapOffset',
    { x: 0, y: 0 },
  );
  const [savedScale, setSavedScale] = useLocalStorage<number>('mapScale', 4);

  // Dragging States
  const isDragging = useRef(false);
  const dragStartScreen = useRef<Position>({ x: 0, y: 0 });
  const dragStartWorldOffset = useRef<Position>({ x: 0, y: 0 });
  const mouseDownScreen = useRef<Position>({ x: 0, y: 0 });

  const [cursorPosition, setCursorPosition] = useState<Position>({
    x: 0,
    y: 0,
  });

  // ScreenSize
  const [screenSize, setScreenSize] = useState<Position>({
    x: window.innerWidth,
    y: window.innerHeight,
  });

  // Chunked Map Display Function
  const [cachedMapData, setCachedMapData] = useState<
    Map<string, HTMLImageElement>
  >(new Map());

  // Lock The Pixel Indicator when popup is open
  const [lockedWorldPixel, setLockedWorldPixel] = useState<Position | null>(
    null,
  );

  const mixGridSize = useRef<HTMLInputElement>(null);

  // Pointer Events/Datas
  const isHoldSpaceButton = useRef(false);
  const mousePath = useRef<Position[]>([]);
  const currentPointerDownEvents = useRef<PointerEvent[]>([]);
  const pointerDistance = useRef<number | null>(null);

  const [showPath, setShowPath] = useState<Position[]>([]);

  // button Handler

  useEffect(() => {
    if (!componentRef.current) return;

    const worldFromScreen = (sx: number, sy: number) => ({
      x: mapOffset.x + sx / scale,
      y: mapOffset.y + sy / scale,
    });

    const handleResize = () => {
      setScreenSize({ x: window.innerWidth, y: window.innerHeight });
    };

    const handleClick = (e: MouseEvent) => {
      const screenPos = { x: e.clientX, y: e.clientY };
      const worldPos = worldFromScreen(screenPos.x, screenPos.y);
      // 顯示相對於目前視窗左上角 (0,0) 的本地座標 (不受 mapOffset 直接影響，只由螢幕像素/scale 決定)
      const localX = Math.floor(screenPos.x / scale);
      const localY = Math.floor(screenPos.y / scale);
      setPopupContent(
        <div className='min-w-12 text-xs space-y-1'>
          <div>
            <span className='font-medium'>Local</span>: {localX}, {localY}
          </div>
          <div className='opacity-70'>
            <span>World</span>: {Math.floor(worldPos.x)},{' '}
            {Math.floor(worldPos.y)}
          </div>
        </div>,
      );
      getBlockInfoFn?.({
        x: Math.floor(worldPos.x),
        y: Math.floor(worldPos.y),
      });
      setIsOpenPopup(true);
      setPopupPosition(screenPos);
      const locked = {
        x: Math.floor(worldPos.x),
        y: Math.floor(worldPos.y),
      };
      setLockedWorldPixel(locked);
      onPixelSelect?.(locked);
    };

    const handlePointerDown = (e: PointerEvent) => {
      currentPointerDownEvents.current.push(e);
      if (currentPointerDownEvents.current.length === 1)
        pointerDistance.current = null;
      isDragging.current = true;
      dragStartScreen.current = { x: e.clientX, y: e.clientY };
      dragStartWorldOffset.current = { ...mapOffset };
      mouseDownScreen.current = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (currentPointerDownEvents.current.length === 0) return;
      if (currentPointerDownEvents.current.length > 1) {
        const currentPointers = [
          ...currentPointerDownEvents.current.filter(
            (ev) => ev.pointerId !== e.pointerId,
          ),
          e,
        ];
        currentPointerDownEvents.current = currentPointers;
        const pointerPos = currentPointers.map((ev) => ({
          x: ev.clientX,
          y: ev.clientY,
        }));
        const centerPos = pointerPos.reduce(
          (acc, pos) => ({
            x: acc.x + pos.x / currentPointers.length,
            y: acc.y + pos.y / currentPointers.length,
          }),
          { x: 0, y: 0 },
        );
        const avgDistance = pointerPos.reduce((acc, pos) => {
          const dx = pos.x - centerPos.x;
          const dy = pos.y - centerPos.y;
          return acc + Math.sqrt(dx * dx + dy * dy);
        }, 0);
        if (pointerDistance.current === null) {
          pointerDistance.current = avgDistance;
          return;
        }
        const deltaDistance = avgDistance - pointerDistance.current;
        pointerDistance.current = avgDistance;
        const newScale = Math.min(
          Math.max(scale + deltaDistance * 0.005, minScale),
          maxScale,
        );
        if (newScale === scale) return;
        const mouse = { x: e.clientX, y: e.clientY };
        const worldPoint = {
          x: mapOffset.x + mouse.x / scale,
          y: mapOffset.y + mouse.y / scale,
        };
        const newOffset = {
          x: worldPoint.x - mouse.x / newScale,
          y: worldPoint.y - mouse.y / newScale,
        };
        setScale(newScale);
        setSavedScale(newScale);
        setMapOffset(newOffset);
        return;
      }
      setCursorPosition({ x: e.clientX, y: e.clientY });
      if (!isDragging.current) return;
      if (isHoldSpaceButton.current) {
        mousePath.current.push({ x: e.clientX, y: e.clientY });
        return;
      }
      const dx = e.clientX - dragStartScreen.current.x;
      const dy = e.clientY - dragStartScreen.current.y;
      setMapOffset({
        x: dragStartWorldOffset.current.x - dx / scale,
        y: dragStartWorldOffset.current.y - dy / scale,
      });
    };

    const handlePointerUp = (e: PointerEvent) => {
      currentPointerDownEvents.current =
        currentPointerDownEvents.current.filter(
          (event) => event.pointerId !== e.pointerId,
        );
      if (!isDragging.current) return;
      isDragging.current = false;
      if (isHoldSpaceButton.current && paintTool !== PaintToolType.None) {
        mousePath.current.push({ x: e.clientX, y: e.clientY });
        return;
      }
      const moved =
        Math.abs(e.clientX - mouseDownScreen.current.x) +
          Math.abs(e.clientY - mouseDownScreen.current.y) <
        10;
      if (moved) handleClick(e);
      setSavedMapOffset({
        x: mapOffset.x,
        y: mapOffset.y,
      });
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY;
      const newScale = Math.min(
        Math.max(scale + delta * 0.01, minScale),
        maxScale,
      );
      if (newScale === scale) return;
      const mouse = { x: e.clientX, y: e.clientY };
      const worldPoint = {
        x: mapOffset.x + mouse.x / scale,
        y: mapOffset.y + mouse.y / scale,
      };
      const newOffset = {
        x: worldPoint.x - mouse.x / newScale,
        y: worldPoint.y - mouse.y / newScale,
      };
      setScale(newScale);
      setSavedScale(newScale);
      setMapOffset(newOffset);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isHoldSpaceButton.current = true;
      }
      setCurrentSelectedPixels([]);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        const raw = [...mousePath.current];
        const worldPath = raw.map((pos) => ({
          x: pos.x / scale + mapOffset.x,
          y: pos.y / scale + mapOffset.y,
        }));
        let path;
        if (worldPath.length > 1) {
          switch (paintTool) {
            case PaintToolType.Pen:
              path = findPathOfBlocks(worldPath);
              break;
            case PaintToolType.Line:
              if (worldPath.length < 2) path = [];
              path = findLineBetween(
                worldPath[0]!,
                worldPath[worldPath.length - 1]!,
              );
              break;
            case PaintToolType.Rectangle:
              path = [worldPath[0]!, worldPath[worldPath.length - 1]!].map(
                (pos) =>
                  Object.fromEntries(
                    Object.entries(pos).map(([k, v]) => [k, Math.floor(v)]),
                  ) as Position,
              );
              break;
            case PaintToolType.FilledRectangle:
              path = [worldPath[0]!, worldPath[worldPath.length - 1]!].map(
                (pos) =>
                  Object.fromEntries(
                    Object.entries(pos).map(([k, v]) => [k, Math.floor(v)]),
                  ) as Position,
              );
              break;
            case PaintToolType.Circle: {
              const dX = worldPath[worldPath.length - 1]!.x - worldPath[0]!.x;
              const dY = worldPath[worldPath.length - 1]!.y - worldPath[0]!.y;
              const center = {
                x: worldPath[0]!.x + dX / 2,
                y: worldPath[0]!.y + dY / 2,
              };
              const minx = Math.min(...worldPath.map((p) => p.x));
              const maxx = Math.max(...worldPath.map((p) => p.x));
              const miny = Math.min(...worldPath.map((p) => p.y));
              const maxy = Math.max(...worldPath.map((p) => p.y));
              const radius = Math.min(maxx - minx, maxy - miny) / 2;
              path = getCircleBetween(center, radius);
              break;
            }
            case PaintToolType.FilledCircle: {
              const center = {
                x:
                  worldPath[0]!.x +
                  (worldPath[worldPath.length - 1]!.x - worldPath[0]!.x) / 2,
                y:
                  worldPath[0]!.y +
                  (worldPath[worldPath.length - 1]!.y - worldPath[0]!.y) / 2,
              };
              const minx = Math.min(...worldPath.map((p) => p.x));
              const miny = Math.min(...worldPath.map((p) => p.y));
              const maxx = Math.max(...worldPath.map((p) => p.x));
              const maxy = Math.max(...worldPath.map((p) => p.y));
              const radius = Math.min(maxx - minx, maxy - miny) / 2;
              path = getFilledCircleBetween(center, radius);
              break;
            }
            default:
              path = [] as Position[];
          }
          setShowPath(path);
          setCurrentSelectedPixels(path);
        }
        mousePath.current = [];
        isHoldSpaceButton.current = false;
      }
    };

    window.addEventListener('resize', handleResize);
    const el = mapRef.current!;
    el.addEventListener('pointerdown', handlePointerDown);
    el.addEventListener('pointermove', handlePointerMove);
    el.addEventListener('pointerup', handlePointerUp);
    el.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('resize', handleResize);

      el.removeEventListener('pointerdown', handlePointerDown);
      el.removeEventListener('pointermove', handlePointerMove);
      el.removeEventListener('pointerup', handlePointerUp);

      el.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [mapOffset, scale, onPixelSelect]);

  // Map Updater

  useEffect(() => {
    const ctx = mapRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#1f1f1f';
    ctx.fillRect(0, 0, screenSize.x, screenSize.y);
    (async () => {
      const requiredChunkCountOfX =
        Math.ceil(screenSize.x / (ImageChunkSize * scale)) + 2;
      const requiredChunkCountOfY =
        Math.ceil(screenSize.y / (ImageChunkSize * scale)) + 2;
      // chunk 起點 (多預載一圈)
      const chunkStartX = Math.floor(mapOffset.x / ImageChunkSize) - 1;
      const chunkStartY = Math.floor(mapOffset.y / ImageChunkSize) - 1;
      const requiredChunkGrid = Array.from(
        { length: requiredChunkCountOfX },
        (_, x) =>
          Array.from({ length: requiredChunkCountOfY }, (_, y) => ({
            key: `${chunkStartX + x}:${chunkStartY + y}`,
            x: chunkStartX + x,
            y: chunkStartY + y,
          })),
      );
      /*
      const requiredChunkGridFlatSet = new Set(
        requiredChunkGrid.flat().map((c) => c.key),
      );*/

      if (chunkSetter && chunkSetter.current)
        chunkSetter.current = new Set(
          requiredChunkGrid.flat().map((chunk) => chunk.key),
        );

      // prepare for cleanup but current disable
      // cachedMapData.forEach((_, key) => {
      //   if (!requiredChunkGridFlatSet.has(key)) {
      //     cachedMapData.delete(key);
      //   }
      // });

      const chunkData: [string, HTMLImageElement][] = await Promise.all(
        requiredChunkGrid.flat().map(async (chunk) => {
          if (cachedMapData?.has(chunk.key)) {
            return [chunk.key, cachedMapData.get(chunk.key)!];
          }
          cachedMapData.set(chunk.key, new Image());
          const chunkData = await fetch(`/api/map?x=${chunk.x}&y=${chunk.y}`);
          const chunkBlob = await chunkData.blob();
          const image = new Image();
          image.src = URL.createObjectURL(chunkBlob);
          await new Promise((resolve) => {
            image.onload = () => resolve(true);
          });
          setCachedMapData((prev) => {
            const newMap = new Map(prev);
            newMap.set(chunk.key, image);
            return newMap;
          });
          return [chunk.key, image];
        }),
      );

      ctx.clearRect(0, 0, screenSize.x, screenSize.y);
      await Promise.all(
        chunkData.map(async (chunk) => {
          if (!chunk) return;
          const [key, img] = chunk;
          const [x, y] = key.split(':').map(Number);
          ctx.drawImage(
            img,
            (x! * ImageChunkSize - mapOffset.x) * scale,
            (y! * ImageChunkSize - mapOffset.y) * scale,
            img.width * scale + 1,
            img.height * scale + 1,
          );
        }),
      );
    })();
  }, [
    mapOffset.x,
    mapOffset.y,
    scale,
    screenSize.x,
    screenSize.y,
    cachedMapData,
  ]);

  // Pixel Updater

  const previousPixelProvider = useRef(null as typeof pixelProvidor | null);

  useEffect(() => {
    if (!pixelProvidor) return;
    if (previousPixelProvider.current === pixelProvidor) return;
    if (
      Array.isArray(pixelProvidor) &&
      Array.isArray(previousPixelProvider.current) &&
      previousPixelProvider.current[0] === pixelProvidor[0]
    )
      return;
    previousPixelProvider.current = pixelProvidor;

    const updates = Array.isArray(pixelProvidor)
      ? pixelProvidor
      : [pixelProvidor];

    // group by pixels to minimize state updates
    const chunkGroups = new Map<
      string,
      { colorNumber: number; position: Position }[]
    >();
    for (const update of updates) {
      const pixelPos = update.position;
      const cX = Math.floor(pixelPos.x / ImageChunkSize);
      const cY = Math.floor(pixelPos.y / ImageChunkSize);
      const key = `${cX}:${cY}`;
      if (!chunkGroups.has(key)) chunkGroups.set(key, []);
      chunkGroups.get(key)!.push(update);
    }
    if (chunkGroups.size === 0) return;

    setCachedMapData((prev) => {
      if (chunkGroups.size === 0) return prev;
      const newMap = new Map(prev);
      for (const [key, pixels] of chunkGroups) {
        const baseImage = prev.get(key);
        if (!baseImage) continue;
        const canvas = document.createElement('canvas');
        canvas.width = ImageChunkSize;
        canvas.height = ImageChunkSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) continue;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
        for (const p of pixels) {
          const pos = p.position;
          const cX = Math.floor(pos.x / ImageChunkSize);
          const cY = Math.floor(pos.y / ImageChunkSize);
          ctx.fillStyle = `#${p.colorNumber.toString(16)}`;
          ctx.fillRect(
            pos.x - cX * ImageChunkSize,
            pos.y - cY * ImageChunkSize,
            1,
            1,
          );
        }
        const img = new Image();
        img.src = canvas.toDataURL();
        newMap.set(key, img);
      }
      return newMap;
    });
  }, [
    pixelProvidor,
    scale,
    mapOffset.x,
    mapOffset.y,
    screenSize.x,
    screenSize.y,
    cachedMapData,
  ]);

  // If blockInfo is available, show the popup with block details
  useEffect(() => {
    if (!blockInfo) return;
    setPopupContent(
      <div className='min-w-12 text-xs space-y-1'>
        <div>
          <span className='font-medium'>Position</span>: {blockInfo.x},{' '}
          {blockInfo.y}, {blockInfo.z}
        </div>
        <div>
          <span className='font-medium'>Block ID</span>: {blockInfo.blockId}
        </div>
        <div className='opacity-70 flex items-center space-x-2'>
          <img
            src={
              blockInfo.placerInfo.avatar.includes('https://')
                ? blockInfo.placerInfo.avatar
                : `data:image/png;base64,${blockInfo.placerInfo.avatar}`
            }
            alt={`Avatar of ${blockInfo.placerInfo.name}`}
            className='w-6 h-6 rounded-full'
          />
          <span>{blockInfo.placerInfo.name}</span>
        </div>
      </div>,
    );
  }, [blockInfo]);

  // Map Overlay Drawing
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    if (!showPath || showPath.length === 0) return;
    if (paintTool === PaintToolType.None) return;

    ctx.imageSmoothingEnabled = false;

    if (
      showPath.length > 1 &&
      [PaintToolType.Rectangle, PaintToolType.FilledRectangle].includes(
        paintTool,
      )
    ) {
      const xs = showPath.map((p) => p.x);
      const ys = showPath.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const screenX = (minX - mapOffset.x) * scale;
      const screenY = (minY - mapOffset.y) * scale;
      const width = (maxX - minX + 1) * scale;
      const height = (maxY - minY + 1) * scale;
      if (
        screenX + width < 0 ||
        screenY + height < 0 ||
        screenX > screenSize.x ||
        screenY > screenSize.y
      )
        return;

      if (paintTool === PaintToolType.FilledRectangle) {
        // Direct filled area – align exactly to block grid
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(
          Math.floor(screenX),
          Math.floor(screenY),
          Math.round(width),
          Math.round(height),
        );
      } else {
        // Draw rectangle border per block to avoid anti-alias offsets
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        // Top & Bottom edges
        for (let x = minX; x <= maxX; x++) {
          const topSX = (x - mapOffset.x) * scale;
          const bottomSX = topSX;
          const topSY = (minY - mapOffset.y) * scale;
          const bottomSY = (maxY - mapOffset.y) * scale;
          ctx.fillRect(Math.floor(topSX), Math.floor(topSY), scale, scale);
          if (maxY !== minY)
            ctx.fillRect(
              Math.floor(bottomSX),
              Math.floor(bottomSY),
              scale,
              scale,
            );
        }
        // Left & Right edges (excluding corners already drawn)
        for (let y = minY + 1; y < maxY; y++) {
          const leftSY = (y - mapOffset.y) * scale;
          const leftSX = (minX - mapOffset.x) * scale;
          ctx.fillRect(Math.floor(leftSX), Math.floor(leftSY), scale, scale);
          if (maxX !== minX) {
            const rightSX = (maxX - mapOffset.x) * scale;
            ctx.fillRect(Math.floor(rightSX), Math.floor(leftSY), scale, scale);
          }
        }
      }
      return;
    }

    // General path (pen / line / circle / filled circle preview)
    // Draw pixels as filled rects (scale size), batching by visibility
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (const pos of showPath) {
      const screenX = (pos.x - mapOffset.x) * scale;
      const screenY = (pos.y - mapOffset.y) * scale;
      if (
        screenX < -scale ||
        screenY < -scale ||
        screenX > screenSize.x ||
        screenY > screenSize.y
      )
        continue;
      ctx.fillRect(Math.floor(screenX), Math.floor(screenY), scale, scale);
    }
  }, [
    showPath,
    paintTool,
    mapOffset.x,
    mapOffset.y,
    scale,
    screenSize.x,
    screenSize.y,
  ]);

  useEffect(() => {
    setMapOffset({
      x: savedMapOffset.x,
      y: savedMapOffset.y,
    });
    setScale(savedScale);
  }, []);

  return (
    <div
      className={`relative w-full h-dvh flex-grow ${
        className || ''
      } touch-none`}
      ref={componentRef}
    >
      <canvas
        ref={mapRef}
        className='absolute inset-0 w-full h-full active:cursor-grabbing'
        width={screenSize.x}
        height={screenSize.y}
      ></canvas>
      <canvas
        ref={overlayRef}
        className='absolute inset-0 w-full h-full pointer-events-none'
        width={screenSize.x}
        height={screenSize.y}
      ></canvas>
      {(() => {
        const worldPixel = lockedWorldPixel
          ? lockedWorldPixel
          : {
              x: Math.floor(mapOffset.x + cursorPosition.x / scale),
              y: Math.floor(mapOffset.y + cursorPosition.y / scale),
            };
        const left = (worldPixel.x - mapOffset.x) * scale;
        const top = (worldPixel.y - mapOffset.y) * scale;
        return (
          <div
            className='bg-black opacity-50 absolute'
            id='map-select-pixel'
            style={{
              left: `${left}px`,
              top: `${top}px`,
              width: `${scale}px`,
              height: `${scale}px`,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          ></div>
        );
      })()}
      <Popup
        isOpen={isOpenPopup}
        content={popupContent}
        position={popupPosition}
        onClose={() => {
          setIsOpenPopup(false);
          setLockedWorldPixel(null);
          if (onPixelUnselect) onPixelUnselect();
        }}
      />
      <div className=' absolute top-1/6 bg-black/50 text-white p-4 max-md:hidden z-10 *:transition-all *:duration-100 flex-col flex gap-2'>
        <p>Exports:</p>
        <span className='text-sm flex flex-col relative'>
          <span> Combine {mixGridSize.current?.value!} Block to one</span>
          <span className=' items-center flex justify-center gap-1'>
            <input
              className=' flex-grow'
              ref={mixGridSize}
              type='range'
              step={1}
              min={1}
              defaultValue={1}
              max={8}
            />
          </span>
        </span>
        <button
          className=' bg-white/40 hover:bg-white/80 hover:text-black px-3 py-1 rounded mr-2'
          onClick={async (e) => {
            e.stopPropagation();
            e.preventDefault();

            // read mix grid size from the range input (fallback to 1)
            const mix = parseInt(mixGridSize.current?.value ?? '1', 10) || 1;

            // create a source canvas that has 1 pixel per map-block for the selected area
            const srcCanvas = document.createElement('canvas');

            if (paintTool === PaintToolType.None) {
              // use the whole map canvas
              const base = mapRef.current! as HTMLCanvasElement;
              srcCanvas.width = base.width;
              srcCanvas.height = base.height;
              const sctx = srcCanvas.getContext('2d')!;
              sctx.imageSmoothingEnabled = false;
              sctx.drawImage(base, 0, 0);
            } else {
              // crop to showPath bounds and draw scaled down so each map pixel = 1 canvas px
              const { minX, minY, maxX, maxY } = showPath.reduce(
                (acc, pos) => ({
                  minX: Math.min(acc.minX, pos.x),
                  minY: Math.min(acc.minY, pos.y),
                  maxX: Math.max(acc.maxX, pos.x),
                  maxY: Math.max(acc.maxY, pos.y),
                }),
                {
                  minX: Infinity,
                  minY: Infinity,
                  maxX: -Infinity,
                  maxY: -Infinity,
                },
              );

              srcCanvas.width = maxX - minX + 1;
              srcCanvas.height = maxY - minY + 1;
              const sctx = srcCanvas.getContext('2d')!;
              sctx.imageSmoothingEnabled = false;
              sctx.drawImage(
                mapRef.current!,
                (minX - mapOffset.x) * scale,
                (minY - mapOffset.y) * scale,
                (maxX - minX + 1) * scale,
                (maxY - minY + 1) * scale,
                0,
                0,
                srcCanvas.width,
                srcCanvas.height,
              );
            }

            // If mix === 1, just download the srcCanvas directly
            let outCanvas: HTMLCanvasElement = srcCanvas;
            if (mix > 1) {
              const inCtx = srcCanvas.getContext('2d')!;
              const imageWidth = srcCanvas.width;
              const imageHeight = srcCanvas.height;
              const imageData = inCtx.getImageData(
                0,
                0,
                imageWidth,
                imageHeight,
              );

              const newImageWidth = Math.floor(imageWidth / mix);
              const newImageHeight = Math.floor(imageHeight / mix);
              const newImageData = new ImageData(newImageWidth, newImageHeight);

              for (let newY = 0; newY < newImageHeight; newY++) {
                for (let newX = 0; newX < newImageWidth; newX++) {
                  const colorCounter = new Map<number, number>();
                  for (let dy = 0; dy < mix; dy++) {
                    for (let dx = 0; dx < mix; dx++) {
                      const oldX = newX * mix + dx;
                      const oldY = newY * mix + dy;

                      if (oldX < imageWidth && oldY < imageHeight) {
                        const pixelIndex = (oldY * imageWidth + oldX) * 4;
                        const r = imageData.data[pixelIndex]!;
                        const g = imageData.data[pixelIndex + 1]!;
                        const b = imageData.data[pixelIndex + 2]!;
                        // avoid bit-shift sign issues, use arithmetic
                        const colorNumber = r * 65536 + g * 256 + b;

                        colorCounter.set(
                          colorNumber,
                          (colorCounter.get(colorNumber) || 0) + 1,
                        );
                      }
                    }
                  }

                  // pick the most frequent color (or black if none)
                  let mostAppearColorNumber = 0;
                  if (colorCounter.size > 0) {
                    mostAppearColorNumber = Array.from(
                      colorCounter.entries(),
                    ).sort((a, b) => b[1] - a[1])[0]![0];
                  }

                  const newPixelIndex = (newY * newImageWidth + newX) * 4;
                  newImageData.data[newPixelIndex] =
                    Math.floor(mostAppearColorNumber / 65536) & 0xff; // R
                  newImageData.data[newPixelIndex + 1] =
                    Math.floor(mostAppearColorNumber / 256) & 0xff; // G
                  newImageData.data[newPixelIndex + 2] =
                    mostAppearColorNumber & 0xff; // B
                  newImageData.data[newPixelIndex + 3] = 255; // A
                }
              }

              outCanvas = document.createElement('canvas');
              outCanvas.width = newImageWidth;
              outCanvas.height = newImageHeight;
              const outCtx = outCanvas.getContext('2d')!;
              outCtx.putImageData(newImageData, 0, 0);
            }

            const link = document.createElement('a');
            link.href = outCanvas.toDataURL('image/png');
            link.download = 'map.png';
            link.click();
          }}
        >
          Img(.png)
        </button>
        <button
          className=' bg-white/40 hover:bg-white/80 hover:text-black px-3 py-1 rounded mr-2'
          onClick={() => {
            const link = document.createElement('a');

            const { minX, minY, maxX, maxY } = showPath.reduce(
              (acc, pos) => ({
                minX: Math.min(acc.minX, pos.x),
                minY: Math.min(acc.minY, pos.y),
                maxX: Math.max(acc.maxX, pos.x),
                maxY: Math.max(acc.maxY, pos.y),
              }),
              {
                minX: Infinity,
                minY: Infinity,
                maxX: -Infinity,
                maxY: -Infinity,
              },
            );

            const width =
              paintTool === PaintToolType.None
                ? screenSize.x / scale
                : maxX - minX + 1;
            const height =
              paintTool === PaintToolType.None
                ? screenSize.y / scale
                : maxY - minY + 1;
            link.href = `/api/nbt?x=${mapOffset.x}&y=${
              mapOffset.y
            }&w=${Math.floor(width)}&h=${Math.floor(height)}`;
            link.click();
          }}
        >
          Nbt
        </button>
      </div>
    </div>
  );
}
