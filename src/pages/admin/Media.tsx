import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { FoundifMediaUsage } from '@/components/admin/FoundifMediaUsage';
import { listCloudinaryImages, migrateToCloudinary, deleteCloudinaryImages, CloudinaryImage } from '@/lib/cloudinary';
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
  XCircle,
  Trash2,
  CheckSquare,
  Square,
  X,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const FOLDERS = [
  { value: 'all', label: 'All Images' },
  { value: 'products', label: 'Products' },
  { value: 'variations', label: 'Variations' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'attributes', label: 'Attributes' },
  { value: 'megamenu', label: 'Megamenu' },
];

export default function AdminMedia() {
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<CloudinaryImage | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [singleDeleteTarget, setSingleDeleteTarget] = useState<CloudinaryImage | null>(null);
  const [migrationProgress, setMigrationProgress] = useState<number | null>(null);
  const [allImages, setAllImages] = useState<CloudinaryImage[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const folderParam = selectedFolder === 'all' ? '' : selectedFolder;

  // Initial load
  const { isLoading, error, isFetching, refetch } = useQuery({
    queryKey: ['cloudinary-images', selectedFolder],
    queryFn: async () => {
      const result = await listCloudinaryImages(folderParam);
      setAllImages(result.resources);
      setNextCursor(result.next_cursor);
      setTotalCount(result.total_count);
      return result;
    },
    staleTime: 2 * 60 * 1000,
  });

  // Reset when folder changes
  useEffect(() => {
    setAllImages([]);
    setNextCursor(null);
    setTotalCount(0);
  }, [selectedFolder]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const result = await listCloudinaryImages(folderParam, nextCursor);
      setAllImages(prev => [...prev, ...result.resources]);
      setNextCursor(result.next_cursor);
      setTotalCount(result.total_count);
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to load more images', variant: 'destructive' });
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextCursor, isLoadingMore, folderParam, toast]);

  const loadAll = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    let cursor: string | null = nextCursor;
    let accumulated: CloudinaryImage[] = [];
    try {
      while (cursor) {
        const result = await listCloudinaryImages(folderParam, cursor);
        accumulated = [...accumulated, ...result.resources];
        cursor = result.next_cursor;
        setTotalCount(result.total_count);
        // Small delay to avoid rate limiting
        if (cursor) await new Promise(r => setTimeout(r, 300));
      }
      setAllImages(prev => [...prev, ...accumulated]);
      setNextCursor(null);
    } catch (e) {
      // Save what we got so far
      if (accumulated.length > 0) {
        setAllImages(prev => [...prev, ...accumulated]);
      }
      toast({ title: 'Error', description: 'Failed to load all images', variant: 'destructive' });
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextCursor, isLoadingMore, folderParam, toast]);

  const migrateMutation = useMutation({
    mutationFn: async () => {
      setMigrationProgress(5);
      const interval = setInterval(() => {
        setMigrationProgress(prev => {
          if (prev === null) return 5;
          if (prev >= 90) return prev;
          return prev + Math.random() * 8;
        });
      }, 1500);
      
      try {
        const result = await migrateToCloudinary();
        clearInterval(interval);
        setMigrationProgress(100);
        return result;
      } catch (e) {
        clearInterval(interval);
        setMigrationProgress(null);
        throw e;
      }
    },
    onSuccess: (result) => {
      toast({
        title: 'Migration Complete',
        description: `Migrated ${result.summary.total_migrated}, skipped ${result.summary.total_skipped} (already on Cloudinary). ${result.summary.total_errors} errors. ${result.summary.deduplicated_uploads} deduped.`,
      });
      queryClient.invalidateQueries({ queryKey: ['cloudinary-images'] });
      queryClient.invalidateQueries({ queryKey: ['foundif-media-usage'] });
      setTimeout(() => setMigrationProgress(null), 2000);
    },
    onError: (error: Error) => {
      toast({
        title: 'Migration Failed',
        description: error.message,
        variant: 'destructive',
      });
      setMigrationProgress(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (publicIds: string[]) => deleteCloudinaryImages(publicIds),
    onSuccess: (result) => {
      toast({
        title: 'Delete Complete',
        description: `Deleted ${result.summary.total_deleted} image(s). ${result.summary.total_failed} failed.`,
      });
      setSelectedIds(new Set());
      setSelectMode(false);
      setSingleDeleteTarget(null);
      setDeleteConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ['cloudinary-images'] });
      queryClient.invalidateQueries({ queryKey: ['foundif-media-usage'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: 'Copied!', description: 'Image URL copied to clipboard' });
  };

  const filteredImages = allImages.filter(img => 
    searchQuery === '' || 
    img.public_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelect = (publicId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(publicId)) next.delete(publicId);
      else next.add(publicId);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredImages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredImages.map(i => i.public_id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setDeleteConfirmOpen(true);
  };

  const handleSingleDelete = (image: CloudinaryImage) => {
    setSingleDeleteTarget(image);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (singleDeleteTarget) {
      deleteMutation.mutate([singleDeleteTarget.public_id]);
    } else {
      deleteMutation.mutate(Array.from(selectedIds));
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmOpen(false);
    setSingleDeleteTarget(null);
  };

  const deleteCount = singleDeleteTarget ? 1 : selectedIds.size;

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
                    Scans all database tables and migrates images not yet on Cloudinary. Duplicates are automatically skipped.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  {migrateMutation.isPending ? (
                    <div className="space-y-4 py-4">
                      <div className="flex items-center justify-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span className="font-medium">Migrating images...</span>
                      </div>
                      {migrationProgress !== null && (
                        <div className="space-y-2">
                          <Progress value={migrationProgress} className="h-3" />
                          <p className="text-center text-sm text-muted-foreground">
                            {Math.round(migrationProgress)}% complete
                          </p>
                        </div>
                      )}
                    </div>
                  ) : migrateMutation.isSuccess ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-primary">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Migration Complete!</span>
                      </div>
                      {migrationProgress !== null && (
                        <Progress value={100} className="h-3" />
                      )}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 bg-secondary/50 rounded text-center">
                          <p className="text-muted-foreground text-xs">Migrated</p>
                          <p className="font-bold text-lg">{migrateMutation.data.summary.total_migrated}</p>
                        </div>
                        <div className="p-2 bg-secondary/50 rounded text-center">
                          <p className="text-muted-foreground text-xs">Skipped</p>
                          <p className="font-bold text-lg">{migrateMutation.data.summary.total_skipped}</p>
                        </div>
                        <div className="p-2 bg-secondary/50 rounded text-center">
                          <p className="text-muted-foreground text-xs">Deduped</p>
                          <p className="font-bold text-lg">{migrateMutation.data.summary.deduplicated_uploads}</p>
                        </div>
                        <div className="p-2 bg-secondary/50 rounded text-center">
                          <p className="text-muted-foreground text-xs">Errors</p>
                          <p className="font-bold text-lg text-destructive">{migrateMutation.data.summary.total_errors}</p>
                        </div>
                      </div>
                      {migrateMutation.data.results.map((r, i) => (
                        <div key={i} className="text-sm p-2 bg-secondary/30 rounded flex justify-between">
                          <span className="font-medium">{r.table}</span>
                          <span className="text-muted-foreground">
                            {r.migrated} migrated, {r.skipped} skipped
                            {r.errors.length > 0 && (
                              <span className="text-destructive ml-1">({r.errors.length} errors)</span>
                            )}
                          </span>
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

        {/* Filters + Actions Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
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

              {/* Select / Delete actions */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant={selectMode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setSelectMode(!selectMode);
                    setSelectedIds(new Set());
                  }}
                >
                  {selectMode ? <X className="w-4 h-4 mr-1" /> : <CheckSquare className="w-4 h-4 mr-1" />}
                  {selectMode ? 'Cancel' : 'Select'}
                </Button>
                
                {selectMode && (
                  <>
                    <Button variant="outline" size="sm" onClick={selectAll}>
                      {selectedIds.size === filteredImages.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    {selectedIds.size > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDelete}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete {selectedIds.size} image{selectedIds.size > 1 ? 's' : ''}
                      </Button>
                    )}
                  </>
                )}
              </div>
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
              {allImages.length > 0 && (
                <Badge variant="secondary">
                  {filteredImages.length}{totalCount > allImages.length ? ` of ${totalCount}` : ''} images
                </Badge>
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
                {selectedFolder !== 'all' && (
                  <p className="text-sm mt-1">Try selecting a different folder</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredImages.map((image) => {
                  const isSelected = selectedIds.has(image.public_id);
                  return (
                    <div
                      key={image.public_id}
                      className={`group relative aspect-square rounded-lg overflow-hidden border-2 bg-secondary/30 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => {
                        if (selectMode) {
                          toggleSelect(image.public_id);
                        } else {
                          setSelectedImage(image);
                        }
                      }}
                    >
                      <img
                        src={image.secure_url}
                        alt={image.public_id}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      
                      {/* Checkbox overlay in select mode */}
                      {selectMode && (
                        <div className="absolute top-2 left-2 z-10">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'bg-background/80 border-muted-foreground/50'
                          }`}>
                            {isSelected && <CheckCircle className="w-3 h-3" />}
                          </div>
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-2 left-2 right-2">
                          <p className="text-white text-xs truncate">{image.public_id.split('/').pop()}</p>
                          <p className="text-white/70 text-[10px]">{formatBytes(image.bytes)}</p>
                        </div>
                        {/* Single delete button on hover */}
                        {!selectMode && (
                          <button
                            className="absolute top-2 right-2 p-1.5 rounded-md bg-destructive/90 text-destructive-foreground hover:bg-destructive transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSingleDelete(image);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      {image.folder && (
                        <Badge className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5" variant="secondary">
                          {image.folder}
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Image Detail Modal */}
        <Dialog open={!!selectedImage && !selectMode} onOpenChange={() => setSelectedImage(null)}>
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
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setSelectedImage(null);
                        handleSingleDelete(selectedImage);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={cancelDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Confirm Delete
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  Are you sure you want to permanently delete{' '}
                  <span className="font-bold text-foreground">{deleteCount} image{deleteCount > 1 ? 's' : ''}</span>?
                </p>
                <p className="text-destructive font-medium">
                  This action cannot be undone. Images will be permanently removed from Cloudinary.
                </p>
                {singleDeleteTarget && (
                  <div className="mt-3 p-3 bg-secondary/30 rounded-lg flex items-center gap-3">
                    <img
                      src={singleDeleteTarget.secure_url}
                      alt={singleDeleteTarget.public_id}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="text-sm">
                      <p className="font-medium truncate max-w-[250px]">{singleDeleteTarget.public_id.split('/').pop()}</p>
                      <p className="text-muted-foreground">{formatBytes(singleDeleteTarget.bytes)}</p>
                    </div>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Permanently
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}
