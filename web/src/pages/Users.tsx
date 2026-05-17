import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../hooks/api';
import type { User } from '../hooks/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../components/ui/dialog';
import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

export default function Users() {
  const { data, isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role_id: '1' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const d = { ...form, role_id: parseInt(form.role_id) };
    if (editing) {
      const { password, ...rest } = d;
      await updateUser.mutateAsync({ id: editing.id, ...rest, ...(password ? { password } : {}) });
    } else {
      await createUser.mutateAsync(d);
    }
    setOpen(false); setEditing(null); setForm({ name: '', email: '', password: '', role_id: '1' });
  };

  if (isLoading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  const users = data?.data || data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Users</h1><p className="text-muted-foreground mt-1">Manage system users and roles.</p></div>
        <Button onClick={() => { setEditing(null); setForm({ name: '', email: '', password: '', role_id: '1' }); setOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Add User</Button>
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {Array.isArray(users) && users.map((u: User) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell><Badge variant="outline">{u.role?.name || `Role ${u.role_id}`}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(u); setForm({ name: u.name, email: u.email, password: '', role_id: u.role_id.toString() }); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteUser.mutateAsync(u.id)} disabled={deleteUser.isPending}>{deleteUser.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? 'Edit User' : 'Create User'}</DialogTitle><DialogDescription>{editing ? 'Update user details.' : 'Add a new user.'}</DialogDescription></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Password {!editing && '(Required)'}</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} /></div>
            <div className="space-y-2"><Label>Role</Label><Select value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })}><option value="1">Admin</option><option value="2">Manager</option><option value="3">Staff</option></Select></div>
            <DialogFooter><Button type="submit" disabled={createUser.isPending || updateUser.isPending}>{createUser.isPending || updateUser.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}{editing ? 'Update' : 'Create'}</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
