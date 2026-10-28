'use client';

import { useState, useEffect, useCallback } from 'react';

interface SummaryData {
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  cpa: number;
  conversionValue: number;
  roas: number;
}

interface PlatformMetric {
  platform: 'meta' | 'google';
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionValue: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roas: number;
}

interface CampaignRow {
  id: number;
  platform: string;
  campaign_name: string;
  campaign_id: string;
  status: string;
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  conversion_value: number;
  updated_at: string;
}

export default function DashboardPage() {
  const [range, setRange] = useState<'today' | 'yesterday' | '7d' | '30d' | 'all'>('today');
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [platforms, setPlatforms] = useState<PlatformMetric[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [lastSync, setLastSync] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number>(30);
  const [refreshInterval, setRefreshInterval] = useState<number>(30);
  const [showScriptModal, setShowScriptModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/metrics?range=${range}`);
      const json = await res.json();
      if (json.success) {
        setSummary(json.data.summary);
        setPlatforms(json.data.platforms);
        setCampaigns(json.data.campaigns);
        setLastSync(json.data.lastSync);
      }
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoading(false);
      setCountdown(refreshInterval);
    }
  }, [range, refreshInterval]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Countdown and Auto-refresh
  useEffect(() => {
    if (refreshInterval === 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchMetrics();
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [fetchMetrics, refreshInterval]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const formatNumber = (val: number) =>
    new Intl.NumberFormat('pt-BR').format(val || 0);

  const metaData = platforms.find((p) => p.platform === 'meta');
  const googleData = platforms.find((p) => p.platform === 'google');

  const googleScriptCode = `/**
 * SCRIPT PARA GOOGLE ADS - ENVIO AUTOMATICO
 * Cole em: Ferramentas e Configuracoes > Acoes em massa > Scripts
 * Agende para rodar de 1 em 1 hora.
 */
function main() {
  var ENDPOINT = "https://SEU_DOMINIO_VERCEL.vercel.app/api/sync/google";
  var SECRET_TOKEN = "ads_tracker_secret_token_12345";
  var CLIENT_NAME = "Cliente Principal";

  var campaigns = [];
  var campaignIterator = AdsApp.campaigns()
    .withCondition("Status IN ['ENABLED', 'PAUSED']")
    .forDateRange("TODAY")
    .get();

  while (campaignIterator.hasNext()) {
    var c = campaignIterator.next();
    var stats = c.getStatsFor("TODAY");
    
    // Ignora campanhas que nao gastaram nada hoje para economizar payload
    if (stats.getCost() > 0 || stats.getImpressions() > 0) {
      campaigns.push({
        campaignId: c.getId().toString(),
        campaignName: c.getName(),
        status: c.isEnabled() ? "ACTIVE" : "PAUSED",
        impressions: stats.getImpressions(),
        clicks: stats.getClicks(),
        spend: stats.getCost(),
        conversions: stats.getConversions(),
        conversionValue: stats.getConversionValue()
      });
    }
  }

  if (campaigns.length === 0) {
    Logger.log("Nenhuma campanha com dados hoje.");
    return;
  }

  var payload = {
    clientName: CLIENT_NAME,
    date: Utilities.formatDate(new Date(), "America/Sao_Paulo", "yyyy-MM-dd"),
    campaigns: campaigns
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "Authorization": "Bearer " + SECRET_TOKEN
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(ENDPOINT, options);
  Logger.log("Resultado Sync: " + response.getContentText());
}`;

  return (
    <div style={{ minHeight: '100vh', padding: '24px 32px', boxSizing: 'border-box' }}>
      {/* HEADER */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
          paddingBottom: '20px',
          borderBottom: '1px solid #1e293b',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '18px',
                color: '#fff',
              }}
            >
              ⚡
            </div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' }}>
              Ads Tracker
            </h1>
            <span
              style={{
                background: '#10b98122',
                color: '#10b981',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                }}
              />
              Ao Vivo
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>
            Monitoramento de tráfego Meta Ads & Google Ads em tempo real
          </p>
        </div>

        {/* CONTROLS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* DATE SELECTOR */}
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '4px',
              display: 'flex',
              gap: '4px',
            }}
          >
            {[
              { id: 'today', label: 'Hoje' },
              { id: 'yesterday', label: 'Ontem' },
              { id: '7d', label: '7D' },
              { id: '30d', label: '30D' },
              { id: 'all', label: 'Tudo' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setRange(d.id as any)}
                style={{
                  background: range === d.id ? '#3b82f6' : 'transparent',
                  color: range === d.id ? '#fff' : '#94a3b8',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* AUTO-REFRESH STATUS */}
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '13px',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>Auto-atualiza em:</span>
            <strong style={{ color: '#38bdf8', minWidth: '24px' }}>
              {refreshInterval === 0 ? 'Off' : `${countdown}s`}
            </strong>
          </div>

          {/* MANUAL REFRESH BUTTON */}
          <button
            onClick={() => fetchMetrics()}
            disabled={loading}
            style={{
              background: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{loading ? '↻ Carregando...' : '↻ Atualizar Agora'}</span>
          </button>

          {/* OPEN SCRIPT CODE MODAL */}
          <button
            onClick={() => setShowScriptModal(true)}
            style={{
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Script do Google Ads
          </button>
        </div>
      </header>

      {/* TOP KPI CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <KpiCard
          label="Investimento Total"
          value={formatCurrency(summary?.spend || 0)}
          subtext="Meta + Google Ads"
          accentColor="#3b82f6"
        />
        <KpiCard
          label="Faturamento Gerado"
          value={formatCurrency(summary?.conversionValue || 0)}
          subtext="Valor total de conversões"
          accentColor="#10b981"
        />
        <KpiCard
          label="ROAS Geral"
          value={`${(summary?.roas || 0).toFixed(2)}x`}
          subtext="Retorno sobre investimento"
          accentColor="#a855f7"
        />
        <KpiCard
          label="Conversões Totais"
          value={formatNumber(summary?.conversions || 0)}
          subtext={`CPA Médio: ${formatCurrency(summary?.cpa || 0)}`}
          accentColor="#f59e0b"
        />
        <KpiCard
          label="Cliques no Link"
          value={formatNumber(summary?.clicks || 0)}
          subtext={`CPC Médio: ${formatCurrency(summary?.cpc || 0)}`}
          accentColor="#06b6d4"
        />
        <KpiCard
          label="Impressões"
          value={formatNumber(summary?.impressions || 0)}
          subtext={`CTR Médio: ${(summary?.ctr || 0).toFixed(2)}%`}
          accentColor="#ec4899"
        />
      </div>

      {/* PLATFORM BREAKDOWN (META VS GOOGLE) */}
      <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '32px 0 16px 0' }}>
        Desempenho por Plataforma
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        {/* META ADS CARD */}
        <div
          style={{
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderTop: '4px solid #1877f2',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🔵</span>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Meta Ads</h3>
            </div>
            <span
              style={{
                fontSize: '12px',
                color: '#94a3b8',
                background: '#1e293b',
                padding: '3px 8px',
                borderRadius: '4px',
              }}
            >
              Facebook & Instagram
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginTop: '18px',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Investimento</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
                {formatCurrency(metaData?.spend || 0)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Faturamento</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#10b981' }}>
                {formatCurrency(metaData?.conversionValue || 0)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>ROAS</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#a855f7' }}>
                {(metaData?.roas || 0).toFixed(2)}x
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Conversões</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#f59e0b' }}>
                {formatNumber(metaData?.conversions || 0)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>CPA Médio</div>
              <div style={{ fontSize: '14px', color: '#cbd5e1' }}>
                {formatCurrency(metaData?.cpa || 0)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Cliques (CPC)</div>
              <div style={{ fontSize: '14px', color: '#cbd5e1' }}>
                {formatNumber(metaData?.clicks || 0)} ({formatCurrency(metaData?.cpc || 0)})
              </div>
            </div>
          </div>
        </div>

        {/* GOOGLE ADS CARD */}
        <div
          style={{
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderTop: '4px solid #ea4335',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🔴</span>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Google Ads</h3>
            </div>
            <span
              style={{
                fontSize: '12px',
                color: '#94a3b8',
                background: '#1e293b',
                padding: '3px 8px',
                borderRadius: '4px',
              }}
            >
              Search & PMax
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginTop: '18px',
            }}
          >
            <div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Investimento</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#f8fafc' }}>
                {formatCurrency(googleData?.spend || 0)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Faturamento</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#10b981' }}>
                {formatCurrency(googleData?.conversionValue || 0)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>ROAS</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#a855f7' }}>
                {(googleData?.roas || 0).toFixed(2)}x
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Conversões</div>
              <div style={{ fontSize: '16px', fontWeight: 600, color: '#f59e0b' }}>
                {formatNumber(googleData?.conversions || 0)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>CPA Médio</div>
              <div style={{ fontSize: '14px', color: '#cbd5e1' }}>
                {formatCurrency(googleData?.cpa || 0)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Cliques (CPC)</div>
              <div style={{ fontSize: '14px', color: '#cbd5e1' }}>
                {formatNumber(googleData?.clicks || 0)} ({formatCurrency(googleData?.cpc || 0)})
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CAMPAIGNS TABLE */}
      <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '32px 0 16px 0' }}>
        Detalhamento de Campanhas
      </h2>
      <div
        style={{
          background: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: '12px',
          overflowX: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#1e293b', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
              <th style={{ padding: '14px 16px' }}>Plataforma</th>
              <th style={{ padding: '14px 16px' }}>Campanha</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Investido</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Cliques</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Conversões</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>CPA</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>ROAS</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                  Nenhum dado registrado para o período selecionado.
                </td>
              </tr>
            ) : (
              campaigns.map((c) => {
                const cSpend = Number(c.spend || 0);
                const cConv = Number(c.conversions || 0);
                const cVal = Number(c.conversion_value || 0);
                const cpa = cConv > 0 ? cSpend / cConv : 0;
                const roas = cSpend > 0 ? cVal / cSpend : 0;

                return (
                  <tr
                    key={c.id}
                    style={{
                      borderBottom: '1px solid #1e293b',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 600,
                          fontSize: '12px',
                          color: c.platform === 'meta' ? '#38bdf8' : '#f87171',
                          background: c.platform === 'meta' ? '#0369a122' : '#991b1b22',
                          padding: '4px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        {c.platform === 'meta' ? '🔵 Meta' : '🔴 Google'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#f1f5f9' }}>
                      {c.campaign_name}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#10b981',
                          background: '#10b98122',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 700 }}>
                      {formatCurrency(cSpend)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: '#cbd5e1' }}>
                      {formatNumber(c.clicks)}
                    </td>
                    <td
                      style={{
                        padding: '14px 16px',
                        textAlign: 'right',
                        fontWeight: 600,
                        color: '#f59e0b',
                      }}
                    >
                      {formatNumber(cConv)}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', color: '#cbd5e1' }}>
                      {formatCurrency(cpa)}
                    </td>
                    <td
                      style={{
                        padding: '14px 16px',
                        textAlign: 'right',
                        fontWeight: 700,
                        color: roas >= 2 ? '#10b981' : roas > 0 ? '#a855f7' : '#64748b',
                      }}
                    >
                      {roas > 0 ? `${roas.toFixed(2)}x` : '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL SCRIPT DO GOOGLE ADS */}
      {showScriptModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '700px',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
                Script para Google Ads (Copie e Cole)
              </h2>
              <button
                onClick={() => setShowScriptModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '20px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.5', margin: '14px 0' }}>
              1. Acesse a conta de Google Ads do cliente.<br />
              2. Vá em <strong>Ferramentas e Configurações &gt; Ações em massa &gt; Scripts</strong>.<br />
              3. Crie um novo script, cole o código abaixo e altere o <code>ENDPOINT</code> para o seu link da Vercel.<br />
              4. Clique em <strong>Autorizar</strong> e configure para rodar <strong>de hora em hora</strong>.
            </p>

            <pre
              style={{
                background: '#020617',
                border: '1px solid #1e293b',
                padding: '16px',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#38bdf8',
                overflowX: 'auto',
                fontFamily: 'monospace',
                maxHeight: '280px',
              }}
            >
              {googleScriptCode}
            </pre>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(googleScriptCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2500);
                }}
                style={{
                  background: copied ? '#10b981' : '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {copied ? '✓ Copiado para Área de Transferência!' : 'Copiar Código do Script'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  subtext,
  accentColor,
}: {
  label: string;
  value: string;
  subtext: string;
  accentColor: string;
}) {
  return (
    <div
      style={{
        background: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '12px',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '4px',
          height: '100%',
          background: accentColor,
        }}
      />
      <div style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 500 }}>{label}</div>
      <div
        style={{
          fontSize: '24px',
          fontWeight: 800,
          color: '#f8fafc',
          margin: '6px 0 4px 0',
          letterSpacing: '-0.5px',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: '12px', color: '#64748b' }}>{subtext}</div>
    </div>
  );
}

