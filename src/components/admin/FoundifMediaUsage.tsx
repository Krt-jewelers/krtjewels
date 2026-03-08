import { useQuery } from '@tanstack/react-query';
import { getCloudinaryUsage } from '@/lib/cloudinary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { HardDrive, Wifi, ImageIcon, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
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
          <p className="text-sm text-destructive">Failed to load Foundif Media usage</p>
        </CardContent>
      </Card>
    );
  }

  const metrics = data ? [
    {
      label: 'Storage',
      used: data.storage_used_bytes,
      limit: data.storage_limit_bytes,
      format: formatBytes,
      icon: HardDrive,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      progressColor: 'bg-blue-500',
    },
    {
      label: 'Bandwidth',
      used: data.bandwidth_used_bytes,
      limit: data.bandwidth_limit_bytes,
      format: formatBytes,
      icon: Wifi,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      progressColor: 'bg-emerald-500',
    },
    {
      label: 'Transformations',
      used: data.transformations_used,
      limit: data.transformations_limit,
      format: formatNumber,
      icon: Sparkles,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      progressColor: 'bg-purple-500',
    },
  ] : [];

  return (
    <Card className="border-2 border-primary/10 bg-gradient-to-br from-background to-secondary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ImageIcon className="w-5 h-5 text-primary" />
            Foundif Media
          </CardTitle>
          <div className="flex items-center gap-2">
            {data && (
              <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground font-medium capitalize">
                {data.plan} • {formatNumber(data.resources)} files
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              const percentage = metric.limit > 0 ? (metric.used / metric.limit) * 100 : 0;
              return (
                <div key={metric.label} className="space-y-2 p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${metric.bgColor}`}>
                      <Icon className={`w-3.5 h-3.5 ${metric.color}`} />
                    </div>
                    <span className="text-sm font-medium">{metric.label}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${metric.progressColor}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{metric.format(metric.used)}</span>
                      <span>{metric.limit > 0 ? metric.format(metric.limit) : '∞'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
