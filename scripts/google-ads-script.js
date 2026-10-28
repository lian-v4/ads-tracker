/**
 * GOOGLE ADS SCRIPT - ADS TRACKER
 * 
 * Como usar:
 * 1. Entre na conta do Google Ads do cliente (ou na MCC).
 * 2. No menu superior, vá em "Ferramentas e Configurações" > "Ações em massa" > "Scripts".
 * 3. Clique no botão azul "+" para criar um novo script.
 * 4. Apague todo o conteúdo e cole este arquivo.
 * 5. Altere as variáveis ENDPOINT e SECRET_TOKEN abaixo.
 * 6. Clique em "Autorizar" e faça o teste com "Visualizar".
 * 7. Salve e adicione uma programação de frequência: "A cada hora".
 */

var CONFIG = {
  ENDPOINT: "https://ads-tracker-zeta.vercel.app/api/sync/google", // Sua URL oficial da Vercel
  SECRET_TOKEN: "ads_tracker_secret_token_12345",                  // Mesma chave definida no .env.local
  CLIENT_NAME: "Cliente Principal"                                 // Nome do cliente para identificação
};

function main() {
  Logger.log("Iniciando coleta de dados do Google Ads...");

  var campaigns = [];
  
  // Coletar campanhas ativas ou pausadas com dados de hoje
  var campaignIterator = AdsApp.campaigns()
    .withCondition("Status IN ['ENABLED', 'PAUSED']")
    .forDateRange("TODAY")
    .get();

  while (campaignIterator.hasNext()) {
    var c = campaignIterator.next();
    var stats = c.getStatsFor("TODAY");

    var cost = stats.getCost();
    var impressions = stats.getImpressions();

    // Filtra campanhas com alguma movimentação hoje
    if (cost > 0 || impressions > 0) {
      campaigns.push({
        campaignId: c.getId().toString(),
        campaignName: c.getName(),
        status: c.isEnabled() ? "ACTIVE" : "PAUSED",
        impressions: impressions,
        clicks: stats.getClicks(),
        spend: cost,
        conversions: stats.getConversions(),
        conversionValue: stats.getConversionValue()
      });
    }
  }

  Logger.log("Campanhas com dados encontradas: " + campaigns.length);

  if (campaigns.length === 0) {
    Logger.log("Nenhuma campanha gastou orçamento hoje até o momento.");
    return;
  }

  var todayStr = Utilities.formatDate(new Date(), "America/Sao_Paulo", "yyyy-MM-dd");

  var payload = {
    clientName: CONFIG.CLIENT_NAME,
    date: todayStr,
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

