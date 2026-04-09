import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ChevronLeft, ChevronRight, Ruler } from 'lucide-react';
import { useSizeChart } from '@/hooks/useSizeCharts';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SizeGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string;
  selectedSize?: string;
  onSelectSize?: (size: string) => void;
}

export function SizeGuideDialog({ open, onOpenChange, category, selectedSize, onSelectSize }: SizeGuideDialogProps) {
  const { data: chart, isLoading } = useSizeChart(category);
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const handleDownload = () => {
    const imageUrl = chart?.guide_image_url || `/images/${category}-size-guide.png`;
    // Open image in new tab for download
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `KRT-Jewellers-${category}-size-guide.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStepContent = () => {
    const instructions = (chart?.instructions || '').split('\n\n');
    switch (step) {
      case 1:
        return {
          title: 'Measure with a String',
          desc: instructions[1] || 'Take a piece of string/tape and wrap it around your intended finger. Hold the string in place and mark the meeting point.',
        };
      case 2:
        return {
          title: 'Match Your Existing Piece',
          desc: instructions[0] || 'Use an existing piece that fits you well. Match the inside dimensions with our size chart below.',
        };
      case 3:
        return {
          title: 'Find Your Size',
          desc: 'Use the chart below to find your perfect size based on your measurements.',
        };
      default:
        return { title: '', desc: '' };
    }
  };

  const colKeys = chart?.chart_data?.[0] ? Object.keys(chart.chart_data[0]) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-lg font-serif">
            <Ruler className="w-5 h-5 text-primary" />
            {category.charAt(0).toUpperCase() + category.slice(1)} Size Guide
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : (
          <div className="p-6 pt-4 space-y-5">
            {/* Steps Navigation */}
            <div className="bg-secondary/50 rounded-xl p-5">
              <div className="text-center mb-3">
                <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">Steps</span>
              </div>
              <div className="flex items-center justify-center gap-2 mb-4">
                <button
                  onClick={() => setStep(Math.max(1, step - 1))}
                  disabled={step === 1}
                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalSteps }, (_, i) => i + 1).map(s => (
                  <button
                    key={s}
                    onClick={() => setStep(s)}
                    className={cn(
                      'w-8 h-8 rounded-full text-sm font-semibold transition-all',
                      s === step
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-background border border-border text-muted-foreground hover:border-primary/50'
                    )}
                  >
                    {s}
                  </button>
                ))}
                <button
                  onClick={() => setStep(Math.min(totalSteps, step + 1))}
                  disabled={step === totalSteps}
                  className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="text-center">
                <p className="font-medium text-sm text-foreground">{getStepContent().title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{getStepContent().desc}</p>
              </div>
            </div>

            {/* Download Link */}
            <div className="text-center">
              <button
                onClick={handleDownload}
                className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                View & Download Complete Size Guide ›
              </button>
            </div>

            {/* Size Chart Table */}
            {chart && chart.chart_data.length > 0 && (
              <div>
                <h4 className="font-medium text-sm mb-3 capitalize">{category} Size Chart</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-primary text-primary-foreground">
                        {onSelectSize && <th className="px-3 py-2.5 text-left text-xs font-semibold">Select</th>}
                        {chart.column_headers.map((h, i) => (
                          <th key={i} className="px-3 py-2.5 text-left text-xs font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {chart.chart_data.map((row, rowIdx) => {
                        const sizeVal = row[colKeys[0]] || '';
                        const isSelected = selectedSize === sizeVal;
                        return (
                          <tr
                            key={rowIdx}
                            className={cn(
                              'border-t transition-colors',
                              isSelected ? 'bg-primary/10' : rowIdx % 2 === 0 ? 'bg-background' : 'bg-muted/30',
                              onSelectSize && 'cursor-pointer hover:bg-primary/5'
                            )}
                            onClick={() => onSelectSize?.(sizeVal)}
                          >
                            {onSelectSize && (
                              <td className="px-3 py-2">
                                <div className={cn(
                                  'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                                  isSelected ? 'border-primary' : 'border-muted-foreground/40'
                                )}>
                                  {isSelected && <div className="w-2 h-2 rounded-full bg-primary" />}
                                </div>
                              </td>
                            )}
                            {colKeys.map((key, colIdx) => (
                              <td key={colIdx} className={cn(
                                'px-3 py-2 text-xs',
                                colIdx === 0 && 'font-semibold text-primary'
                              )}>
                                {row[key]}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Contact Info */}
            <p className="text-[10px] text-center text-muted-foreground">
              If in need of assistance? Please contact Customer Service at +919843010986
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
