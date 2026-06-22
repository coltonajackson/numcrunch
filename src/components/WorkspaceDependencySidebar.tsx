import { useMemo } from 'react';
import type { WorkspaceDocument } from '../types';
import { buildWorkspaceDependencyGraph } from '../lib/workspace';

interface WorkspaceDependencySidebarProps {
  workspace: WorkspaceDocument;
  selectedLineId?: string | null;
  onSelectLine?: (lineId: string) => void;
}

function labelForLineIndex(index: number): string {
  return `L${index + 1}`;
}

export function WorkspaceDependencySidebar({
  workspace,
  selectedLineId = null,
  onSelectLine,
}: WorkspaceDependencySidebarProps) {
  const graph = useMemo(
    () => buildWorkspaceDependencyGraph(workspace.lines, workspace.variables),
    [workspace.lines, workspace.variables],
  );

  const nodeById = useMemo(
    () => new Map(graph.nodes.map((node) => [node.lineId, node])),
    [graph.nodes],
  );

  return (
    <aside
      className="rounded-lg p-2 h-fit"
      style={{ backgroundColor: '#1C1C1E', border: '1px solid #2C2C2E' }}
      aria-label="Dependency graph sidebar"
    >
      <div className="mb-2">
        <p className="text-xs font-semibold" style={{ color: '#E5E5EA' }}>
          Dependency Graph
        </p>
        <p className="text-[11px]" style={{ color: '#8E8E93' }}>
          {graph.nodes.length} lines · {graph.edgeCount} links
        </p>
      </div>

      {graph.cycleLineIds.length > 0 ? (
        <p className="text-[11px] mb-2" style={{ color: '#FF9F0A' }}>
          Cycle detected in {graph.cycleLineIds.length} line(s). Recalculation uses iterative settling.
        </p>
      ) : (
        <p className="text-[11px] mb-2" style={{ color: '#30D158' }}>
          Graph is acyclic.
        </p>
      )}

      <div className="mb-2">
        <p className="text-[11px]" style={{ color: '#8E8E93' }}>
          Suggested eval order
        </p>
        <p
          className="text-[11px] truncate"
          style={{ color: '#D1D1D6', fontFamily: "'SF Mono', 'Fira Code', monospace" }}
          title={graph.evaluationOrderLineIds.map((lineId) => {
            const node = nodeById.get(lineId);
            return node ? labelForLineIndex(node.lineIndex) : lineId;
          }).join(' -> ')}
        >
          {graph.evaluationOrderLineIds.length > 0
            ? graph.evaluationOrderLineIds.map((lineId) => {
              const node = nodeById.get(lineId);
              return node ? labelForLineIndex(node.lineIndex) : lineId;
            }).join(' -> ')
            : 'n/a'}
        </p>
      </div>

      <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
        {graph.nodes.map((node) => {
          const isSelected = selectedLineId === node.lineId;
          return (
            <button
              key={node.lineId}
              type="button"
              onClick={() => onSelectLine?.(node.lineId)}
              className="rounded-lg p-2 w-full text-left"
              style={{
                backgroundColor: isSelected ? '#252533' : '#111',
                border: `1px solid ${isSelected ? '#64D2FF' : '#2C2C2E'}`,
                cursor: onSelectLine ? 'pointer' : 'default',
              }}
              aria-pressed={isSelected}
              aria-label={`Focus ${labelForLineIndex(node.lineIndex)}`}
              title={`Focus ${labelForLineIndex(node.lineIndex)} in workspace`}
            >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold" style={{ color: '#E5E5EA' }}>
                {labelForLineIndex(node.lineIndex)}
              </span>
              {node.outputVariable && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: '#2C2C2E', color: '#64D2FF', fontFamily: "'SF Mono', 'Fira Code', monospace" }}
                >
                  {node.outputVariable}
                </span>
              )}
            </div>
            <p
              className="text-[11px] truncate mt-1"
              style={{ color: '#D1D1D6', fontFamily: "'SF Mono', 'Fira Code', monospace" }}
              title={node.expression}
            >
              {node.expression || '—'}
            </p>

            <p className="text-[10px] mt-1" style={{ color: '#8E8E93' }}>
              upstream:{' '}
              <span style={{ color: '#AFAFB4' }}>
                {node.upstreamLineIds.length > 0
                  ? node.upstreamLineIds
                    .map((lineId) => nodeById.get(lineId))
                    .filter((linkedNode): linkedNode is NonNullable<typeof linkedNode> => Boolean(linkedNode))
                    .map((linkedNode) => labelForLineIndex(linkedNode.lineIndex))
                    .join(', ')
                  : 'none'}
              </span>
            </p>
            <p className="text-[10px]" style={{ color: '#8E8E93' }}>
              downstream:{' '}
              <span style={{ color: '#AFAFB4' }}>
                {node.downstreamLineIds.length > 0
                  ? node.downstreamLineIds
                    .map((lineId) => nodeById.get(lineId))
                    .filter((linkedNode): linkedNode is NonNullable<typeof linkedNode> => Boolean(linkedNode))
                    .map((linkedNode) => labelForLineIndex(linkedNode.lineIndex))
                    .join(', ')
                  : 'none'}
              </span>
            </p>

            {node.externalVariables.length > 0 && (
              <p className="text-[10px]" style={{ color: '#30D158' }}>
                external vars: {node.externalVariables.join(', ')}
              </p>
            )}
            {node.unresolvedVariables.length > 0 && (
              <p className="text-[10px]" style={{ color: '#FF453A' }}>
                unresolved: {node.unresolvedVariables.join(', ')}
              </p>
            )}
            {node.hasCycle && (
              <p className="text-[10px]" style={{ color: '#FF9F0A' }}>
                cycle member
              </p>
            )}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
