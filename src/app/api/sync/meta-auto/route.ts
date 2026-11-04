import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return handleSync(request);
}

export async function POST(request: Request) {
  return handleSync(request);
}

async function handleSync(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get('authorization') || '';
    const token = searchParams.get('token') || authHeader.replace('Bearer ', '').trim();

    const expectedToken = process.env.SYNC_SECRET_TOKEN || 'ads_tracker_secret_token_12345';
    // Permite chamada do Vercel Cron (que envia header específico) ou validação de token
    const isCron = request.headers.get('x-vercel-cron') === '1';

    if (!isCron && token !== expectedToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    const accessToken = process.env.META_ACCESS_TOKEN;
    const adAccountId = process.env.META_AD_ACCOUNT_ID;
    const clientName = process.env.META_CLIENT_NAME || 'Cliente Principal';

    if (!accessToken || !adAccountId) {
      return NextResponse.json({
        success: false,
        error: 'META_ACCESS_TOKEN ou META_AD_ACCOUNT_ID não configurados nas variáveis de ambiente da Vercel.'
      }, { status: 400 });
    }

    const cleanAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
    const fields = 'campaign_id,campaign_name,impressions,clicks,spend,actions,action_values';
    const metaUrl = `https://graph.facebook.com/v19.0/${cleanAccountId}/insights?fields=${fields}&date_preset=today&level=campaign&access_token=${accessToken}`;

    const metaRes = await fetch(metaUrl);
    const metaData = await metaRes.json();

    if (metaData.error) {
      return NextResponse.json({
        success: false,
        error: `Erro da API Meta: ${metaData.error.message || JSON.stringify(metaData.error)}`
      }, { status: 502 });
    }

    const items = metaData.data || [];
    const pool = getDbPool();
    const today = new Date().toISOString().split('T')[0];
    let insertedCount = 0;

    for (const item of items) {
      const campId = String(item.campaign_id);
      const campName = String(item.campaign_name || 'Campanha Meta');
      const impressions = parseInt(item.impressions || 0, 10);
      const clicks = parseInt(item.clicks || 0, 10);
      const spend = parseFloat(item.spend || 0);

      let conversions = 0;
      let conversionValue = 0;

      if (Array.isArray(item.actions)) {
        const purchase = item.actions.find((a: any) => 
          a.action_type === 'purchase' || 
          a.action_type === 'omni_purchase' || 
          a.action_type === 'lead'
        );
        if (purchase) conversions = parseFloat(purchase.value || 0);
      }

      if (Array.isArray(item.action_values)) {
        const purchaseVal = item.action_values.find((a: any) => 
          a.action_type === 'purchase' || 
          a.action_type === 'omni_purchase'
        );
        if (purchaseVal) conversionValue = parseFloat(purchaseVal.value || 0);
      }

      await pool.query(`
        INSERT INTO metrics (
          platform, client_name, campaign_name, campaign_id, status, date,
          impressions, clicks, spend, conversions, conversion_value, updated_at
        )
        VALUES ('meta', $1, $2, $3, 'ACTIVE', $4, $5, $6, $7, $8, $9, NOW())
        ON CONFLICT (platform, campaign_id, date)
        DO UPDATE SET
          campaign_name = EXCLUDED.campaign_name,
          status = 'ACTIVE',
          impressions = EXCLUDED.impressions,
          clicks = EXCLUDED.clicks,
          spend = EXCLUDED.spend,
          conversions = EXCLUDED.conversions,
          conversion_value = EXCLUDED.conversion_value,
          updated_at = NOW();
      `, [
        clientName,
        campName,
        campId,
        today,
        impressions,
        clicks,
        spend,
        conversions,
        conversionValue
      ]);

      insertedCount++;
    }

    await pool.query(`
      INSERT INTO sync_logs (platform, status, records_count, message)
      VALUES ('meta', 'SUCCESS', $1, $2)
    `, [insertedCount, `Sync automático de ${insertedCount} campanhas da Meta para data ${today}`]);

    return NextResponse.json({
      success: true,
      message: `Meta sincronizada com sucesso! ${insertedCount} campanhas atualizadas.`,
      records: insertedCount,
      date: today
    });
  } catch (error: any) {
    console.error('Erro na sincronizacao da Meta:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
