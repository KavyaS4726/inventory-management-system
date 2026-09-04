/**
 * Generic helper to apply search, filtering, sorting, and pagination
 * to an in-memory array — used across every module's getAll* function,
 * since your services already fetch full collections from Firestore
 * (same pattern as dashboard.service.ts).
 */

export interface ListQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  [key: string]: any; // allows arbitrary filter fields, e.g. categoryId, role
}

export interface ListQueryConfig {
  searchableFields?: string[]; // fields checked for substring match on `search`
  filterableFields?: string[]; // fields allowed as exact-match filters
  defaultSortBy?: string;
  defaultSortOrder?: "asc" | "desc";
  defaultLimit?: number;
  maxLimit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function applyListQuery<T extends Record<string, any>>(
  items: T[],
  query: ListQuery,
  config: ListQueryConfig = {}
): PaginatedResult<T> {
  const {
    searchableFields = [],
    filterableFields = [],
    defaultSortBy = "createdAt",
    defaultSortOrder = "asc",
    defaultLimit = 10,
    maxLimit = 100,
  } = config;

  let result = [...items];

  // 1. Exact-match filters (e.g. ?categoryId=abc, ?role=staff)
  for (const field of filterableFields) {
    const value = query[field];
    if (value !== undefined && value !== "") {
      result = result.filter((item) => String(item[field]) === String(value));
    }
  }

  // 2. Search — case-insensitive substring match across searchableFields
  if (query.search && searchableFields.length > 0) {
    const term = query.search.toLowerCase();
    result = result.filter((item) =>
      searchableFields.some((field) => String(item[field] ?? "").toLowerCase().includes(term))
    );
  }

  // 3. Sort
  const sortBy = query.sortBy || defaultSortBy;
  const sortOrder = (query.sortOrder || defaultSortOrder) === "desc" ? -1 : 1;
  result.sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;
    if (aVal < bVal) return -1 * sortOrder;
    if (aVal > bVal) return 1 * sortOrder;
    return 0;
  });

  // 4. Pagination
  const total = result.length;
  let limit = parseInt(query.limit as string, 10) || defaultLimit;
  limit = Math.min(limit, maxLimit);
  const page = Math.max(parseInt(query.page as string, 10) || 1, 1);
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const start = (page - 1) * limit;
  const paginated = result.slice(start, start + limit);

  return {
    data: paginated,
    pagination: { page, limit, total, totalPages },
  };
}