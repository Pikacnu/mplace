import { useLocalStorage } from '../hook/useLocalStorage';
import { useEffect, useState, useCallback } from 'react';

export default function Info() {
  const [isOpen, setIsOpen] = useState(false);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  const [isFirstTime, setIsFirstTime] = useLocalStorage('isFirstTime', true);

  return (
    <>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setIsFirstTime(false);
        }}
        className={`absolute top-2 right-2 bg-white text-black px-2 z-20 border-2 border-cyan-500 hover:bg-white/70 transition-all duration-75 rounded-sm ${
          isFirstTime ? ' animate-spin w-12 h-12 text-2xl' : ''
        }`}
      >
        i
      </button>
      {isOpen && (
        <div
          className='absolute w-full h-full top-0 left-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'
          onClick={close}
        >
          <div
            className='relative border-2 border-cyan-500 bg-white text-black rounded max-w-md w-full shadow-xl text-sm leading-relaxed max-h-1/2 flex'
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={close}
              aria-label='close'
              className='absolute -top-3 -right-3 bg-cyan-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs shadow hover:bg-cyan-500'
            >
              ×
            </button>
            <div className='flex flex-grow overflow-y-auto flex-col p-5'>
              <h2 className='text-lg font-semibold mb-2'>About / Help</h2>
              <p className='mb-2'>
                This is a lightweight collaborative map / pixel art canvas
                powered by real Minecraft block textures. Draw with blocks,
                preview instantly, and (soon) export your creation.
              </p>
              <p className='font-semibold mt-3 mb-1'>Basic Workflow</p>
              <ol className='list-decimal pl-5 space-y-1 mb-3'>
                <li>
                  Press the <span className='font-mono'>Space</span> key to
                  enter selection mode.
                </li>
                <li>
                  Click / drag to choose start & end points (depending on tool).
                </li>
                <li>
                  Release <span className='font-mono'>Space</span> to apply the
                  shape or placement.
                </li>
              </ol>
              <div className='border border-cyan-300/40 rounded p-3 mb-3 bg-cyan-50 text-xs text-gray-700'>
                <p className='font-semibold mb-1'>Quick Steps (After Login)</p>
                <p className='mb-2'>
                  Two common flows depending on whether a drawing tool is
                  selected:
                </p>
                <p className='font-medium'>No Drawing Tool Selected:</p>
                <ol className='list-decimal pl-5 space-y-1 mb-2'>
                  <li>
                    Click any pixel on the canvas (block info popup can be
                    ignored).
                  </li>
                  <li>
                    Select the block you want to use in the side / popup panel.
                  </li>
                  <li>
                    Click the Paint button (it will hint if a prior step is
                    missing).
                  </li>
                </ol>
                <p className='font-medium'>
                  With a Drawing Tool (Pen / Line / Rectangle / etc.):
                </p>
                <ol className='list-decimal pl-5 space-y-1 mb-2'>
                  <li>
                    Hold <span className='font-mono'>Space</span> to enter
                    selection / drawing mode (keep it held).
                  </li>
                  <li>
                    Pen: hold left mouse and drag. Other tools: click the first
                    and second point.
                  </li>
                  <li>
                    Release <span className='font-mono'>Space</span> to apply.
                  </li>
                </ol>
                <p className='text-[10px] text-gray-500'>
                  If something is missing, the UI will block or show a
                  contextual hint.
                </p>
              </div>
              <p className='font-semibold mt-2 mb-1'>Tools</p>
              <ul className='list-disc pl-5 space-y-1 mb-3'>
                <li>
                  <strong>None</strong>: Block Info view / single Block
                  selection.
                </li>
                <li>
                  <strong>Pen</strong>: Multiple block placement following
                  cursor path. (Need To hold Left Click to Draw)
                </li>
                <li>
                  <strong>Line</strong>: Straight line between first and second
                  point.
                </li>
                <li>
                  <strong>Rectangle</strong>: Hollow rectangle (axis-aligned)
                  from two diagonal points.
                </li>
                <li>
                  <strong>Filled Rectangle</strong>: Solid filled rectangle
                  variant.
                </li>
                <li>
                  <strong>Circle</strong>: Hollow circle (midpoint / Bresenham
                  style approximation).
                </li>
                <li>
                  <strong>Filled Circle</strong>: Solid circle fill.
                </li>
                <li>
                  <strong>Bucket</strong>: (Planned) Flood fill contiguous
                  region with selected block.
                </li>
              </ul>
              <p className='font-semibold mt-2 mb-1'>Controls</p>
              <ul className='list-disc pl-5 space-y-1 mb-3'>
                <li>
                  <strong>Left Click</strong>: Place or confirm selection.
                </li>
                <li>
                  <strong>Esc</strong>: Close this panel (also click overlay or
                  press the i button again).
                </li>
              </ul>
              <p className='font-semibold mt-2 mb-1'>Exports</p>
              <ul className='list-disc pl-5 space-y-1 mb-3'>
                <li>
                  <strong>Image</strong>: Export the current select area as an
                  image.
                </li>
                <li>
                  <strong>Nbt</strong>: Export the current select area as an NBT
                  file.
                </li>
              </ul>
              <div className='border border-cyan-300/40 rounded p-3 mb-3 bg-cyan-50 text-xs text-gray-700'>
                <p className='font-semibold mb-1'>Select Guide</p>
                <p className='mb-2'>
                  Two common flows depending on whether a drawing tool is
                  selected:
                </p>
                <p className='font-medium'>No Drawing Tool Selected:</p>
                <ol className='list-decimal pl-5 space-y-1 mb-2'>
                  <li>Exports whole screen as an image.</li>
                </ol>
                <p className='font-medium'>
                  With a Drawing Tool (Line / Rectangle / etc.):
                </p>
                <ol className='list-decimal pl-5 space-y-1 mb-2'>
                  <li>
                    Hold <span className='font-mono'>Space</span> to enter
                    selection / drawing mode (keep it held).
                  </li>
                  <li>
                    Release <span className='font-mono'>Space</span> to apply.
                  </li>
                </ol>
                <p className='text-[10px] text-gray-500'>
                  The selection area will always be the rectangle defined by the
                  diagonal corners you select.
                </p>
              </div>
              <p className='font-semibold mt-2 mb-1'>Coming Soon</p>
              <ul className='list-disc pl-5 space-y-1 mb-3 text-xs text-gray-600'>
                <li>
                  <p className='line-through'>
                    Fill (Bucket) algorithm & performance tuning
                  </p>
                  <p>(Won't be implemented recently)</p>
                </li>
                <li>Oval Paint Tool</li>
              </ul>
              <p className='text-xs text-gray-500'>
                Feedback welcome — iterate fast, build fun.
              </p>
              <div className=' flex flex-row items-center gap-1 justify-between mt-1 text-xs [&>a]:text-cyan-600 [&>span]:text-gray-500 [&>a]:hover:underline'>
                <a href='https://github.com/pikacnu/mc-color-data/issues/new'>
                  Report an Issue
                </a>
                <a href='mailto:pika@mail.pikacnu.com'>Provide Feedback</a>
                <span>Discord : pikacnu</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
