from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.genie import run_sql

router_dashboard = APIRouter(prefix="/dashboard", tags=["dashboard"])

# Queries fixas — batem direto no warehouse, sem Genie
QUERIES = {
    "clientes_ativos": """
        SELECT COUNT(DISTINCT `CNPJ_BASICO`) AS total
        FROM `discovery`.`dw_silver`.`fato_estabelecimento`
        WHERE `SITUACAO_CADASTRAL` = '02'
          AND `CNPJ_BASICO` IS NOT NULL
    """,

    "cnae_comum": """
        SELECT c.CODIGO AS codigo_cnae, c.DESCRICAO AS nome_atividade
        FROM discovery.dw_silver.fato_estabelecimento e
        JOIN discovery.dw_silver.dim_cnae c
          ON CAST(e.CNAE_FISCAL_PRINCIPAL AS INT) = c.CODIGO
        WHERE e.SITUACAO_CADASTRAL = '02'
          AND e.CNAE_FISCAL_PRINCIPAL IS NOT NULL
        GROUP BY c.CODIGO, c.DESCRICAO
        ORDER BY COUNT(*) DESC
        LIMIT 1
    """,

    "regioes": """
        SELECT
          CASE
            WHEN `UF` IN ('AC','AP','AM','PA','RO','RR','TO') THEN 'Norte'
            WHEN `UF` IN ('AL','BA','CE','MA','PB','PE','PI','RN','SE') THEN 'Nordeste'
            WHEN `UF` IN ('DF','GO','MT','MS') THEN 'Centro-Oeste'
            WHEN `UF` IN ('ES','MG','RJ','SP') THEN 'Sudeste'
            WHEN `UF` IN ('PR','RS','SC') THEN 'Sul'
            ELSE 'Desconhecida'
          END AS Regiao,
          COUNT(DISTINCT `CNPJ_BASICO`) AS Quantidade
        FROM `discovery`.`dw_silver`.`fato_estabelecimento`
        WHERE `SITUACAO_CADASTRAL` = '02'
          AND `UF` IS NOT NULL
        GROUP BY Regiao
        ORDER BY Regiao
    """,

    "top5_uf": """
            SELECT `UF`, COUNT(*) AS clientes_ativos
            FROM `discovery`.`dw_silver`.`fato_estabelecimento`
            WHERE `SITUACAO_CADASTRAL` = '02'
            AND `UF` IS NOT NULL
            GROUP BY `UF`
            ORDER BY clientes_ativos DESC
            LIMIT 5
    """,
}


class KpiResponse(BaseModel):
    id: str
    label: str
    value: str
    type: str
    error: bool = False


def _run(sql: str, limit: int = 100) -> list[dict]:
    """Executa query sem o wrapper LIMIT do run_sql padrão quando limit=None."""
    from services.genie import run_sql
    return run_sql(sql, limit=limit)


@router_dashboard.get("", response_model=list[KpiResponse])
def get_dashboard():
    results = []

    # ── Clientes ativos ──────────────────────
    try:
        rows = run_sql(QUERIES["clientes_ativos"], limit=1)
        total = int(float(list(rows[0].values())[0])) if rows else 0
        results.append(KpiResponse(
            id="clientes_ativos",
            label="Clientes ativos",
            value=f"{total:,}".replace(",", "."),
            type="kpi",
        ))
    except Exception as e:
        results.append(KpiResponse(id="clientes_ativos", label="Clientes ativos",
                                   value="Erro ao carregar", type="kpi", error=True))

    # ── CNAE mais comum ──────────────────────
    try:
        rows = run_sql(QUERIES["cnae_comum"], limit=1)
        if rows:
            row = rows[0]
            value = f"{row.get('codigo_cnae')} — {row.get('nome_atividade')}"
        else:
            value = "Sem dados"
        results.append(KpiResponse(
            id="cnae_comum",
            label="CNAE mais comum",
            value=value,
            type="kpi",
        ))
    except Exception as e:
        results.append(KpiResponse(id="cnae_comum", label="CNAE mais comum",
                                   value="Erro ao carregar", type="kpi", error=True))

    # ── Clientes por região ──────────────────
    try:
        rows = run_sql(QUERIES["regioes"], limit=10)
        # Serializa como "Regiao:Quantidade" separado por pipe para o front parsear
        value = "|".join(f"{r.get('Regiao')}:{r.get('Quantidade')}" for r in rows)
        results.append(KpiResponse(
            id="regioes",
            label="Clientes por região",
            value=value,
            type="chart_pie",
        ))
    except Exception as e:
        results.append(KpiResponse(id="regioes", label="Clientes por região",
                                   value="Erro ao carregar", type="chart_pie", error=True))

    # ── Top 5 UFs ────────────────────────────
    try:
        rows = run_sql(QUERIES["top5_uf"], limit=5)
        value = "|".join(f"{r.get('UF')}:{r.get('clientes_ativos')}" for r in rows)
        results.append(KpiResponse(
            id="top5_uf",
            label="Top 5 estados",
            value=value,
            type="chart_bar",
        ))
    except Exception as e:
        results.append(KpiResponse(id="top5_uf", label="Top 5 estados",
                                   value="Erro ao carregar", type="chart_bar", error=True))

    return results
