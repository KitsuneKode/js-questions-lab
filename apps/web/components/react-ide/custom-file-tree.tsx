'use client';

import { useSandpack } from '@codesandbox/sandpack-react';
import {
  IconBrandCss3,
  IconBrandHtml5,
  IconBrandJavascript,
  IconBrandReact,
  IconBrandTypescript,
  IconFile,
  IconFileCode,
  IconFolder,
  IconFolderOpen,
} from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

function getFileIcon(filename: string) {
  if (filename.endsWith('.tsx') || filename.endsWith('.jsx'))
    return <IconBrandReact className="h-4 w-4 text-sky-400" />;
  if (filename.endsWith('.ts')) return <IconBrandTypescript className="h-4 w-4 text-blue-500" />;
  if (filename.endsWith('.js') || filename.endsWith('.mjs') || filename.endsWith('.cjs'))
    return <IconBrandJavascript className="h-4 w-4 text-yellow-400" />;
  if (filename.endsWith('.css')) return <IconBrandCss3 className="h-4 w-4 text-blue-400" />;
  if (filename.endsWith('.html')) return <IconBrandHtml5 className="h-4 w-4 text-orange-500" />;
  if (filename.endsWith('.json')) return <IconFileCode className="h-4 w-4 text-green-400" />;
  return <IconFile className="h-4 w-4 text-muted-foreground" />;
}

type FileNode = { type: 'file'; path: string; name: string };
type FolderNode = {
  type: 'folder';
  path: string;
  name: string;
  children: Record<string, TreeNode>;
};
type TreeNode = FileNode | FolderNode;

export function CustomFileTree() {
  const { sandpack } = useSandpack();
  const { files, activeFile } = sandpack;
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ '/': true });

  const filePathsKey = useMemo(() => Object.keys(files).sort().join(','), [files]);

  const tree = useMemo(() => {
    const root: Record<string, TreeNode> = {};
    if (!filePathsKey) return root;

    filePathsKey.split(',').forEach((path) => {
      // Hide generated or node_modules files from the user tree
      if (
        path.includes('/node_modules/') ||
        path.startsWith('/public/') ||
        path === '/package.json'
      )
        return;

      const parts = path.split('/').filter(Boolean);
      let currentLevel = root;
      let currentPath = '';

      parts.forEach((part, index) => {
        currentPath += `/${part}`;
        const isFile = index === parts.length - 1;

        if (isFile) {
          currentLevel[part] = { type: 'file', path: currentPath, name: part };
        } else {
          if (!currentLevel[part]) {
            currentLevel[part] = { type: 'folder', path: currentPath, name: part, children: {} };
          }
          currentLevel = (currentLevel[part] as FolderNode).children;
        }
      });
    });

    return root;
  }, [filePathsKey]);

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const renderNode = (node: TreeNode, depth: number) => {
    if (node.type === 'file') {
      const isActive = activeFile === node.path;
      return (
        <button
          key={node.path}
          type="button"
          onClick={() => sandpack.setActiveFile(node.path)}
          style={{ paddingLeft: `${depth * 12 + 12}px` }}
          className={cn(
            'group flex w-full items-center gap-2 py-1.5 pr-3 text-[13px] transition-[color,background-color,border-color,transform] duration-150 ease-out active:scale-[0.96]',
            isActive
              ? 'bg-primary/10 font-medium text-primary border-r-2 border-primary'
              : 'text-muted-foreground hover:bg-surface/50 hover:text-foreground border-r-2 border-transparent',
          )}
        >
          <div className="shrink-0 transition-transform duration-200 ease-out group-hover:scale-110">
            {getFileIcon(node.name)}
          </div>
          <span className="truncate tracking-wide">{node.name}</span>
        </button>
      );
    }

    if (node.type === 'folder') {
      const isExpanded = expandedFolders[node.path] !== false; // expand by default
      return (
        <div key={node.path}>
          <button
            type="button"
            onClick={() => toggleFolder(node.path)}
            style={{ paddingLeft: `${depth * 12 + 12}px` }}
            className="flex w-full items-center gap-2 py-1.5 pr-3 text-[13px] text-foreground/80 transition-[color,background-color] duration-150 ease-out hover:bg-surface/50"
          >
            {isExpanded ? (
              <IconFolderOpen className="h-4 w-4 text-primary/70" />
            ) : (
              <IconFolder className="h-4 w-4 text-primary/70" />
            )}
            <span className="truncate font-medium tracking-wide">{node.name}</span>
          </button>
          {isExpanded && (
            <div className="flex flex-col">
              {Object.values(node.children)
                .sort((a, b) => {
                  if (a.type === b.type) return a.name.localeCompare(b.name);
                  return a.type === 'folder' ? -1 : 1;
                })
                .map((child) => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto py-2 scrollbar-thin">
      {Object.values(tree)
        .sort((a, b) => {
          if (a.type === b.type) return a.name.localeCompare(b.name);
          return a.type === 'folder' ? -1 : 1;
        })
        .map((node) => renderNode(node, 0))}
    </div>
  );
}
