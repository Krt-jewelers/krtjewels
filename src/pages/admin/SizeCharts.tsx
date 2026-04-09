import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Loader2, Save, Ruler } from 'lucide-react';
import { useSizeCharts, useUpsertSizeChart, type SizeChart, type SizeChartRow } from '@/hooks/useSizeCharts';

const DEFAULT_CATEGORIES = ['rings', 'bangles', 'bracelets', 'necklaces', 'chains'];

export default function AdminSizeCharts() {
  const { data: charts = [], isLoading } = useSizeCharts();
  const upsert = useUpsertSizeChart();
  const [activeTab, setActiveTab] = useState('rings');
  const [editData, setEditData] = useState<Record<string, {
    column_headers: string[];
    chart_data: SizeChartRow[];
    instructions: string;
    guide_image_url: string;
  }>>({});

  useEffect(() => {
    if (charts.length > 0) {
      const map: typeof editData = {};
      charts.forEach(c => {
        map[c.category] = {
          column_headers: c.column_headers,
          chart_data: c.chart_data,
          instructions: c.instructions,
          guide_image_url: c.guide_image_url || '',
        };
      });
      setEditData(prev => ({ ...prev, ...map }));
    }
  }, [charts]);

  const getEdit = (cat: string) => editData[cat] || {
    column_headers: ['Size', 'Value 1', 'Value 2'],
    chart_data: [],
    instructions: '',
    guide_image_url: '',
  };

  const updateEdit = (cat: string, partial: Partial<typeof editData[string]>) => {
    setEditData(prev => ({
      ...prev,
      [cat]: { ...getEdit(cat), ...partial },
    }));
  };

  const addRow = (cat: string) => {
    const e = getEdit(cat);
    const newRow: SizeChartRow = {};
    e.column_headers.forEach((_, i) => { newRow[`col_${i}`] = ''; });
    updateEdit(cat, { chart_data: [...e.chart_data, newRow] });
  };

  const removeRow = (cat: string, idx: number) => {
    const e = getEdit(cat);
    updateEdit(cat, { chart_data: e.chart_data.filter((_, i) => i !== idx) });
  };

  const updateCell = (cat: string, rowIdx: number, colKey: string, value: string) => {
    const e = getEdit(cat);
    const updated = [...e.chart_data];
    updated[rowIdx] = { ...updated[rowIdx], [colKey]: value };
    updateEdit(cat, { chart_data: updated });
  };

  const addColumn = (cat: string) => {
    const e = getEdit(cat);
    const newHeader = `Column ${e.column_headers.length + 1}`;
    const newKey = `col_${e.column_headers.length}`;
    updateEdit(cat, {
      column_headers: [...e.column_headers, newHeader],
      chart_data: e.chart_data.map(row => ({ ...row, [newKey]: '' })),
    });
  };

  const removeColumn = (cat: string, colIdx: number) => {
    const e = getEdit(cat);
    if (e.column_headers.length <= 1) return;
    const newHeaders = e.column_headers.filter((_, i) => i !== colIdx);
    const colKeys = getColKeys(e.chart_data, e.column_headers);
    const removedKey = colKeys[colIdx];
    const newData = e.chart_data.map(row => {
      const r = { ...row };
      delete r[removedKey];
      return r;
    });
    updateEdit(cat, { column_headers: newHeaders, chart_data: newData });
  };

  const updateHeader = (cat: string, colIdx: number, value: string) => {
    const e = getEdit(cat);
    const newHeaders = [...e.column_headers];
    newHeaders[colIdx] = value;
    updateEdit(cat, { column_headers: newHeaders });
  };

  const getColKeys = (data: SizeChartRow[], headers: string[]): string[] => {
    if (data.length === 0) return headers.map((_, i) => `col_${i}`);
    const keys = Object.keys(data[0]);
    if (keys.length >= headers.length) return keys.slice(0, headers.length);
    return headers.map((_, i) => keys[i] || `col_${i}`);
  };

  const handleSave = (cat: string) => {
    const e = getEdit(cat);
    upsert.mutate({
      category: cat,
      column_headers: e.column_headers,
      chart_data: e.chart_data,
      instructions: e.instructions,
      guide_image_url: e.guide_image_url || null,
    });
  };

  const allCats = Array.from(new Set([...DEFAULT_CATEGORIES, ...charts.map(c => c.category)]));

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Ruler className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Size Charts</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap">
            {allCats.map(cat => (
              <TabsTrigger key={cat} value={cat} className="capitalize">
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>

          {allCats.map(cat => {
            const e = getEdit(cat);
            const colKeys = getColKeys(e.chart_data, e.column_headers);
            return (
              <TabsContent key={cat} value={cat}>
                <Card>
                  <CardHeader>
                    <CardTitle className="capitalize">{cat} Size Chart</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Column Headers */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">Column Headers</Label>
                        <Button size="sm" variant="outline" onClick={() => addColumn(cat)}>
                          <Plus className="w-3 h-3 mr-1" /> Column
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {e.column_headers.map((h, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <Input
                              value={h}
                              onChange={ev => updateHeader(cat, i, ev.target.value)}
                              className="w-44 h-8 text-sm"
                            />
                            {e.column_headers.length > 1 && (
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => removeColumn(cat, i)}>
                                <Trash2 className="w-3 h-3 text-destructive" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Data Table */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">Chart Data ({e.chart_data.length} rows)</Label>
                        <Button size="sm" variant="outline" onClick={() => addRow(cat)}>
                          <Plus className="w-3 h-3 mr-1" /> Row
                        </Button>
                      </div>
                      <div className="border rounded-lg overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-muted/50">
                              {e.column_headers.map((h, i) => (
                                <th key={i} className="px-3 py-2 text-left font-medium">{h}</th>
                              ))}
                              <th className="w-10"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {e.chart_data.map((row, rowIdx) => (
                              <tr key={rowIdx} className="border-t">
                                {colKeys.map((key, colIdx) => (
                                  <td key={colIdx} className="px-2 py-1">
                                    <Input
                                      value={row[key] || ''}
                                      onChange={ev => updateCell(cat, rowIdx, key, ev.target.value)}
                                      className="h-7 text-xs"
                                    />
                                  </td>
                                ))}
                                <td className="px-1">
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeRow(cat, rowIdx)}>
                                    <Trash2 className="w-3 h-3 text-destructive" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                            {e.chart_data.length === 0 && (
                              <tr>
                                <td colSpan={e.column_headers.length + 1} className="text-center py-6 text-muted-foreground">
                                  No data. Click "+ Row" to add sizes.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div>
                      <Label className="text-sm font-medium">Measurement Instructions</Label>
                      <Textarea
                        value={e.instructions}
                        onChange={ev => updateEdit(cat, { instructions: ev.target.value })}
                        rows={4}
                        className="mt-1"
                        placeholder="Instructions on how to measure..."
                      />
                    </div>

                    {/* Guide Image URL */}
                    <div>
                      <Label className="text-sm font-medium">Size Guide Image URL (for PDF download)</Label>
                      <Input
                        value={e.guide_image_url}
                        onChange={ev => updateEdit(cat, { guide_image_url: ev.target.value })}
                        placeholder="https://... or /images/ring-size-guide.png"
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        This image will be shown when users click "View & Download Complete Guide"
                      </p>
                    </div>

                    <Button onClick={() => handleSave(cat)} disabled={upsert.isPending}>
                      {upsert.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save {cat} Size Chart
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    </AdminLayout>
  );
}
