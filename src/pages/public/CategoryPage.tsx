import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { CourseGrid } from '@/components/course/CourseCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';
import { useListCategoriesWithCountsQuery } from '@/features/categories/categoriesApi';
import { useListCoursesQuery } from '@/features/courses/coursesApi';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

/**
 * Category landing page. The API exposes categories and courses as separate
 * resources, so the category is resolved client side from the counts feed and
 * then used as the course filter.
 */
export function CategoryPage() {
  const { slug = '' } = useParams();
  const { data: categories, isLoading: isLoadingCategories } = useListCategoriesWithCountsQuery();

  const category = categories?.find((item) => item.slug === slug);

  useDocumentTitle(category?.name);

  const { data, isLoading } = useListCoursesQuery(
    { category: category?.id, limit: 24, sort: 'popular' },
    { skip: !category },
  );

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [slug]);

  if (isLoadingCategories) {
    return (
      <AppShell>
        <PageLoader />
      </AppShell>
    );
  }

  if (!category) {
    return (
      <AppShell>
        <EmptyState
          title="Category not found"
          description="This category does not exist or is no longer active."
          action={
            <Link to="/courses" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              Back to the catalog
            </Link>
          }
        />
      </AppShell>
    );
  }

  return (
    <AppShell variant="fullWidth">
      <PageHeader
        title={category.name}
        subtitle={category.description ?? `${category.courseCount} published courses`}
      />

      {category.courseCount === 0 ? (
        <EmptyState
          title="No courses in this category yet"
          description="Check back later, or browse the full catalog."
          action={
            <Link to="/courses" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              Browse all courses
            </Link>
          }
        />
      ) : null}

      {isLoading ? <p className="text-sm text-slate-500">Loading courses…</p> : null}

      {data && data.items.length > 0 ? <CourseGrid courses={data.items} /> : null}
    </AppShell>
  );
}
