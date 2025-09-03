import { useEffect, useRef, useState } from 'react';
import { Button } from './components/button';
import Map from './components/map';
import { type BlockInfo, type Position } from './type';
import { BlockList } from './components/blockList';
import AuthStatus from './components/authStatus';
import { useWebsocket } from './hook/useWebsocket';
import { useBlockCount } from './hook/useBlockCount';
import useAuth from './hook/useAuth';
import { PaintToolType, type BlockDetail } from './type';
import { PaintToolSelector } from './components/PaintToolSelector';
import { TaskPanel } from './components/taskpanel';
import Info from './components/info';

type UpdateColorInfo = {
  colorNumber: number;
  position: Position;
};

export function App() {
  const [selectedPixel, setSelectedPixel] = useState<Position | null>(null);
  const [buttonContent, setButtonContent] = useState<string>('Paint Pixel');
  const [selectedBlock, setSelectedBlock] = useState<BlockInfo | null>(null);
  const usingChunks = useRef<Set<string | null>>(new Set());
  const backupChunks = useRef<Set<string | null>>(new Set());
  const { session } = useAuth();
  const [currentUpdatePixel, setCurrentUpdatePixel] = useState<
    UpdateColorInfo | UpdateColorInfo[] | undefined
  >(undefined);
  const [cachingUpdatePixel, setCachingUpdatePixel] = useState<
    UpdateColorInfo | UpdateColorInfo[]
  >([]);

  const [blockCount, removeBlockCount] = useBlockCount();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [blockInfo, setBlockInfo] = useState<BlockDetail | null>(null);

  const [currentPaintTool, setCurrentPaintTool] = useState<PaintToolType>(
    PaintToolType.None,
  );

  const [selectedPixels, setSelectedPixels] = useState<Position[]>([]);

  useEffect(() => {
    if (backupChunks.current.size === 0) {
      backupChunks.current = new Set(usingChunks.current);
    }
    if (
      backupChunks.current.size !== usingChunks.current.size ||
      [...backupChunks.current].some((v) => !usingChunks.current.has(v))
    ) {
      sendMessage({
        type: 'update_chunk',
        payload: {
          chunks: Array.from(usingChunks.current),
        },
      });
      backupChunks.current = new Set(usingChunks.current);
    }
  }, [usingChunks.current]);

  const { sendMessage } = useWebsocket({
    onMessage: (message) => {
      switch (message.type) {
        case 'get_chunk': {
          sendMessage({
            type: 'update_chunk',
            payload: {
              chunks: Array.from(usingChunks.current),
            },
          });
          break;
        }
        case 'update_pixel': {
          setCurrentUpdatePixel([message.payload]);
          break;
        }
        case 'update_pixels': {
          setCachingUpdatePixel((prev) => [
            ...(Array.isArray(prev) ? prev : [prev]),
            ...message.payload,
          ]);
          break;
        }
        case 'error': {
          setErrorMessage(message.payload.message!);
          break;
        }
        case 'block_info': {
          setBlockInfo(message.payload.block);
          break;
        }
        case 'remove_blocks': {
          removeBlockCount(message.payload || 1);
        }
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    },
    onDisconnect: (event) => {
      console.log('WebSocket disconnected:', event);
    },
    onConnect: () => {
      console.log('WebSocket connected');
    },
  });

  useEffect(() => {
    if (cachingUpdatePixel) {
      const timeout = setTimeout(() => {
        setCurrentUpdatePixel(cachingUpdatePixel);
        setCachingUpdatePixel([]);
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [cachingUpdatePixel]);

  return (
    <div className='w-full h-screen flex flex-col touch-none overflow-hidden'>
      <AuthStatus className='fixed top-0' />
      <Info />
      <div className='absolute top-4 left-0 w-full flex items-center justify-center'>
        {errorMessage && (
          <>
            <div className='bg-red-500 text-white p-4 rounded flex flex-row justify-center z-20 gap-2 transition-all'>
              <p>{errorMessage}</p>
              <button
                onClick={() => setErrorMessage(null)}
                className='top-0 right-0 text-black hover:bg-white/60 px-2 rounded-full'
              >
                x
              </button>
            </div>
          </>
        )}
      </div>
      <Map
        onPixelSelect={(position) => setSelectedPixel(position)}
        onPixelUnselect={() => setSelectedPixel(null)}
        pixelProvidor={currentUpdatePixel}
        chunkSetter={usingChunks}
        getBlockInfoFn={({ x, y }) => {
          setBlockInfo(null);
          sendMessage({
            type: 'get_block_info',
            payload: {
              position: { x, y },
            },
          });
        }}
        blockInfo={blockInfo}
        paintTool={currentPaintTool}
        setCurrentSelectedPixels={setSelectedPixels}
      />
      <Button
        onClick={() => {
          if (!session)
            return (window.location.href = '/api/auth/signin?provider=discord');
          if ((!selectedPixel && !selectedPixels) || !selectedBlock || !session)
            return;
          removeBlockCount(1);
          if (currentPaintTool === PaintToolType.None) {
            console.log('Painting pixel at', selectedPixel);
            sendMessage({
              type: 'paint',
              payload: {
                position: selectedPixel,
                block: selectedBlock,
              },
            });
            return;
          }
          sendMessage({
            type: 'paint_by_tool',
            payload: {
              pixels: selectedPixels,
              block: selectedBlock,
              type: currentPaintTool,
            },
          });
        }}
        onMouseEnter={() => {
          if (!session) return setButtonContent('Login First');
          if (!selectedBlock) return setButtonContent('Select a Block');
          if (!selectedPixel && !selectedPixels)
            return setButtonContent('Select a Pixel');
          if (blockCount <= 1) return setButtonContent('Not enough blocks');
          setButtonContent(`Click to Paint (${blockCount})`);
        }}
        onMouseLeave={() => setButtonContent('Paint Pixel')}
        className=' fixed self-center bottom-3/12 rounded-2xl'
      >
        {buttonContent}
      </Button>
      <BlockList
        className='fixed self-center bottom-0 flex flex-row flex-wrap w-full h-2/12 bg-black/50 *:min-w-8'
        onClickBlock={(blockInfo) => {
          setSelectedBlock(blockInfo);
        }}
      />
      <PaintToolSelector
        className='absolute bottom-2/12 bg-black/50 text-white p-4 max-md:hidden'
        setPaintTool={setCurrentPaintTool}
      />
      <TaskPanel
        className=' absolute right-0 bottom-2/12'
        offsetInfo={selectedPixel}
      />
    </div>
  );
}

export default App;
