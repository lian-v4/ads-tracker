import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('range') || 'today';

    const pool = getDbPool();

    let dateFilter = 'date = CURRENT_DATE';
    if (dateRange === 'yesterday') {
      dateFilter = 'date = CURRENT_DATE - INTERVAL \'1 day\'';
    } else if (dateRange === '7d') {
      dateFilter = 'date >= CURRENT_DATE - INTERVAL \'7 days\'';
    } else if (dateRange === '30d') {
      dateFilter = 'date >= CURRENT_DATE - INTERVAL \'30 days\'';
    } else if (dateRange === 'all') {
      dateFilter = '1=1';
    }

    // 1. Overall Summary
    const summaryQuery = `
      SELECT 
        COALESCE(SUM(spend), 0) as total_spend,
        COALESCE(SUM(impressions), 0) as total_impressions,
        COALESCE(SUM(clicks), 0) as total_clicks,
        COALESCE(SUM(conversions), 0) as total_conversions,
        COALESCE(SUM(conversion_value), 0) as total_conversion_value
      FROM metrics
      WHERE ${dateFilter}
    `;
    const summaryRes = await pool.query(summaryQuery);
    const s = summaryRes.rows[0];

    const spend = Number(s.total_spend);
    const impressions = Number(s.total_impressions);
    const clicks = Number(s.total_clicks);
    const conversions = Number(s.total_conversions);
    const conversionValue = Number(s.total_conversion_value);

    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;
    const cpa = conversions > 0 ? spend / conversions : 0;
    const roas = spend > 0 ? conversionValue / spend : 0;

    // 2. Metrics grouped by Platform
    const platformQuery = `
      SELECT 
        platform,
        COALESCE(SUM(spend), 0) as spend,
        COALESCE(SUM(impressions), 0) as impressions,
        COALESCE(SUM(clicks), 0) as clicks,
        COALESCE(SUM(conversions), 0) as conversions,
        COALESCE(SUM(conversion_value), 0) as conversion_value
      FROM metrics
      WHERE ${dateFilter}
      GROUP BY platform
    `;
    const platformRes = await pool.query(platformQuery);

    // 3. Campaign details list
    const campaignsQuery = `
      SELECT 
        id,
        platform,
        campaign_name,
        campaign_id,
        status,
        date,
        impressions,
        clicks,
        spend,
        conversions,
        conversion_value,
        updated_at
      FROM metrics
      WHERE ${dateFilter}
      ORDER BY spend DESC
      LIMIT 100
    `;
    const campaignsRes = await pool.query(campaignsQuery);

    // 4. Last sync timestamp
    const lastSyncRes = await pool.query(`
      SELECT MAX(created_at) as last_sync FROM sync_logs
    `);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          spend,
          impressions,
          clicks,
          ctr: Number(ctr.toFixed(2)),
          cpc: Number(cpc.toFixed(2)),
          conversions: Number(conversions.toFixed(1)),
          cpa: Number(cpa.toFixed(2)),
          conversionValue,
          roas: Number(roas.toFixed(2))
        },
        platforms: platformRes.rows.map(p => {
          const pSpend = Number(p.spend);
          const pClicks = Number(p.clicks);
          const pImpr = Number(p.impressions);
          const pConv = Number(p.conversions);
          const pVal = Number(p.conversion_value);
          return {
            platform: p.platform,
            spend: pSpend,
            impressions: pImpr,
            clicks: pClicks,
            conversions: pConv,
            conversionValue: pVal,
            ctr: pImpr > 0 ? Number(((pClicks / pImpr) * 100).toFixed(2)) : 0,
            cpc: pClicks > 0 ? Number((pSpend / pClicks).toFixed(2)) : 0,
            cpa: pConv > 0 ? Number((pSpend / pConv).toFixed(2)) : 0,
            roas: pSpend > 0 ? Number((pVal / pSpend).toFixed(2)) : 0,
          };
        }),
        campaigns: campaignsRes.rows,
        lastSync: lastSyncRes.rows[0]?.last_sync || new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

