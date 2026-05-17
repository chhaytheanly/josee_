import { useRooms, useCreateRoom, useUpdateRoom, useDeleteRoom } from '../hooks/api';
import type { Room } from '../hooks/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

export default function Rooms() {
  const { data, isLoading } = useRooms();
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const d = { ...form, price: parseFloat(form.price), is_available: true };
    if (editing) await updateRoom.mutateAsync({ id: editing.id, ...d });
    else await createRoom.mutateAsync(d);
    setOpen(false); setEditing(null); setForm({ name: '', description: '', price: '' });
  };

  if (isLoading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Rooms</h1><p className="text-muted-foreground mt-1">Manage your property rooms.</p></div>
        <Button onClick={() => { setEditing(null); setForm({ name: '', description: '', price: '' }); setOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Add Room</Button>
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Price</TableHead><TableHead>Status</TableHead><TableHead>Tenant</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {data?.data?.map((room: Room) => (
              <TableRow key={room.id}>
                <TableCell className="font-medium">{room.name}</TableCell>
                <TableCell>${room.price.toFixed(2)}</TableCell>
                <TableCell><Badge variant={room.status === 'available' ? 'success' : 'default'}>{room.status || (room.is_available ? 'available' : 'occupied')}</Badge></TableCell>
                <TableCell>{room.tenant?.name || '-'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(room); setForm({ name: room.name, description: room.description || '', price: room.price.toString() }); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteRoom.mutateAsync(room.id)} disabled={deleteRoom.isPending}>{deleteRoom.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit Room' : 'Create Room'}</DialogTitle><DialogDescription>Fill in the room details.</DialogDescription></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2"><Label>Room Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Price</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
            <DialogFooter><Button type="submit" disabled={createRoom.isPending || updateRoom.isPending}>{createRoom.isPending || updateRoom.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{editing ? 'Update' : 'Create'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
