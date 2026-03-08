import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCloudinaryUsage, listCloudinaryImages } from '@/lib/cloudinary';
import { Card, CardContent } from '@/components/ui/card';
import { HardDrive, Wifi, Zap, RefreshCw, Cloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const FREE_PLAN_LIMITS = {
  storage: 25 * 1024 * 1024 * 1024,       // 25 GB
  bandwidth: 25 * 1024 * 1024 * 1024,      // 25 GB
  transformations: 25000,
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return new Intl.NumberFormat().format(num);
  return num.toString();
}

export function FoundifMediaUsage() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['foundif-media-usage'],
    queryFn: getCloudinaryUsage,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (error) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="p-4">
          <p className="text-sm text-destructive">Failed to load media usage</p>
        </CardContent>
      </Card>
    );
  }

  const storageLimit = data?.storage_limit_bytes && data.storage_limit_bytes > 0 ? data.storage_limit_bytes : FREE_PLAN_LIMITS.storage;
  const bandwidthLimit = data?.bandwidth_limit_bytes && data.bandwidth_limit_bytes > 0 ? data.bandwidth_limit_bytes : FREE_PLAN_LIMITS.bandwidth;
  const transformationsLimit = data?.transformations_limit && data.transformations_limit > 0 ? data.transformations_limit : FREE_PLAN_LIMITS.transformations;

  const metrics = data
    ? [
        {
          label: 'Storage',
          used: data.storage_used_bytes,
          limit: storageLimit,
          format: formatBytes,
          icon: HardDrive,
          iconClass: 'text-primary',
        },
        {
          label: 'Bandwidth',
          used: data.bandwidth_used_bytes,
          limit: bandwidthLimit,
          format: formatBytes,
          icon: Wifi,
          iconClass: 'text-muted-foreground',
        },
        {
          label: 'Transformations',
          used: data.transformations_used,
          limit: transformationsLimit,
          format: formatNumber,
          icon: Zap,
          iconClass: 'text-muted-foreground',
        },
      ]
    : [];

  return (
    <Card className="bg-card">
      <CardContent className="p-5 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-48" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-1.5 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Cloud className="w-4 h-4 text-muted-foreground" />
                Foundif Media ({data?.plan || 'Free'}) • {data?.resources || 0} files
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className="space-y-3">
              {metrics.map((metric) => {
                const Icon = metric.icon;
                const percentage = metric.limit > 0 ? (metric.used / metric.limit) * 100 : 0;
                return (
                  <div key={metric.label} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Icon className={`w-4 h-4 ${metric.iconClass}`} />
                        {metric.label}
                      </div>
                      <span className="text-sm text-foreground font-medium">
                        {metric.format(metric.used)} / {metric.format(metric.limit)}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary/60 transition-all"
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
