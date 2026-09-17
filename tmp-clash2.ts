import { readFileSync } from 'node:fs'; import { join } from 'node:path';
for (const l of readFileSync(join(process.cwd(),'.env.local'),'utf-8').split('\n')) { const m=l.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/); if(!m)continue; const [,k,r='']=m; if(process.env[k]===undefined) process.env[k]=r.replace(/^['"]|['"]$/g,''); }
(async () => {
  const { prisma } = await import('./lib/db/client');
  const u = await prisma.user.findUniqueOrThrow({ where: { email: 'demo@cict2026.com' } });
  // a temporary session deliberately clashing with the saved 09:00 one
  const clash = await prisma.programSession.create({
    data: { day: 'dayOne', time: '09:30', titleAr: '__اختبار تعارض__', order: 999 },
  });
  await prisma.savedSession.create({ data: { userId: u.id, sessionId: clash.id } });
  console.log('added clashing session at 09:30 (overlaps the 09:00 one):', clash.id);
})();
