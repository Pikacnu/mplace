import {
  useEffect,
  useState,
  useOptimistic,
  useRef,
  startTransition,
  useCallback,
} from 'react';
import { type Position } from '@/type';
import { isProcessImageWithResize } from '@/config';

type Task = {
  taskId: number;
  botCounts: number;
};

export function TaskPanel({
  className,
  offsetInfo,
}: {
  className?: string;
  offsetInfo: Position | null;
}) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isTaskFunctionOpen, setIsTaskFunctionOpen] = useState(true);
  const mixGridSize = useRef<HTMLInputElement>(null);
  const [tasksData, setTasksData] = useOptimistic<
    Task[],
    {
      Task: Task;
      remove?: boolean;
    }
  >(tasks, (state, { Task: newTask, remove = false }) => {
    const existingTask = state.find((task) => task.taskId === newTask.taskId);
    if (existingTask) {
      return state.map((task) =>
        task.taskId === newTask.taskId ? { ...task, ...newTask } : task,
      );
    }
    if (remove) {
      return state.filter((task) => task.taskId !== newTask.taskId);
    }
    return [...state, newTask];
  });
  const [isOpenNewTaskTab, setIsOpenNewTaskTab] = useState(false);
  useEffect(() => {
    if (!tasks) {
      (async () => {
        const taskRes = await fetch('/api/task');
        if (taskRes.status === 403) {
          return setIsTaskFunctionOpen(false);
        }
        if (taskRes.status === 200) {
          const tasks = await taskRes.json();
          setTasks(tasks);
        }
      })();
    }
    const reloadTimeout = setTimeout(() => {
      (async () => {
        const taskRes = await fetch('/api/task');
        if (taskRes.status === 200) {
          const tasks = await taskRes.json();
          setTasks(tasks);
        }
      })();
    }, 5000);
    return () => {
      clearTimeout(reloadTimeout);
    };
  }, [tasks]);
  const fileUploadRef = useRef<HTMLInputElement>(null);

  const changeBotCount = useCallback((task: Task, count: number) => {
    startTransition(async () => {
      setTasksData({
        Task: {
          taskId: task.taskId,
          botCounts: count,
        },
      });
      const result = await fetch(`/api/bot`, {
        method: 'POST',
        body: JSON.stringify({
          taskId: task.taskId,
          botCount: count,
        }),
      });
      if (result.ok) {
        try {
          const newTask = (await result.json()) as {
            taskId: number;
            botCounts: number;
          };
          setTasks((prev) =>
            prev.map((t) =>
              t.taskId === newTask.taskId
                ? { ...t, botCounts: newTask.botCounts }
                : t,
            ),
          );
        } catch (error) {
          console.error('Error updating task:', error);
        }
      }
    });
  }, []);

  const updateBotCount = useCallback(() => {
    let lastUpdate = Date.now();
    return (task: Task, count: number) => {
      let now = Date.now();
      if (now - lastUpdate < 1500) return;
      changeBotCount(task, count);
    };
  }, []);

  const throttledUpdateBotCount = useCallback(updateBotCount(), []);
  if (!isTaskFunctionOpen) return <></>;
  return (
    <div
      className={`flex flex-col bg-black/50 text-white text-sm p-2 z-20 ${className}`}
    >
      <h2>Task Panel</h2>
      {tasksData.length === 0 ? (
        <div>No tasks found.</div>
      ) : (
        tasksData.map((task) => (
          <div
            className=' border-b border-white/20 last:border-0 flex flex-col'
            key={task.taskId}
          >
            <div className='flex flex-row justify-between items-center'>
              <p className='max-w-8 overflow-ellipsis bg-black/20 px-1 rounded'>
                {task.taskId}
              </p>
              <button
                className='bg-red-600 hover:bg-red-700 px-2 py-1 rounded'
                onClick={() => {
                  startTransition(async () => {
                    setTasksData({
                      Task: task,
                      remove: true,
                    });
                    const result = await fetch(`/api/task`, {
                      method: 'DELETE',
                      body: JSON.stringify({
                        taskId: task.taskId,
                      }),
                    });
                    if (result.ok) {
                      setTasks((prev) =>
                        prev.filter((t) => t.taskId !== task.taskId),
                      );
                    }
                  });
                }}
              >
                Delete
              </button>
            </div>
            <div className='flex flex-col'>
              <p>Bot Count:</p>
              <div className='flex flex-row *:bg-gray-300/40 *:hover:bg-gray-300/60 gap-1 justify-between'>
                <input
                  type='number'
                  value={task.botCounts}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value)) {
                      throttledUpdateBotCount(task, value);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        ))
      )}
      {isOpenNewTaskTab ? (
        <div className='flex flex-col items-center border-t-2 border-white/20 mt-2 pt-2'>
          <input
            type='file'
            className='hidden'
            ref={fileUploadRef}
            accept='.nbt, .png, .jpg, .jpeg'
          />
          {(fileUploadRef.current?.files?.length ?? 0) === 0 ? (
            <button
              className=' bg-violet-600/60 hover:bg-violet-700/70 px-2 py-1 rounded mt-2'
              onClick={() => fileUploadRef.current?.click()}
            >
              Upload Source File
            </button>
          ) : (
            <p className='text-sm text-white inline-flex'>
              File Name :{' '}
              <span
                className='inline-block max-w-[8rem] truncate cursor-pointer underline'
                title={fileUploadRef.current?.files?.[0]?.name}
                onClick={() => fileUploadRef.current?.click()}
              >
                {fileUploadRef.current?.files?.[0]?.name}
              </span>
            </p>
          )}
          <p className='gap-2 flex justify-between'>
            Offset <span>X: {offsetInfo?.x ?? 0}</span>
            <span>Y: {offsetInfo?.y ?? 0}</span>
          </p>
          {isProcessImageWithResize &&
            fileUploadRef.current?.files?.[0] &&
            fileUploadRef.current?.files?.[0]?.name
              .split('.')
              .pop()
              ?.toLowerCase() !== 'nbt' && (
              <span className='text-sm flex flex-col relative justify-center'>
                <span>Resize Image Ratio</span>
                <span className=' items-center flex justify-center gap-1'>
                  <input
                    className=' flex-grow'
                    ref={mixGridSize}
                    type='range'
                    step={1}
                    min={1}
                    max={4}
                    defaultValue={1}
                  />
                  <span>{mixGridSize.current?.value!}</span>
                </span>
              </span>
            )}
          <div className='flex flex-row gap-1 justify-between w-full'>
            <button
              className=' bg-green-700/60 hover:bg-green-700/70 px-2 py-1 rounded mt-2'
              onClick={() => {
                if (!fileUploadRef.current?.files?.[0]) return;
                const formData = new FormData();
                formData.append('file', fileUploadRef.current?.files?.[0]);
                formData.append(
                  'offset',
                  JSON.stringify({
                    x: offsetInfo?.x ?? 0,
                    y: offsetInfo?.y ?? 0,
                  }),
                );
                formData.append('mixGridSize', mixGridSize.current?.value!);
                startTransition(async () => {
                  setTasksData({
                    Task: {
                      taskId:
                        Math.max(...tasksData.map((t) => t.taskId), 0) + 1,
                      botCounts: 0,
                    },
                    remove: false,
                  });
                  const result = await fetch('/api/task', {
                    method: 'POST',
                    body: formData,
                  });
                  if (result.ok) {
                    startTransition(async () => {
                      try {
                        const newTask = (await result.json()) as {
                          taskId: number;
                        };
                        setTasks((prev) => [
                          ...prev,
                          {
                            taskId: newTask.taskId,
                            botCounts: 0,
                          },
                        ]);
                      } catch (e) {
                        console.error(e);
                      }
                    });
                  }
                });
                setIsOpenNewTaskTab(false);
                fileUploadRef.current!.files = null;
              }}
            >
              Add
            </button>
            <button
              className=' bg-red-700/60 hover:bg-red-700/70 px-2 py-1 rounded mt-2'
              onClick={() => {
                setIsOpenNewTaskTab(false);
                fileUploadRef.current!.files = null;
              }}
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <button
          className=' bg-green-700/60 hover:bg-green-700/70 px-2 py-1 rounded mt-2'
          onClick={() => setIsOpenNewTaskTab(true)}
        >
          Add
        </button>
      )}
    </div>
  );
}
