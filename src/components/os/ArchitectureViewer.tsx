import { useMemo } from 'react';
import { ReactFlow, Background, Controls, MiniMap, type Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { AppWindowProps } from '../../os/types';

const GRAPHS: Record<string, { nodes: Node[]; edges: Edge[] }> = {
  talkwithdb: {
    nodes: [
      { id: 'user', data: { label: 'User' }, position: { x: 0, y: 150 }, style: { background: '#3b82f6', color: '#fff', padding: 10, borderRadius: 8 } },
      { id: 'react', data: { label: 'React UI' }, position: { x: 200, y: 50 }, style: { background: '#61dafb', color: '#000', padding: 10, borderRadius: 8 } },
      { id: 'fastapi', data: { label: 'FastAPI' }, position: { x: 200, y: 150 }, style: { background: '#009688', color: '#fff', padding: 10, borderRadius: 8 } },
      { id: 'ollama', data: { label: 'Ollama LLM' }, position: { x: 400, y: 50 }, style: { background: '#8b5cf6', color: '#fff', padding: 10, borderRadius: 8 } },
      { id: 'postgres', data: { label: 'PostgreSQL' }, position: { x: 400, y: 200 }, style: { background: '#336791', color: '#fff', padding: 10, borderRadius: 8 } },
      { id: 'docker', data: { label: 'Docker' }, position: { x: 200, y: 280 }, style: { background: '#2496ed', color: '#fff', padding: 10, borderRadius: 8 } },
    ],
    edges: [
      { id: 'e1', source: 'user', target: 'react', animated: true },
      { id: 'e2', source: 'react', target: 'fastapi', animated: true },
      { id: 'e3', source: 'fastapi', target: 'ollama', animated: true, label: 'NL→SQL' },
      { id: 'e4', source: 'fastapi', target: 'postgres', animated: true },
      { id: 'e5', source: 'docker', target: 'fastapi' },
      { id: 'e6', source: 'docker', target: 'postgres' },
    ],
  },
  sanjivani: {
    nodes: [
      { id: 'mobile', data: { label: 'React Native' }, position: { x: 0, y: 100 }, style: { background: '#61dafb', color: '#000', padding: 10, borderRadius: 8 } },
      { id: 'esp32', data: { label: 'ESP32 IoT' }, position: { x: 200, y: 0 }, style: { background: '#e11d48', color: '#fff', padding: 10, borderRadius: 8 } },
      { id: 'fastapi', data: { label: 'FastAPI' }, position: { x: 200, y: 150 }, style: { background: '#009688', color: '#fff', padding: 10, borderRadius: 8 } },
      { id: 'ocr', data: { label: 'OCR Engine' }, position: { x: 400, y: 50 }, style: { background: '#f59e0b', color: '#000', padding: 10, borderRadius: 8 } },
      { id: 'rxnorm', data: { label: 'RxNorm API' }, position: { x: 400, y: 150 }, style: { background: '#22c55e', color: '#000', padding: 10, borderRadius: 8 } },
      { id: 'firebase', data: { label: 'Firebase' }, position: { x: 400, y: 250 }, style: { background: '#ffca28', color: '#000', padding: 10, borderRadius: 8 } },
    ],
    edges: [
      { id: 's1', source: 'mobile', target: 'fastapi', animated: true },
      { id: 's2', source: 'esp32', target: 'mobile', animated: true, label: 'vitals' },
      { id: 's3', source: 'mobile', target: 'ocr', animated: true },
      { id: 's4', source: 'fastapi', target: 'rxnorm', animated: true },
      { id: 's5', source: 'mobile', target: 'firebase' },
    ],
  },
};

export default function ArchitectureViewer({ payload }: AppWindowProps) {
  const projectId = (payload?.projectId as string) ?? 'talkwithdb';
  const graph = useMemo(() => GRAPHS[projectId] ?? GRAPHS.talkwithdb, [projectId]);

  return (
    <div className="h-full w-full">
      <div className="px-4 py-2 border-b border-white/10 text-gray-200 text-sm">
        Architecture — {projectId} · Hover nodes for component roles · Animated data flow
      </div>
      <div className="h-[calc(100%-2.5rem)]">
        <ReactFlow nodes={graph.nodes} edges={graph.edges} fitView>
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}
