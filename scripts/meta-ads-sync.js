/**
 * SCRIPT PARA META ADS (FACEBOOK & INSTAGRAM)
 * 
 * Este script pode ser executado periodicamente (ex: via cron, GitHub Actions ou localmente)
 * para puxar os dados da Meta Marketing API e enviar para o Ads Tracker.
 * 
 * Requisitos:
 * - META_ACCESS_TOKEN: Token de acesso do Facebook (User Token ou System User Token da BM)
 * - META_AD_ACCOUNT_ID: ID da conta de anúncios (ex: act_1234567890)
 */

const ENDPOINT = process.env.TRACKER_ENDPOINT || 'http://localhost:3001/api/sync/meta';
const SECRET_TOKEN = process.env.SYNC_SECRET_TOKEN || 'ads_tracker_secret_token_12345';
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const AD_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID; // ex: act_1234567890

async function syncMetaAds() {
  if (!ACCESS_TOKEN || !AD_ACCOUNT_ID) {
    console.log('Para sincronizar a Meta, preencha META_ACCESS_TOKEN e META_AD_ACCOUNT_ID.');
    console.log('Exemplo de uso:');
    console.log('META_ACCESS_TOKEN="seu_token" META_AD_ACCOUNT_ID="act_123456" node scripts/meta-ads-sync.js');
    return;
  }

  const cleanAccountId = AD_ACCOUNT_ID.startsWith('act_') ? AD_ACCOUNT_ID : `act_${AD_ACCOUNT_ID}`;
  const fields = 'campaign_id,campaign_name,impressions,clicks,spend,actions,action_values';
  const url = `https://graph.facebook.com/v19.0/${cleanAccountId}/insights?fields=${fields}&date_preset=today&level=campaign&access_token=${ACCESS_TOKEN}`;

  console.log(`Buscando dados da Meta para a conta ${cleanAccountId}...`);

  const res = await fetch(url);
  const data = await res.json();

  if (data.error) {
    console.error('Erro retornado pela Meta:', data.error);
    return;
  }

  const items = data.data || [];
  console.log(`Encontradas ${items.length} campanhas com dados hoje.`);

  const campaigns = items.map((item) => {
    // Extrai conversoes (compras, leads ou conversoes personalizadas)
    let conversions = 0;
    let conversionValue = 0;

    if (Array.isArray(item.actions)) {
      const purchase = item.actions.find((a) => a.action_type === 'purchase' || a.action_type === 'omni_purchase' || a.action_type === 'lead');
      if (purchase) conversions = parseFloat(purchase.value || 0);
    }

    if (Array.isArray(item.action_values)) {
      const purchaseVal = item.action_values.find((a) => a.action_type === 'purchase' || a.action_type === 'omni_purchase');
      if (purchaseVal) conversionValue = parseFloat(purchaseVal.value || 0);
    }

    return {
      campaignId: item.campaign_id,
      campaignName: item.campaign_name,
      status: 'ACTIVE',
      impressions: parseInt(item.impressions || 0, 10),
      clicks: parseInt(item.clicks || 0, 10),
      spend: parseFloat(item.spend || 0),
      conversions: conversions,
      conversionValue: conversionValue,
    };
  });

  const payload = {
    clientName: 'Cliente Principal',
    date: new Date().toISOString().split('T')[0],
    campaigns,
  };

  console.log('Enviando dados para o Ads Tracker...');
  const sendRes = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SECRET_TOKEN}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await sendRes.json();
  console.log('Resposta do Ads Tracker:', result);
}

syncMetaAds().catch(console.error);

