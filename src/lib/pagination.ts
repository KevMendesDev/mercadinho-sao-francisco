export type Page<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

const DEFAULT_SIZE = 20;
const MAX_SIZE = 500;

export function pagination(page?: number, size?: number) {
  const currentPage = Number.isFinite(page) ? Math.max(1, Math.floor(page as number)) : 1;
  const currentSize = Number.isFinite(size) ? Math.min(MAX_SIZE, Math.max(1, Math.floor(size as number))) : DEFAULT_SIZE;
  return { page: currentPage, size: currentSize, skip: (currentPage - 1) * currentSize };
}

export function pageForTotal(page: number, size: number, totalElements: number): number {
  return Math.min(page, Math.max(1, Math.ceil(totalElements / size)));
}

export function pageResult<T>(content: T[], totalElements: number, page: number, size: number): Page<T> {
  return { content, page, size, totalElements, totalPages: Math.max(1, Math.ceil(totalElements / size)) };
}
