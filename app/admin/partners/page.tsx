import Image from 'next/image';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { prisma } from '@/lib/db/client';
import { ListPageHeader, ListTable, EmptyRow } from '@/components/admin/ListPage';
import DeleteButton from '@/components/admin/DeleteButton';
import ReorderButtons from '@/components/admin/ReorderButtons';
import { deletePartner } from './actions';

export default async function AdminPartnersPage() {
  const partners = await prisma.partner.findMany({ orderBy: { order: 'asc' } });

  return (
    <div>
      <ListPageHeader title="الشركاء" addHref="/admin/partners/new" />
      <ListTable>
        <tbody>
          {partners.length === 0 && <EmptyRow colSpan={4} />}
          {partners.map((p, i) => (
            <tr key={p.id} style={{ borderTop: '1px solid var(--mat-liquid-border)' }}>
              <td className="ps-3 w-8">
                <ReorderButtons
                  model="partner"
                  id={p.id}
                  isFirst={i === 0}
                  isLast={i === partners.length - 1}
                />
              </td>
              <td className="p-3 w-16">
                <div className="w-10 h-10 rounded-lg overflow-hidden" style={{ background: 'var(--mat-liquid-bg)' }}>
                  <Image src={p.logoUrl} alt={p.name} width={40} height={40} className="w-full h-full object-contain" unoptimized />
                </div>
              </td>
              <td className="p-3" style={{ color: 'var(--text-primary)' }}>{p.name}</td>
              <td className="p-3 w-24">
                <div className="flex items-center gap-1 justify-end">
                  <Link href={`/admin/partners/${p.id}`} className="p-1.5 rounded-lg" style={{ color: 'var(--text-tertiary)' }}>
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <DeleteButton action={deletePartner.bind(null, p.id)} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </ListTable>
    </div>
  );
}
