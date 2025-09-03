import { useEffect, useRef, useState } from 'react';

export function useBlockCount() {
  const [blockCount, setBlockCount] = useState(0);
  const linkCounter = useRef(0);

  useEffect(() => {
    const fetchBlockCount = async () => {
      const response = await fetch('/api/block_count');
      if (response.status !== 200) return;
      const data = await response.json();
      setBlockCount(data.blockCount || 0);
    };

    if (linkCounter.current === 0) {
      fetchBlockCount();
      linkCounter.current = 10;
    }

    let lastTime = new Date().getTime();

    const interval = setInterval(() => {
      if (new Date().getTime() - lastTime >= 10_000) {
        setBlockCount((prevCount) => Math.max(prevCount + 1, 0));
        linkCounter.current--;
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  function removeBlock(count: number) {
    setBlockCount((prevCount) => prevCount - count);
  }

  return [blockCount, removeBlock] as [number, (count: number) => void];
}
