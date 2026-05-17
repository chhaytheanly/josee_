import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, Home as HomeIcon, Search } from 'lucide-react';
import { useCreateRoom, useDeleteRoom, useRooms, useUpdateRoom } from '../hooks/useRooms';
import type { Room } from '../lib/types/type';

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
    setOpen(false);
    setEditing(null);
    setForm({ name: '', description: '', price: '' });
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const getStatusBadge = (room: Room) => {
    const status = room.status || (room.is_available ? 'available' : 'occupied');
    return status === 'available' ? (
      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">Available</Badge>
    ) : (
      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">Occupied</Badge>
    );
  };

  return (
    <div className="space-y-8">
      {/* ================= HEADER ================= */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <HomeIcon className="h-7 w-7 text-primary" />
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Room Management
            </h1>

            <p className="text-muted-foreground">
              Manage property rooms, pricing, tenants, and availability.
            </p>
          </div>
        </div>

        <Button
          onClick={() => {
            setEditing(null);
            setForm({
              name: '',
              description: '',
              price: '',
            });
            setOpen(true);
          }}
          className="gap-2 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Add Room
        </Button>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            title: 'Total Rooms',
            value: data?.data?.length || 0,
          },
          {
            title: 'Available',
            value:
              data?.data?.filter(
                (r: Room) =>
                  r.status === 'available' ||
                  r.is_available,
              ).length || 0,
          },
          {
            title: 'Occupied',
            value:
              data?.data?.filter(
                (r: Room) =>
                  r.status === 'occupied' ||
                  !r.is_available,
              ).length || 0,
          },
          {
            title: 'Revenue',
            value: `$${(
              data?.data?.reduce(
                (sum: number, r: Room) =>
                  sum + r.price,
                0,
              ) || 0
            ).toFixed(2)}`,
          },
        ].map((item, index) => (
          <Card
            key={index}
            className="border-border/50 shadow-sm transition-all hover:shadow-lg"
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {item.title}
                  </p>

                  <h3 className="text-2xl font-bold tracking-tight">
                    {item.value}
                  </h3>
                </div>

                <div className="rounded-xl bg-primary/10 p-3">
                  <HomeIcon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ================= TABLE ================= */}
      <Card className="overflow-hidden border-border/50 shadow-sm">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="text-lg">
                Room Inventory
              </CardTitle>

              <p className="text-sm text-muted-foreground">
                Overview of all rooms and occupancy status.
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-[260px]">
              <Input
                placeholder="Search room..."
                className="pl-10"
              />

              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-background">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Room</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">
                    Price
                  </TableHead>
                  <TableHead className="text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {data?.data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="rounded-full bg-muted p-3">
                          <HomeIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">No rooms found</p>
                        <p className="text-xs text-muted-foreground">Get started by adding your first room</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data?.map((room: Room) => (
                    <TableRow
                      key={room.id}
                      className="transition-colors hover:bg-muted/40"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <HomeIcon className="h-4 w-4 text-primary" />
                          </div>

                          <div>
                            <p className="font-medium">
                              {room.name}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              ID #{room.id}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                    {/* Description */}
                    <TableCell className="max-w-[220px]">
                      <p className="truncate text-sm text-muted-foreground">
                        {room.description ||
                          'No description'}
                      </p>
                    </TableCell>

                    {/* Tenant */}
                    <TableCell>
                      {room.tenant?.name ? (
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {room.tenant.name}
                          </span>

                          <span className="text-xs text-muted-foreground">
                            Current tenant
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          Empty
                        </span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      {getStatusBadge(room)}
                    </TableCell>

                    {/* Price */}
                    <TableCell className="text-right">
                      <span className="font-semibold text-primary">
                        ${room.price.toFixed(2)}
                      </span>

                      <p className="text-xs text-muted-foreground">
                        monthly
                      </p>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => {
                            setEditing(room);

                            setForm({
                              name: room.name,
                              description:
                                room.description || '',
                              price:
                                room.price.toString(),
                            });

                            setOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Button>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            deleteRoom.mutateAsync(room.id)
                          }
                          disabled={deleteRoom.isPending}
                        >
                          {deleteRoom.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ================= DIALOG ================= */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editing
                ? 'Edit Room'
                : 'Create New Room'}
            </DialogTitle>

            <DialogDescription>
              {editing
                ? 'Update room information and pricing.'
                : 'Add a new room to your property.'}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={submit}
            className="space-y-5 pt-2"
          >
            {/* Room Name */}
            <div className="space-y-2">
              <Label>Room Name</Label>

              <Input
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                placeholder="Room 101"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>

              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                placeholder="Optional description"
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <Label>Monthly Price</Label>

              <Input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) =>
                  setForm({
                    ...form,
                    price: e.target.value,
                  })
                }
                placeholder="0.00"
                required
              />
            </div>

            {/* Footer */}
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={
                  createRoom.isPending ||
                  updateRoom.isPending
                }
                className="gap-2"
              >
                {createRoom.isPending ||
                  updateRoom.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}

                {editing
                  ? 'Update Room'
                  : 'Create Room'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
