/**
 * GOOGLE ADS SCRIPT - ADS TRACKER (ÚLTIMOS 30 DIAS)
 * 
 * Puxa os dados diários dos últimos 30 dias (Search, Display, Performance Max, Video, Shopping, etc.)
 * e envia para o banco do Ads Tracker com a data exata de cada dia.
 * 
 * Como usar:
 * 1. Entre na conta do Google Ads do cliente (ou na MCC).
 * 2. No menu superior, vá em "Ferramentas e Configurações" > "Ações em massa" > "Scripts".
 * 3. Abra seu script existente (ou crie um novo "+").
 * 4. Apague todo o conteúdo e cole este arquivo.
 * 5. Clique em "Autorizar" (se ainda não autorizou) e clique em "Visualizar" ou "Executar".
 * 6. Agende a frequência para: "A cada hora".
 */

var CONFIG = {
  ENDPOINT: "https://ads-tracker-zeta.vercel.app/api/sync/google",
  SECRET_TOKEN: "ads_tracker_secret_token_12345",
  CLIENT_NAME: "Cliente Principal"
};

function main() {
  Logger.log("Iniciando coleta dos últimos 30 dias do Google Ads...");

  var query = [
    "SELECT",
    "  campaign.id,",
    "  campaign.name,",
    "  campaign.status,",
    "  segments.date,",
    "  metrics.impressions,",
    "  metrics.clicks,",
    "  metrics.cost_micros,",
    "  metrics.conversions,",
    "  metrics.conversions_value",
    "FROM campaign",
    "WHERE segments.date DURING LAST_30_DAYS",
    "  AND metrics.impressions > 0"
  ].join(" ");

  var report = AdsApp.report(query);
  var rows = report.rows();
  var campaigns = [];

  while (rows.hasNext()) {
    var row = rows.next();
    var costMicros = Number(row["metrics.cost_micros"] || 0);
    var status = row["campaign.status"] === "ENABLED" ? "ACTIVE" : String(row["campaign.status"] || "PAUSED");

    campaigns.push({
      campaignId: String(row["campaign.id"]),
      campaignName: String(row["campaign.name"]),
      status: status,
      date: String(row["segments.date"]),
      impressions: parseInt(row["metrics.impressions"] || 0, 10),
      clicks: parseInt(row["metrics.clicks"] || 0, 10),
      spend: Number((costMicros / 1000000).toFixed(2)),
      conversions: Number(row["metrics.conversions"] || 0),
      conversionValue: Number(row["metrics.conversions_value"] || 0)
    });
  }

  Logger.log("Registros encontrados nos últimos 30 dias: " + campaigns.length);

  if (campaigns.length === 0) {
    Logger.log("Nenhuma campanha teve impressões nos últimos 30 dias.");
    return;
  }

  var payload = {
    clientName: CONFIG.CLIENT_NAME,
    campaigns: campaigns
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "Authorization": "Bearer " + CONFIG.SECRET_TOKEN
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    var response = UrlFetchApp.fetch(CONFIG.ENDPOINT, options);
    var responseCode = response.getResponseCode();
    var responseText = response.getContentText();

    if (responseCode === 200) {
      Logger.log("Sucesso ao sincronizar com o Ads Tracker: " + responseText);
    } else {
      Logger.log("Erro (" + responseCode + "): " + responseText);
    }
  } catch (e) {
    Logger.log("Falha na requisicao: " + e.toString());
  }
}
