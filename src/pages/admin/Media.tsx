import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { FoundifMediaUsage } from '@/components/admin/FoundifMediaUsage';
import { listCloudinaryImages, migrateToCloudinary, CloudinaryImage } from '@/lib/cloudinary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  ImageIcon, 
  RefreshCw, 
  Download, 
  Copy, 
  Search, 
  FolderOpen,
  Upload,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const FOLDERS = [
  { value: '', label: 'All Images' },
  { value: 'products', label: 'Products' },
  { value: 'variations', label: 'Variations' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'attributes', label: 'Attributes' },
  { value: 'megamenu', label: 'Megamenu' },
];

export default function AdminMedia() {
  const [selectedFolder, setSelectedFolder] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<CloudinaryImage | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['cloudinary-images', selectedFolder],
    queryFn: () => listCloudinaryImages(selectedFolder),
    staleTime: 2 * 60 * 1000,
  });

  const migrateMutation = useMutation({
    mutationFn: migrateToCloudinary,
    onSuccess: (result) => {
      toast({
        title: 'Migration Complete',
        description: `Migrated ${result.summary.total_migrated} images. ${result.summary.total_errors} errors.`,
      });
      queryClient.invalidateQueries({ queryKey: ['cloudinary-images'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Migration Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: 'Copied!', description: 'Image URL copied to clipboard' });
  };

  const filteredImages = data?.resources.filter(img => 
    searchQuery === '' || 
    img.public_id.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-semibold mb-1">Media Library</h1>
            <p className="text-muted-foreground">Manage all your uploaded images</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="btn-premium">
                  <Upload className="w-4 h-4 mr-2" />
                  Migrate Images
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Migrate Images to Cloudinary</DialogTitle>
                  <DialogDescription>
                    This will scan all database tables and migrate any images not yet on Cloudinary.
                    This includes products, carousels, variations, and menu items.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  {migrateMutation.isPending ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <span className="ml-3">Migrating images...</span>
                    </div>
                  ) : migrateMutation.isSuccess ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Migration Complete!</span>
                      </div>
                      {migrateMutation.data.results.map((r, i) => (
                        <div key={i} className="text-sm p-2 bg-secondary/50 rounded">
                          <span className="font-medium">{r.table}</span>: {r.migrated} migrated
                          {r.errors.length > 0 && (
                            <span className="text-destructive ml-2">({r.errors.length} errors)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Button 
                      onClick={() => migrateMutation.mutate()} 
                      className="w-full btn-premium"
                    >
                      Start Migration
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Usage Stats */}
        <FoundifMediaUsage />

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search images..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger className="w-full sm:w-48">
                  <FolderOpen className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="All Folders" />
                </SelectTrigger>
                <SelectContent>
                  {FOLDERS.map(folder => (
                    <SelectItem key={folder.value} value={folder.value}>
                      {folder.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Image Grid */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Images
              </span>
              {data && (
                <Badge variant="secondary">{filteredImages.length} images</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-12 text-destructive">
                <XCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Failed to load images</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
                  Try Again
                </Button>
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : filteredImages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No images found</p>
                {selectedFolder && (
                  <p className="text-sm mt-1">Try selecting a different folder</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredImages.map((image) => (
                  <div
                    key={image.public_id}
                    className="group relative aspect-square rounded-lg overflow-hidden border border-border bg-secondary/30 cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setSelectedImage(image)}
                  >
                    <img
                      src={image.secure_url}
                      alt={image.public_id}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-white text-xs truncate">{image.public_id.split('/').pop()}</p>
                        <p className="text-white/70 text-[10px]">{formatBytes(image.bytes)}</p>
                      </div>
                    </div>
                    {image.folder && (
                      <Badge className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5" variant="secondary">
                        {image.folder}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Image Detail Modal */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-2xl">
            {selectedImage && (
              <>
                <DialogHeader>
                  <DialogTitle className="truncate pr-8">
                    {selectedImage.public_id.split('/').pop()}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="rounded-lg overflow-hidden border border-border bg-secondary/30">
                    <img
                      src={selectedImage.secure_url}
                      alt={selectedImage.public_id}
                      className="w-full max-h-[400px] object-contain"
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div className="p-2 bg-secondary/50 rounded">
                      <p className="text-muted-foreground text-xs">Size</p>
                      <p className="font-medium">{formatBytes(selectedImage.bytes)}</p>
                    </div>
                    <div className="p-2 bg-secondary/50 rounded">
                      <p className="text-muted-foreground text-xs">Dimensions</p>
                      <p className="font-medium">{selectedImage.width} × {selectedImage.height}</p>
                    </div>
                    <div className="p-2 bg-secondary/50 rounded">
                      <p className="text-muted-foreground text-xs">Format</p>
                      <p className="font-medium uppercase">{selectedImage.format}</p>
                    </div>
                    <div className="p-2 bg-secondary/50 rounded">
                      <p className="text-muted-foreground text-xs">Folder</p>
                      <p className="font-medium">{selectedImage.folder || 'Root'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => copyToClipboard(selectedImage.secure_url)}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy URL
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      asChild
                    >
                      <a href={selectedImage.secure_url} download target="_blank" rel="noopener">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
