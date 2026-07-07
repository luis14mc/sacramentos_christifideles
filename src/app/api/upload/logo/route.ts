import { NextRequest, NextResponse } from 'next/server';
import { PAGES } from '@/lib/pages';
import { withTenantTransaction } from '@/lib/prisma-tenant';
import { logBitacoraCrud } from '@/lib/bitacora';
import { uploadParishLogo } from '@/lib/storage';
import { handleApiError, requireTenantWithPermission } from '@/lib/tenant';
import { safeParseBody } from '@/lib/validation';
import { logoUploadSchema } from '@/lib/validators/schemas';

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireTenantWithPermission(
      PAGES.CONFIGURACION,
      'actualizar'
    );

    const formData = await request.formData();
    const file = formData.get('logo') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }

    const validated = safeParseBody(logoUploadSchema, {
      type: file.type,
      size: file.size,
    });

    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const result = await uploadParishLogo(file, ctx.parishId);

    await withTenantTransaction(ctx.parishId, (tx) =>
      logBitacoraCrud(tx, {
        parishId: ctx.parishId,
        userId: ctx.userId,
        accion: 'U',
        nombreTabla: 'parroquia_config',
        newValues: { logo_url: result.url, storage: result.storage },
      })
    );

    return NextResponse.json({
      success: true,
      url: result.url,
      fileName: result.fileName,
      storage: result.storage,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
