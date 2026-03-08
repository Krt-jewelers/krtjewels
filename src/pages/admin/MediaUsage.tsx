import { AdminLayout } from '@/components/layout/AdminLayout';
import { FoundifMediaUsage } from '@/components/admin/FoundifMediaUsage';

export default function AdminMediaUsage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl font-semibold mb-1">Foundif Media</h1>
          <p className="text-muted-foreground">Monitor your media storage usage and limits</p>
        </div>
        <FoundifMediaUsage />
      </div>
    </AdminLayout>
  );
}
