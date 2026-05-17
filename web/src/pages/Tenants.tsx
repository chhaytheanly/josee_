import { useTenants, useCreateTenant, useDeleteTenant } from '../hooks/api';
import type { Tenant } from '../hooks/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { useState } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';

export default function Tenants() {
  const { data, isLoading } = useTenants();
  const createTenant = useCreateTenant();
  const deleteTenant = useDeleteTenant();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', id_card: '' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTenant.mutateAsync(form);
    setOpen(false); setForm({ name: '', email: '', phone: '', id_card: '' });
  };

  if (isLoading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Tenants</h1><p className="text-muted-foreground mt-1">Manage your tenant directory.</p></div>
        <Button onClick={() => setOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Tenant</Button>
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {data?.data?.map((t: Tenant) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell>{t.email || '-'}</TableCell>
                <TableCell>{t.phone || '-'}</TableCell>
                <TableCell><Badge variant={t.is_active ? 'success' : 'secondary'}>{t.is_active ? 'Active' : 'Inactive'}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => deleteTenant.mutateAsync(t.id)} disabled={deleteTenant.isPending}>{deleteTenant.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Tenant</DialogTitle><DialogDescription>Enter tenant details.</DialogDescription></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="space-y-2"><Label>ID Card</Label><Input value={form.id_card} onChange={(e) => setForm({ ...form, id_card: e.target.value })} /></div>
            <DialogFooter><Button type="submit" disabled={createTenant.isPending}>{createTenant.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Add Tenant</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
