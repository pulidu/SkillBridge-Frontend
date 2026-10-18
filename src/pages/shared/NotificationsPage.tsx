import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Alert, FieldErrorList } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonRows } from '@/components/ui/Skeleton';
import {
  useDeleteNotificationMutation,
  useListNotificationsQuery,
  useMarkAllAsReadMutation,
  useMarkAsReadMutation,
} from '@/features/notifications/notificationsApi';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { apiErrors, errorMessage, formatDateTime } from '@/lib/formatters';
import type { NotificationType } from '@/types';

const TONE_BY_TYPE: Record<NotificationType, 'brand' | 'success' | 'warning' | 'info' | 'neutral'> = {
  enrollment: 'brand',
  course_update: 'info',
  grade: 'success',
  announcement: 'warning',
  system: 'neutral',
};

export function NotificationsPage() {
  useDocumentTitle('Notifications');

  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const { data, isLoading, isError, refetch } = useListNotificationsQuery({
    page,
    limit: 20,
    unread: unreadOnly ? true : undefined,
  });

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();
  const [removeNotification] = useDeleteNotificationMutation();

  const run = async (action: () => Promise<unknown>) => {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Notifications"
        subtitle="Enrolments, course updates, grades and announcements."
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUnreadOnly((previous) => !previous)}
            >
              {unreadOnly ? 'Show all' : 'Unread only'}
            </Button>
            <Button
              size="sm"
              onClick={() => void run(() => markAllAsRead().unwrap())}
            >
              Mark all read
            </Button>
          </div>
        }
      />

      {error ? (
        <Alert tone="error" className="mb-4">
          {errorMessage(error)}
          <FieldErrorList errors={apiErrors(error)} className="mt-2" />
        </Alert>
      ) : null}

      {isError ? (
        <EmptyState
          title="Could not load notifications"
          description={errorMessage(error)}
          action={<Button onClick={() => void refetch()}>Try again</Button>}
        />
      ) : null}

      {isLoading ? <SkeletonRows rows={5} columns={3} /> : null}

      {data && data.items.length === 0 ? (
        <EmptyState
          title={unreadOnly ? 'No unread notifications' : 'No notifications yet'}
          description="Activity on your courses will appear here."
        />
      ) : null}

      {data && data.items.length > 0 ? (
        <>
          <ul className="space-y-2">
            {data.items.map((notification) => (
              <li key={notification.id}>
                <Card>
                  <CardBody className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={TONE_BY_TYPE[notification.type]}>{notification.type.replace('_', ' ')}</Badge>
                        {!notification.isRead ? (
                          <span className="h-2 w-2 rounded-full bg-brand-600" aria-label="Unread" />
                        ) : null}
                        <span className="text-xs text-slate-400">
                          {formatDateTime(notification.createdAt)}
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-semibold text-slate-900">{notification.title}</p>
                      {notification.message ? (
                        <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
                      ) : null}

                      {notification.link ? (
                        <Link
                          to={notification.link}
                          className="mt-2 inline-block text-xs font-medium text-brand-600 hover:text-brand-700"
                        >
                          Open
                        </Link>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-col gap-2">
                      {!notification.isRead ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void run(() => markAsRead(notification.id).unwrap())}
                        >
                          Mark read
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void run(() => removeNotification(notification.id).unwrap())}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>

          <Pagination meta={data.meta} onPageChange={setPage} />
        </>
      ) : null}
    </AppShell>
  );
}
