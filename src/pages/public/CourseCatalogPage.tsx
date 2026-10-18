import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { CourseGrid } from '@/components/course/CourseCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input, Select } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonCards } from '@/components/ui/Skeleton';
import { useListCoursesQuery } from '@/features/courses/coursesApi';
import { useListCategoriesQuery } from '@/features/categories/categoriesApi';
import { useDebounce } from '@/hooks/useDebounce';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { errorMessage } from '@/lib/formatters';
import type { CourseLevel, CourseSort } from '@/types';

const LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'title', label: 'Title A-Z' },
  { value: 'rating', label: 'Highest rated' },
  { value: 'popular', label: 'Most popular' },
  { value: 'duration', label: 'Shortest first' },
];

export function CourseCatalogPage() {
  useDocumentTitle('Course catalog');

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState<CourseLevel | ''>('');
  const [sort, setSort] = useState<CourseSort>('newest');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(search);
  const { data: categories } = useListCategoriesQuery();

  const { data, isLoading, isFetching, isError, error, refetch } = useListCoursesQuery({
    page,
    limit: 12,
    search: debouncedSearch || undefined,
    category: category || undefined,
    level: level || undefined,
    sort,
  });

  // Any filter change resets pagination, otherwise a stale page number can
  // return an empty result set.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, level, sort]);

  return (
    <AppShell variant="fullWidth">
      <PageHeader
        title="Course catalog"
        subtitle="Browse every published course on the platform."
      />

      <div className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Search"
          type="search"
          placeholder="Search by title or description"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <Select
          label="Category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          placeholder="All categories"
          options={(categories ?? []).map((item) => ({ value: item.id, label: item.name }))}
        />

        <Select
          label="Level"
          value={level}
          onChange={(event) => setLevel(event.target.value as CourseLevel | '')}
          placeholder="Any level"
          options={LEVEL_OPTIONS}
        />

        <Select
          label="Sort by"
          value={sort}
          onChange={(event) => setSort(event.target.value as CourseSort)}
          options={SORT_OPTIONS}
        />
      </div>

      {isLoading ? <SkeletonCards /> : null}

      {isError ? (
        <EmptyState
          title="Could not load courses"
          description={errorMessage(error)}
          action={<Button onClick={() => void refetch()}>Try again</Button>}
        />
      ) : null}

      {!isLoading && !isError && data && data.items.length === 0 ? (
        <EmptyState
          title="No courses match those filters"
          description="Try a different search term, category or level."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setCategory('');
                setLevel('');
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : null}

      {!isLoading && data && data.items.length > 0 ? (
        <div className={isFetching ? 'opacity-60 transition-opacity' : undefined}>
          <CourseGrid courses={data.items} />
          <Pagination meta={data.meta} onPageChange={setPage} />
        </div>
      ) : null}
    </AppShell>
  );
}
