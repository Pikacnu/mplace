import { PaintToolType } from '@/type';
import type { ReactNode } from 'react';

const PaintToolTypeToDisplay: Record<PaintToolType, ReactNode> = {
  [PaintToolType.None]: (
    <div className='w-2/3 h-2/3 border-2 border-dashed border-gray-400'></div>
  ),
  [PaintToolType.Pen]: (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='16'
      height='16'
      fill='currentColor'
      className='flex-grow w-2/3 h-2/3'
      viewBox='0 0 16 16'
    >
      <path d='M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325' />
    </svg>
  ),
  [PaintToolType.Line]: <div className=' w-4/5 h-1 rotate-45 bg-black'></div>,
  [PaintToolType.Rectangle]: (
    <div className='w-2/3 h-2/3 outline-4 outline-black'></div>
  ),
  [PaintToolType.Circle]: (
    <div className='w-2/3 h-2/3 rounded-full outline-4 outline-black'></div>
  ),
  [PaintToolType.FilledRectangle]: (
    <div className='m-2 w-2/3 h-2/3 bg-black'></div>
  ),
  [PaintToolType.FilledCircle]: (
    <div className='w-2/3 h-2/3 rounded-full bg-black'></div>
  ),
  [PaintToolType.Bucket]: (
    <div className='flex flex-col m-2 h-8/12 flex-grow '>
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='16'
        height='16'
        fill='currentColor'
        className='flex-grow w-full h-full'
        viewBox='0 0 16 16'
      >
        <path d='M6.192 2.78c-.458-.677-.927-1.248-1.35-1.643a3 3 0 0 0-.71-.515c-.217-.104-.56-.205-.882-.02-.367.213-.427.63-.43.896-.003.304.064.664.173 1.044.196.687.556 1.528 1.035 2.402L.752 8.22c-.277.277-.269.656-.218.918.055.283.187.593.36.903.348.627.92 1.361 1.626 2.068.707.707 1.441 1.278 2.068 1.626.31.173.62.305.903.36.262.05.64.059.918-.218l5.615-5.615c.118.257.092.512.05.939-.03.292-.068.665-.073 1.176v.123h.003a1 1 0 0 0 1.993 0H14v-.057a1 1 0 0 0-.004-.117c-.055-1.25-.7-2.738-1.86-3.494a4 4 0 0 0-.211-.434c-.349-.626-.92-1.36-1.627-2.067S8.857 3.052 8.23 2.704c-.31-.172-.62-.304-.903-.36-.262-.05-.64-.058-.918.219zM4.16 1.867c.381.356.844.922 1.311 1.632l-.704.705c-.382-.727-.66-1.402-.813-1.938a3.3 3.3 0 0 1-.131-.673q.137.09.337.274m.394 3.965c.54.852 1.107 1.567 1.607 2.033a.5.5 0 1 0 .682-.732c-.453-.422-1.017-1.136-1.564-2.027l1.088-1.088q.081.181.183.365c.349.627.92 1.361 1.627 2.068.706.707 1.44 1.278 2.068 1.626q.183.103.365.183l-4.861 4.862-.068-.01c-.137-.027-.342-.104-.608-.252-.524-.292-1.186-.8-1.846-1.46s-1.168-1.32-1.46-1.846c-.147-.265-.225-.47-.251-.607l-.01-.068zm2.87-1.935a2.4 2.4 0 0 1-.241-.561c.135.033.324.11.562.241.524.292 1.186.8 1.846 1.46.45.45.83.901 1.118 1.31a3.5 3.5 0 0 0-1.066.091 11 11 0 0 1-.76-.694c-.66-.66-1.167-1.322-1.458-1.847z' />
      </svg>
    </div>
  ),
};

export function PaintToolSelector({
  className,
  setPaintTool,
}: {
  className?: string;
  setPaintTool?: (tool: PaintToolType) => void;
}) {
  return (
    <div className={`${className} items-center`}>
      <h2>Tools</h2>
      <ul className=' gap-2 flex flex-col'>
        {Object.values(PaintToolType)
          .slice(0, 7)
          .map((tool) => {
            if (!PaintToolTypeToDisplay[tool]) return;
            return (
              <li
                key={tool}
                className=' border-2 border-gray-400 bg-gray-200 text-black w-12 h-12 flex items-center justify-center hover:cursor-pointer hover:bg-gray-400 transition-colors duration-100 active:bg-amber-300'
                onClick={() => setPaintTool?.(tool)}
              >
                {PaintToolTypeToDisplay[tool]}
              </li>
            );
          })}
      </ul>
    </div>
  );
}
