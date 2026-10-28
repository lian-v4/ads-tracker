import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get('authorization') || '';
    const token = searchParams.get('token') || authHeader.replace('Bearer ', '').trim();

    const expectedToken = process.env.SYNC_SECRET_TOKEN || 'ads_tracker_secret_token_12345';
    if (token !== expectedToken) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { clientName = 'Cliente Principal', date, campaigns } = body;

    if (!Array.isArray(campaigns) || campaigns.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No campaigns provided' },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    const targetDate = date || new Date().toISOString().split('T')[0];
    let insertedCount = 0;

    for (const c of campaigns) {
      const campId = String(c.campaignId || c.id || c.campaignName);
      const campName = String(c.campaignName || c.name || 'Sem Nome');
      const status = String(c.status || 'ACTIVE');
      const impressions = parseInt(c.impressions || 0, 10);
      const clicks = parseInt(c.clicks || 0, 10);
      const spend = parseFloat(c.spend || 0);
      const conversions = parseFloat(c.conversions || 0);
      const conversionValue = parseFloat(c.conversionValue || c.conversion_value || 0);

      await pool.query(`
        INSERT INTO metrics (
          platform, client_name, campaign_name, campaign_id, status, date,
          impressions, clicks, spend, conversions, conversion_value, updated_at
        )
        VALUES ('meta', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        ON CONFLICT (platform, campaign_id, date)
        DO UPDATE SET
          campaign_name = EXCLUDED.campaign_name,
          status = EXCLUDED.status,
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
        status,
        targetDate,
        impressions,
        clicks,
        spend,
        conversions,
        conversionValue
      ]);

      insertedCount++;
    }

    // Registrar log
    await pool.query(`
      INSERT INTO sync_logs (platform, status, records_count, message)
      VALUES ('meta', 'SUCCESS', $1, $2)
    `, [insertedCount, `Sync de ${insertedCount} campanhas para data ${targetDate}`]);

    return NextResponse.json({
      success: true,
      message: `Synced ${insertedCount} campaigns from Meta Ads`,
      date: targetDate
    });
  } catch (error: any) {
    console.error('Error syncing Meta Ads:', error);

    try {
      const pool = getDbPool();
      await pool.query(`
        INSERT INTO sync_logs (platform, status, records_count, message)
        VALUES ('meta', 'ERROR', 0, $1)
      `, [error.message]);
    } catch (_) {}

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

