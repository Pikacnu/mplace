import { useEffect, useState } from 'react';
import { type BlockInfo } from '../type';

export function BlockList({
  className = '',
  onClickBlock,
  selectedBlockSetter,
}: {
  className?: string;
  onClickBlock: (blockInfo: BlockInfo) => void;
  selectedBlockSetter?: (blockInfo: BlockInfo | null) => void;
}) {
  const [blockIdList, setBlockIdList] = useState<string[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<BlockInfo | null>(null);
  useEffect(() => {
    const fetchBlockList = async () => {
      const res = await fetch('/api/block_list');
      const blockListData = await res.json();
      setBlockIdList(blockListData);
    };
    fetchBlockList();
  }, []);
  return (
    <div
      className={`gap-2 p-2 overflow-y-auto z-20 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {blockIdList.map((blockId) => (
        <img
          key={blockId}
          src={`/public/block/${blockId}`}
          alt={blockId}
          onClick={() => {
            const blockInfo: BlockInfo = {
              blockId: blockId,
            };
            onClickBlock(blockInfo);
            setSelectedBlock(blockInfo);
            if (selectedBlockSetter) selectedBlockSetter(blockInfo);
          }}
          className={`object-cover hover:outline-cyan-600/80 hover:bg-cyan-600/50 hover:outline-2 ${
            selectedBlock?.blockId === blockId
              ? 'outline-cyan-600/80 bg-cyan-600/90 outline-4'
              : ''
          }`}
        />
      ))}
    </div>
  );
}
