import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, Home as HomeIcon, Search, UserPlus } from 'lucide-react';
import { useCreateRoom, useDeleteRoom, useRooms, useUpdateRoom, useAssignTenantToRoom } from '../hooks/useRooms';
import { useTenants } from '../hooks/useTenents';
import type { Room, Tenant } from '../lib/types/type';

export default function Rooms() {
  const { data, isLoading } = useRooms();
  const { data: tenantsData } = useTenants();
  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();
  const deleteRoom = useDeleteRoom();
  const assignTenant = useAssignTenantToRoom();
  
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '' });
  const [search, setSearch] = useState('');
  
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<number | string>('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const d = { ...form, price: parseFloat(form.price), is_available: true };
    if (editing) await updateRoom.mutateAsync({ id: editing.id, ...d });
    else await createRoom.mutateAsync(d);
    setOpen(false);
    setEditing(null);
    setForm({ name: '', description: '', price: '' });
  };

  const handleAssignTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !selectedTenant) return;

    try {
      await assignTenant.mutateAsync({
        roomId: selectedRoom.id,
        tenantData: {
          tenant_id: parseInt(String(selectedTenant)),
        }
      });
      setAssignOpen(false);
      setSelectedRoom(null);
      setSelectedTenant('');
    } catch (error) {
      console.error('Failed to assign tenant:', error);
    }
  };

  const unassignedTenants = tenantsData?.data?.filter((t: Tenant) => !t.room_id && t.is_active) || [];
  const rooms = data?.data || [];
  
  const filteredRooms = rooms.filter((r: Room) => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    r.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const getStatusBadge = (room: Room) => {
    const status = room.status || (room.is_available ? 'available' : 'occupied');
    return status === 'available' ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-500 ring-1 ring-inset ring-emerald-500/20">
        Available
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-500 ring-1 ring-inset ring-amber-500/20">
        Occupied
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Room Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage property rooms, pricing, tenants, and availability.</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setForm({ name: '', description: '', price: '' });
            setOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="h-4 w-4" /> Add Room
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: 'Total Rooms', value: rooms.length, icon: HomeIcon },
          { title: 'Available', value: rooms.filter((r: Room) => r.status === 'available' || r.is_available).length, icon: HomeIcon },
          { title: 'Occupied', value: rooms.filter((r: Room) => r.status === 'occupied' || !r.is_available).length, icon: HomeIcon },
          { title: 'Total Value', value: `$${(rooms.reduce((sum: number, r: Room) => sum + r.price, 0)).toFixed(2)}`, icon: HomeIcon },
        ].map((item, index) => (
          <Card key={index}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
                  <h3 className="text-2xl font-bold mt-2">{item.value}</h3>
                </div>
                <div className="p-2 rounded-md bg-secondary text-muted-foreground">
                  <item.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold">Room Inventory</h3>
            <p className="text-sm text-muted-foreground mt-1">Overview of all rooms and occupancy status.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search room..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRooms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No rooms found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRooms.map((room: Room) => (
                  <TableRow key={room.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-foreground">
                          <HomeIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{room.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">ID #{room.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="truncate text-sm text-muted-foreground">
                        {room.description || '-'}
                      </p>
                    </TableCell>
                    <TableCell>
                      {room.tenant?.name ? (
                        <div>
                          <p className="font-medium text-sm text-foreground">{room.tenant.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Current tenant</p>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Empty</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(room)}
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="font-semibold text-sm text-foreground">${room.price.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">/mo</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {room.status === 'available' || room.is_available ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1"
                            onClick={() => {
                              setSelectedRoom(room);
                              setSelectedTenant('');
                              setAssignOpen(true);
                            }}
                            disabled={unassignedTenants.length === 0}
                          >
                            <UserPlus className="h-3.5 w-3.5" /> Assign
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditing(room);
                            setForm({ name: room.name, description: room.description || '', price: room.price.toString() });
                            setOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteRoom.mutateAsync(room.id)}
                          disabled={deleteRoom.isPending}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          {deleteRoom.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit Room' : 'Create New Room'}
            </DialogTitle>
            <DialogDescription>
              {editing ? 'Update room information and pricing.' : 'Add a new room to your property.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Room Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Room 101"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div className="space-y-2">
              <Label>Monthly Price</Label>
              <Input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

            <DialogFooter className="pt-4 mt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createRoom.isPending || updateRoom.isPending}>
                {createRoom.isPending || updateRoom.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {editing ? 'Update Room' : 'Create Room'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Tenant to Room</DialogTitle>
            <DialogDescription>
              Select an available tenant to assign to {selectedRoom?.name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignTenant} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Select Tenant</Label>
              {unassignedTenants.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/50 p-4 text-center">
                  <p className="text-sm font-medium text-foreground">No available tenants</p>
                  <p className="text-xs text-muted-foreground mt-1">Create new tenants first.</p>
                </div>
              ) : (
                <Select
                  value={String(selectedTenant)}
                  onChange={(e) => setSelectedTenant(e.target.value ? parseInt(e.target.value) : '')}
                  required
                  className="w-full"
                >
                  <option value="">Choose a tenant...</option>
                  {unassignedTenants.map((tenant: Tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} {tenant.email ? `(${tenant.email})` : ''}
                    </option>
                  ))}
                </Select>
              )}
            </div>

            <DialogFooter className="pt-4 mt-2">
              <Button type="button" variant="outline" onClick={() => { setAssignOpen(false); setSelectedRoom(null); setSelectedTenant(''); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={!selectedTenant || assignTenant.isPending}>
                {assignTenant.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Assign Tenant
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
