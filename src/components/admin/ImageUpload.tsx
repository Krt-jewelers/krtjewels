import { useState, useRef, useCallback } from 'react';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export function ImageUpload({ images, onImagesChange, maxImages = 20 }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (files.length > remainingSlots) {
      toast({
        title: 'Too many files',
        description: `You can only upload ${remainingSlots} more image(s)`,
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          toast({ title: 'Invalid file type', description: `${file.name} is not an image`, variant: 'destructive' });
          continue;
        }
        const url = await uploadToCloudinary(file, 'products');
        uploadedUrls.push(url);
        setUploadProgress(((i + 1) / files.length) * 100);
      }

      if (uploadedUrls.length > 0) {
        onImagesChange([...images, ...uploadedUrls]);
        toast({ title: 'Upload successful', description: `${uploadedUrls.length} image(s) uploaded` });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Upload failed', description: error.message || 'Failed to upload images', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    // Make the drag image slightly transparent
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setDraggingIndex(null);
    setDragOverIndex(null);
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(fromIndex) || fromIndex === toIndex) {
      setDragOverIndex(null);
      setDraggingIndex(null);
      return;
    }
    const newImages = [...images];
    const [removed] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, removed);
    onImagesChange(newImages);
    setDragOverIndex(null);
    setDraggingIndex(null);
  }, [images, onImagesChange]);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
          isUploading ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-secondary/30'
        )}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        {isUploading ? (
          <div className="space-y-3">
            <Loader2 className="w-10 h-10 mx-auto text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Uploading... {Math.round(uploadProgress)}%</p>
            <div className="w-full max-w-xs mx-auto bg-secondary rounded-full h-2">
              <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-full bg-secondary mx-auto flex items-center justify-center">
              <Upload className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">Click to upload images</p>
            <p className="text-xs text-muted-foreground">PNG, JPG, WEBP • Auto-compressed • Max {maxImages} images</p>
          </div>
        )}
      </div>

      {/* Image Grid - Drag & Drop */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((url, index) => (
            <div
              key={`${url}-${index}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={() => setDragOverIndex(null)}
              onDrop={(e) => handleDrop(e, index)}
              className={cn(
                'relative group aspect-square rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-all duration-200',
                index === 0 ? 'border-primary' : 'border-transparent',
                dragOverIndex === index && draggingIndex !== index && 'border-primary ring-2 ring-primary/40 scale-[1.03]',
                draggingIndex === index && 'opacity-50 scale-95'
              )}
            >
              <img src={url} alt={`Product ${index + 1}`} className="w-full h-full object-cover pointer-events-none" />

              {/* Delete overlay */}
              <div className="absolute inset-0 bg-rich-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="w-8 h-8"
                  onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Primary badge */}
              {index === 0 && (
                <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                  Primary
                </span>
              )}

              {/* Drag hint */}
              <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-70 transition-opacity">
                <span className="text-[10px] bg-background/80 text-foreground px-1.5 py-0.5 rounded">drag</span>
              </div>
            </div>
          ))}

          {/* Add more button */}
          {images.length < maxImages && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <Plus className="w-8 h-8 text-muted-foreground" />
            </button>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        First image is primary. Drag images to reorder positions.
      </p>
    </div>
  );
}
