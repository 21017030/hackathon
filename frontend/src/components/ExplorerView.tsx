'use client';

import FolderGrid from '@/components/FolderGrid';
import DocumentTable from '@/components/DocumentTable';
import type { Category, Document } from '@/types';

interface Props {
  categories: Category[];
  documents: Document[];
  selectedCategoryId: number | null;
  onCategorySelect: (id: number) => void;
  onStartChat: () => void;
  onCreateFolder: (name: string) => void;
  onUpload: (categoryId: number | null) => void;
  onDeleteFolder: (id: number) => void;
  onDeleteDocument: (id: number) => void;
  onViewDocument: (id: number, filename: string) => void;
}

/**
 * 보관함 탐색기 컴포넌트.
 * 폴더 그리드와 문서 테이블을 조합하여 파일 탐색기 형태로 보여줍니다.
 */
export default function ExplorerView({
  categories,
  documents,
  selectedCategoryId,
  onCategorySelect,
  onCreateFolder,
  onUpload,
  onDeleteFolder,
  onDeleteDocument,
  onViewDocument,
}: Props) {
  // 폴더가 선택된 경우 해당 폴더 문서만, 아니면 전체 문서를 표시
  const visibleDocs = selectedCategoryId === null
    ? documents
    : documents.filter(d => d.category_id === selectedCategoryId);

  return (
    <div className="max-w-6xl mx-auto">
      {selectedCategoryId === null && (
        <FolderGrid
          categories={categories}
          documents={documents}
          onCategorySelect={onCategorySelect}
          onCreateFolder={onCreateFolder}
          onUpload={onUpload as (id: number) => void}
          onDeleteFolder={onDeleteFolder}
        />
      )}
      <DocumentTable
        documents={visibleDocs}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onUpload={onUpload as (id: number) => void}
        onDeleteDocument={onDeleteDocument}
        onViewDocument={onViewDocument}
      />
    </div>
  );
}
