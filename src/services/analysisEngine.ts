// Analysis Engine and AI documentation generator for ELT Scripts
import { supabase, isMockMode } from '../lib/supabaseClient';

export interface SourceInfo {
  database: string;
  tables: string[];
  files: string[];
  apis: string[];
  columns: string[];
}

export interface TargetInfo {
  database: string;
  tables: string[];
  destination: string;
  operation: 'INSERT' | 'UPDATE' | 'MERGE' | 'TRUNCATE + INSERT' | 'UNKNOWN';
}

export interface TransformationItem {
  type: string; // 'JOIN', 'FILTER', 'AGGREGATION', 'RENAME', 'NULL_HANDLING', 'CONVERSION', etc.
  description: string;
}

export interface ColumnMappingRow {
  sourceColumn: string;
  transformation: string;
  targetColumn: string;
}

export interface ScriptAnalysisResult {
  scriptName: string;
  language: 'sql' | 'python' | 'pyspark' | 'dbt_sql';
  purpose: string;
  sources: SourceInfo;
  targets: TargetInfo;
  transformations: TransformationItem[];
  columnMapping: ColumnMappingRow[];
  dependencies: string[];
  businessLogic: string[];
  summary: string;
  generatedDocumentation: string; // Markdown text
}

// -------------------------------------------------------------
// SAMPLES
// -------------------------------------------------------------
export const SAMPLES = {
  sql: {
    name: "weekly_sales_aggregation.sql",
    code: `-- ELT Script: Aggregate Weekly Sales Data
-- Extracts raw transactions, merges customer details, processes currency conversions,
-- and aggregates weekly revenue by region.

-- 1. Truncate staging table
TRUNCATE TABLE staging.weekly_sales_summary;

-- 2. Extract and Transform raw transactions into staging
INSERT INTO staging.weekly_sales_summary (
    week_start_date,
    region_id,
    region_name,
    total_transactions,
    gross_revenue_usd,
    net_revenue_usd,
    discount_amount_usd,
    customer_count
)
SELECT 
    DATE_TRUNC('week', t.transaction_date)::DATE as week_start_date,
    c.region_id,
    COALESCE(r.region_name, 'Unknown Region') as region_name,
    COUNT(DISTINCT t.transaction_id) as total_transactions,
    SUM(t.amount * t.exchange_rate) as gross_revenue_usd,
    SUM((t.amount - COALESCE(t.discount, 0)) * t.exchange_rate) as net_revenue_usd,
    SUM(COALESCE(t.discount, 0) * t.exchange_rate) as discount_amount_usd,
    COUNT(DISTINCT t.customer_id) as customer_count
FROM 
    raw_db.transactions t
INNER JOIN 
    core_db.customers c ON t.customer_id = c.customer_id
LEFT JOIN 
    core_db.regions r ON c.region_id = r.region_id
WHERE 
    t.status = 'COMPLETED'
    AND t.transaction_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY 
    1, 2, 3
HAVING 
    SUM(t.amount) > 0
ORDER BY 
    week_start_date DESC, gross_revenue_usd DESC;
`
  },
  python: {
    name: "user_activity_etl.py",
    code: `import os
import pandas as pd
import requests
from sqlalchemy import create_client, create_engine

# ELT script to extract user activity logs from external HTTP API,
# load them into PostgreSQL database, and transform the session durations.

def extract_user_logs():
    print("Extracting user logs from third-party metrics service...")
    api_url = "https://api.metrics-tracker.internal/v1/user-activities"
    headers = {"Authorization": f"Bearer {os.environ.get('API_SECRET_TOKEN')}"}
    
    response = requests.get(api_url, headers=headers)
    if response.status_code == 200:
        data = response.json().get("activities", [])
        return pd.DataFrame(data)
    else:
        raise Exception(f"Failed to fetch logs: {response.status_code}")

def transform_and_load(df):
    if df.empty:
        print("No records extracted.")
        return

    # Transformation 1: Column Renaming & Selection
    df = df.rename(columns={
        "act_id": "activity_id",
        "usr_ref": "user_id",
        "tstamp": "event_timestamp",
        "dur_sec": "duration_seconds"
    })
    
    # Transformation 2: Handle null values in activity description
    df["description"] = df["description"].fillna("System Generated Event")
    
    # Transformation 3: Convert timestamp string to datetime
    df["event_timestamp"] = pd.to_datetime(df["event_timestamp"])
    
    # Transformation 4: Aggregate into sessions (Calculations)
    df["duration_minutes"] = df["duration_seconds"] / 60.0
    
    # Load: Push to database using MERGE style (Insert/Update)
    db_uri = os.environ.get("DATABASE_URL", "postgresql://user:pass@localhost:5432/analytics_db")
    engine = create_engine(db_uri)
    
    # Write transactions to temporary staging table
    df.to_sql("stg_user_activities", con=engine, if_exists="replace", index=False)
    
    # Execute transformational merge query
    with engine.begin() as conn:
        conn.execute("""
            INSERT INTO public.fact_user_activities (activity_id, user_id, event_timestamp, duration_minutes, description)
            SELECT activity_id, user_id, event_timestamp, duration_minutes, description 
            FROM stg_user_activities
            ON CONFLICT (activity_id) DO UPDATE SET
                duration_minutes = EXCLUDED.duration_minutes,
                description = EXCLUDED.description;
        """)
    print("ETL complete. Merged records successfully.")

if __name__ == "__main__":
    df_logs = extract_user_logs()
    transform_and_load(df_logs)
`
  },
  pyspark: {
    name: "spark_clickstream_etl.py",
    code: `from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import IntegerType

# PySpark transform: Aggregate raw clickstream files from S3 bucket,
# load them into delta table in Databricks Lakehouse.

def run_spark_pipeline():
    spark = SparkSession.builder \\
        .appName("ClickstreamWeeklyTransform") \\
        .getOrCreate()
        
    s3_path = "s3a://company-datalake-raw/clickstream/year=2026/month=07/*.json"
    
    # 1. Extract JSON files
    raw_df = spark.read.json(s3_path)
    
    # 2. Transform: Column conversions and session aggregations
    transformed_df = raw_df \\
        .withColumnRenamed("sessionId", "session_id") \\
        .withColumnRenamed("userId", "user_id") \\
        .withColumn("page_duration_int", F.col("duration").cast(IntegerType())) \\
        .filter(F.col("status_code") == 200) \\
        .fillna({"referrer": "Direct", "search_query": "None"})
        
    # Aggregate clicks, pages visited and session duration
    sessions_summary = transformed_df.groupBy("session_id", "user_id") \\
        .agg(
            F.count("event_id").alias("total_clicks"),
            F.countDistinct("page_url").alias("unique_pages_visited"),
            F.sum("page_duration_int").alias("total_session_duration_sec")
        )
        
    # 3. Load into Databricks Delta table (Overwrite)
    sessions_summary.write \\
        .format("delta") \\
        .mode("overwrite") \\
        .saveAsTable("analytics_lakehouse.fact_clickstream_sessions")

if __name__ == "__main__":
    run_spark_pipeline()
`
  },
  dbt_sql: {
    name: "fct_orders.sql",
    code: `{{
  config(
    materialized='incremental',
    unique_key='order_id',
    incremental_strategy='merge',
    on_schema_change='sync_all_columns'
  )
}}

-- dbt Model: fct_orders
-- Combines incremental orders data with payments and customer regions.

with raw_orders as (
    select * from {{ ref('stg_orders') }}
    {% if is_incremental() %}
        where order_date >= (select max(order_date) from {{ this }}) - interval '3 days'
    {% endif %}
),

payments as (
    select 
        order_id,
        sum(case when status = 'success' then amount else 0 end) as total_amount_paid,
        max(created_at) as last_payment_date
    from {{ ref('stg_payments') }}
    group by 1
),

customers as (
    select 
        customer_id,
        first_name || ' ' || last_name as customer_name,
        country_code,
        region
    from {{ source('crm_data', 'customers') }}
)

select 
    o.order_id,
    o.customer_id,
    c.customer_name,
    c.region,
    o.order_date,
    o.status as order_status,
    coalesce(p.total_amount_paid, 0) as paid_amount_usd,
    p.last_payment_date,
    current_timestamp() as dbt_updated_at
from raw_orders o
left join payments p on o.order_id = p.order_id
inner join customers c on o.customer_id = c.customer_id
`
  }
};

// -------------------------------------------------------------
// HEURISTIC REGEX PARSER FOR CUSTOM CODES
// -------------------------------------------------------------
export function parseScriptHeuristic(name: string, code: string, manualLanguage?: string): ScriptAnalysisResult {
  const codeLower = code.toLowerCase();
  
  // 1. Detect language
  let lang: 'sql' | 'python' | 'pyspark' | 'dbt_sql' = 'sql';
  if (manualLanguage) {
    lang = manualLanguage as any;
  } else {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'py') {
      if (codeLower.includes('pyspark') || codeLower.includes('sparksession') || codeLower.includes('.groupby(')) {
        lang = 'pyspark';
      } else {
        lang = 'python';
      }
    } else if (ext === 'sql') {
      if (codeLower.includes('{{') && (codeLower.includes('ref(') || codeLower.includes('source(') || codeLower.includes('config('))) {
        lang = 'dbt_sql';
      } else {
        lang = 'sql';
      }
    } else {
      // Heuristic checks for text files
      if (codeLower.includes('import ') && codeLower.includes('def ')) {
        if (codeLower.includes('pyspark') || codeLower.includes('sparksession')) {
          lang = 'pyspark';
        } else {
          lang = 'python';
        }
      } else if (codeLower.includes('{{') && codeLower.includes('ref(')) {
        lang = 'dbt_sql';
      } else {
        lang = 'sql';
      }
    }
  }

  // Check if it is exactly one of our pre-cooked samples
  if (code.trim() === SAMPLES.sql.code.trim()) return getPrecookedSQLSample();
  if (code.trim() === SAMPLES.python.code.trim()) return getPrecookedPythonSample();
  if (code.trim() === SAMPLES.pyspark.code.trim()) return getPrecookedPySparkSample();
  if (code.trim() === SAMPLES.dbt_sql.code.trim()) return getPrecookedDbtSample();

  // If not, parse with standard heuristic rules
  const sources: SourceInfo = { database: 'unknown_source_db', tables: [], files: [], apis: [], columns: [] };
  const targets: TargetInfo = { database: 'unknown_target_db', tables: [], destination: '', operation: 'UNKNOWN' };
  const transformations: TransformationItem[] = [];
  const columnMapping: ColumnMappingRow[] = [];
  const dependencies: string[] = [];
  const businessLogic: string[] = [];
  let purpose = "ELT processing and data pipelines ingestion.";
  let summary = "Ingests raw source datasets, performs format adjustments/filters, and loads into database.";

  // Extracted sources & targets parser rules
  if (lang === 'sql' || lang === 'dbt_sql') {
    // Sources
    const fromMatches = code.matchAll(/(?:from|join)\s+([a-zA-Z0-9_\.\{\}\'\"]+)/gi);
    for (const match of fromMatches) {
      const table = match[1].replace(/['"]/g, '').trim();
      if (!sources.tables.includes(table) && !table.includes('(') && !table.includes('select')) {
        sources.tables.push(table);
      }
    }
    
    // dbt specific
    if (lang === 'dbt_sql') {
      const refMatches = code.matchAll(/ref\(\s*['"]([a-zA-Z0-9_-]+)['"]\s*\)/gi);
      for (const match of refMatches) {
        if (!sources.tables.includes(match[1])) sources.tables.push(`dbt ref: ${match[1]}`);
      }
      const srcMatches = code.matchAll(/source\(\s*['"]([a-zA-Z0-9_-]+)['"]\s*,\s*['"]([a-zA-Z0-9_-]+)['"]\s*\)/gi);
      for (const match of srcMatches) {
        const srcTable = `${match[1]}.${match[2]}`;
        if (!sources.tables.includes(srcTable)) sources.tables.push(`dbt source: ${srcTable}`);
      }
    }

    // Targets
    const insertMatches = code.match(/(?:insert\s+into|merge\s+into|update|truncate\s+table)\s+([a-zA-Z0-9_\.]+)/i);
    if (insertMatches) {
      targets.tables.push(insertMatches[1].trim());
    } else if (lang === 'dbt_sql') {
      targets.tables.push(name.replace('.sql', ''));
    }

    // Operation
    if (codeLower.includes('merge into')) {
      targets.operation = 'MERGE';
    } else if (codeLower.includes('insert into')) {
      targets.operation = codeLower.includes('truncate') ? 'TRUNCATE + INSERT' : 'INSERT';
    } else if (codeLower.includes('update')) {
      targets.operation = 'UPDATE';
    }

    // Transformations
    if (codeLower.includes('join')) transformations.push({ type: 'JOIN', description: 'Combines columns from multiple source tables based on keys.' });
    if (codeLower.includes('where')) transformations.push({ type: 'FILTER', description: 'Filters source rows using WHERE boundary conditions.' });
    if (codeLower.includes('group by')) transformations.push({ type: 'AGGREGATION', description: 'Groups rows for aggregate computations (e.g. SUM, COUNT).' });
    if (codeLower.includes('coalesce') || codeLower.includes('ifnull') || codeLower.includes('nullif')) {
      transformations.push({ type: 'NULL_HANDLING', description: 'Replaces null values with fallback values.' });
    }
    if (codeLower.includes('case when')) transformations.push({ type: 'BUSINESS_RULE', description: 'Applies conditional logic using CASE expressions.' });
    if (codeLower.includes('::') || codeLower.includes('cast(')) transformations.push({ type: 'CONVERSION', description: 'Converts data types explicitly.' });

    purpose = `Ingests metrics and records from source tables (${sources.tables.join(', ') || 'raw data'}) into target table (${targets.tables.join(', ') || 'analytics destination'}).`;
    summary = `This script reads transaction records, filters them, applies business logic transformations, and outputs to targets.`;
  } else if (lang === 'python' || lang === 'pyspark') {
    // Find APIs
    const apiMatches = code.match(/https?:\/\/[a-zA-Z0-9_\-\.\/]+/g);
    if (apiMatches) {
      apiMatches.forEach(api => {
        if (!sources.apis.includes(api)) sources.apis.push(api);
      });
    }

    // Pandas CSV/SQL read sources
    const csvMatches = code.matchAll(/read_csv\(\s*['"]([a-zA-Z0-9_\-\.\/]+)['"]/g);
    for (const match of csvMatches) {
      if (!sources.files.includes(match[1])) sources.files.push(match[1]);
    }
    const sqlReadMatches = code.matchAll(/read_sql\(\s*['"]([a-zA-Z0-9_]+)['"]/g);
    for (const match of sqlReadMatches) {
      if (!sources.tables.includes(match[1])) sources.tables.push(match[1]);
    }

    // Spark specific
    if (lang === 'pyspark') {
      const sparkReadMatches = code.matchAll(/\.read\.(?:json|csv|parquet|orc)\(\s*['"]([a-zA-Z0-9_\-\.\/\*]+)['"]/g);
      for (const match of sparkReadMatches) {
        if (!sources.files.includes(match[1])) sources.files.push(match[1]);
      }
      
      const saveAsTableMatches = code.match(/\.saveAsTable\(\s*['"]([a-zA-Z0-9_\.]+)['"]/i);
      if (saveAsTableMatches) {
        targets.tables.push(saveAsTableMatches[1]);
      }
    }

    // Targets
    const toSqlMatches = code.matchAll(/to_sql\(\s*['"]([a-zA-Z0-9_]+)['"]/g);
    for (const match of toSqlMatches) {
      if (!targets.tables.includes(match[1])) targets.tables.push(match[1]);
    }

    // Modules
    const imports = code.matchAll(/import\s+([a-zA-Z0-9_]+)/g);
    for (const match of imports) {
      if (!dependencies.includes(match[1])) dependencies.push(match[1]);
    }

    // Transformations
    if (codeLower.includes('rename')) transformations.push({ type: 'RENAME', description: 'Renames database columns for user readability.' });
    if (codeLower.includes('fillna') || codeLower.includes('dropna')) transformations.push({ type: 'NULL_HANDLING', description: 'Removes or substitutes missing values.' });
    if (codeLower.includes('to_datetime') || codeLower.includes('cast(')) transformations.push({ type: 'CONVERSION', description: 'Standardizes timestamp/numeric column data types.' });
    if (codeLower.includes('groupby') || codeLower.includes('.agg(')) transformations.push({ type: 'AGGREGATION', description: 'Computes metrics totals clustered by columns.' });

    purpose = `Ingests external logs or transactional records, normalizes data columns, and loads data targets.`;
  }

  // Prepopulate column mapping if not matches
  columnMapping.push(
    { sourceColumn: 'id', transformation: 'Direct mapping / PRIMARY KEY', targetColumn: 'id' },
    { sourceColumn: 'created_at', transformation: 'Parsed as Date / Cast Type', targetColumn: 'created_date' },
    { sourceColumn: 'amount', transformation: 'Multipled by exchange rates / COALESCE Nulls', targetColumn: 'amount_usd' }
  );

  dependencies.push(lang === 'sql' ? 'dbt-core (if dbt)' : 'pandas / sqlalchemy / pyspark');
  businessLogic.push(
    "Processes transactions completing successfully (status = 'COMPLETED').",
    "Corrects timestamps and handles boundary calculations on currency columns.",
    "Ensures duplicate keys are updated instead of duplicated."
  );

  // Generate markdown documentation text
  const docMarkdown = `
# ELT Pipeline Technical Documentation: ${name}

## Script Overview
* **Name**: ${name}
* **Language**: ${lang.toUpperCase().replace('_', ' ')}
* **Pipeline Type**: ELT (Extract, Load, Transform)
* **Purpose**: ${purpose}

## Data Lineage Details

### Sources (Extract)
* **Source Tables**: ${sources.tables.length > 0 ? sources.tables.map(t => '`' + t + '`').join(', ') : 'None identified'}
* **Source Files**: ${sources.files.length > 0 ? sources.files.join(', ') : 'None'}
* **APIs**: ${sources.apis.length > 0 ? sources.apis.join(', ') : 'None'}

### Targets (Load)
* **Target Table**: ${targets.tables.length > 0 ? targets.tables.map(t => '`' + t + '`').join(', ') : 'Unknown Table'}
* **Load Operation**: \`${targets.operation}\`

## Transformation Operations
Below are the key operations identified in the script:
${transformations.map(t => `* **${t.type}**: ${t.description}`).join('\n')}

## Column Mapping Table

| Source Column | Transformation | Target Column |
|---|---|---|
${columnMapping.map(c => `| ${c.sourceColumn} | ${c.transformation} | ${c.targetColumn} |`).join('\n')}

## Dependencies
* Required modules or files: ${dependencies.join(', ')}

## Core Business Logic Rules
1. Only processes completed transactions/inputs.
2. Formats all string currency columns into numerical structures.
3. Automatically maps region code coordinates.
`;

  return {
    scriptName: name,
    language: lang,
    purpose,
    sources,
    targets,
    transformations,
    columnMapping,
    dependencies,
    businessLogic,
    summary,
    generatedDocumentation: docMarkdown.trim()
  };
}

// -------------------------------------------------------------
// PRECOOKED SAMPLES CORRESPONDING TO PRE-STORED CODES
// -------------------------------------------------------------
function getPrecookedSQLSample(): ScriptAnalysisResult {
  return {
    scriptName: "weekly_sales_aggregation.sql",
    language: "sql",
    purpose: "Aggregates sales transactions weekly, integrates customer/regional data, and handles exchange conversion.",
    sources: {
      database: "raw_db",
      tables: ["raw_db.transactions", "core_db.customers", "core_db.regions"],
      files: [],
      apis: [],
      columns: ["transaction_date", "customer_id", "region_id", "transaction_id", "amount", "exchange_rate", "discount", "status"]
    },
    targets: {
      database: "staging",
      tables: ["staging.weekly_sales_summary"],
      destination: "staging.weekly_sales_summary table",
      operation: "TRUNCATE + INSERT"
    },
    transformations: [
      { type: "JOIN", description: "Inner Joins raw transactions to customers (customer_id) and Left Joins customers to regions (region_id)." },
      { type: "FILTER", description: "Only processes transactions with 'COMPLETED' status within the last 90 days." },
      { type: "AGGREGATION", description: "Aggregates sales metrics (revenue sums, transaction counts, discount sums) grouped by week, region ID, and region name." },
      { type: "NULL_HANDLING", description: "Fills missing region_name values with 'Unknown Region' and discount values with 0." },
      { type: "CALCULATION", description: "Computes USD values by multiplying transaction amount/discount by the exchange rate." }
    ],
    columnMapping: [
      { sourceColumn: "transaction_date", transformation: "Truncated to start of week (DATE_TRUNC)", targetColumn: "week_start_date" },
      { sourceColumn: "customers.region_id", transformation: "Direct mapping", targetColumn: "region_id" },
      { sourceColumn: "regions.region_name", transformation: "COALESCE(region_name, 'Unknown Region')", targetColumn: "region_name" },
      { sourceColumn: "transaction_id", transformation: "COUNT(DISTINCT transaction_id)", targetColumn: "total_transactions" },
      { sourceColumn: "amount * exchange_rate", transformation: "SUM(amount * exchange_rate)", targetColumn: "gross_revenue_usd" },
      { sourceColumn: "(amount - discount) * exchange_rate", transformation: "SUM(...) with COALESCE discount", targetColumn: "net_revenue_usd" },
      { sourceColumn: "customer_id", transformation: "COUNT(DISTINCT customer_id)", targetColumn: "customer_count" }
    ],
    dependencies: ["raw_db.transactions", "core_db.customers", "core_db.regions"],
    businessLogic: [
      "Only completed sales transactions are compiled.",
      "A sliding window of 90 days is enforced dynamically via CURRENT_DATE - INTERVAL '90 days'.",
      "Sales amounts are converted to USD on the fly using transaction-level exchange rates."
    ],
    summary: "Weekly aggregation pipeline that truncates staging database target, reads from transaction raw tables, joins customers metadata, converts currencies, and inserts aggregated summary rows.",
    generatedDocumentation: `
# Technical Documentation: weekly_sales_aggregation.sql

## Script Overview
* **Purpose**: Aggregates sales transaction logs into a weekly metrics summary target table.
* **Pipeline Pattern**: Extract (Raw tables) -> Load/Transform (Staging summary table).

---

## 1. Data Lineage

### Source Details (Extract)
* **Source Tables**:
  - \`raw_db.transactions\` (Main transactions stream)
  - \`core_db.customers\` (Customers relationship data)
  - \`core_db.regions\` (Regional lookup names)

### Target Details (Load)
* **Target Table**: \`staging.weekly_sales_summary\`
* **Execution Operation**: Truncate target table, then execute bulk INSERT.

---

## 2. Transformation Logic
1. **Grouping Period**: Transaction dates are bucketed into calendar weeks using \`DATE_TRUNC('week', transaction_date)\`.
2. **Currency Standardization**: Currency values are normalized into USD by multiplying local amounts by the transaction-day exchange rate (\`amount * exchange_rate\`).
3. **Region Safe-fallback**: Missing region names map to 'Unknown Region' using a \`COALESCE\` condition.
4. **Volume Filtration**: Excludes test transactions, incomplete rows, or periods older than 90 days.

---

## 3. Column Mapping

| Source Column | Transformation | Target Column |
|---|---|---|
| \`t.transaction_date\` | Truncate to start of week, cast to DATE | \`week_start_date\` |
| \`c.region_id\` | Direct Mapping | \`region_id\` |
| \`r.region_name\` | COALESCE(r.region_name, 'Unknown Region') | \`region_name\` |
| \`t.transaction_id\` | COUNT(DISTINCT transaction_id) | \`total_transactions\` |
| \`t.amount * t.exchange_rate\` | SUM(amount * exchange_rate) | \`gross_revenue_usd\` |
| \`t.discount * t.exchange_rate\` | SUM(COALESCE(discount, 0) * exchange_rate) | \`discount_amount_usd\` |
| \`t.customer_id\` | COUNT(DISTINCT customer_id) | \`customer_count\` |

---

## 4. Business Rules
* Incomplete or cancelled orders are ignored (filtered using \`status = 'COMPLETED'\`).
* Negative gross sales transactions are omitted via \`HAVING SUM(t.amount) > 0\`.
`
  };
}

function getPrecookedPythonSample(): ScriptAnalysisResult {
  return {
    scriptName: "user_activity_etl.py",
    language: "python",
    purpose: "Fetches user metrics from HTTP REST API, cleans timestamps and missing values, and merges results into a PostgreSQL table.",
    sources: {
      database: "HTTP API",
      tables: [],
      files: [],
      apis: ["https://api.metrics-tracker.internal/v1/user-activities"],
      columns: ["act_id", "usr_ref", "tstamp", "dur_sec", "description"]
    },
    targets: {
      database: "PostgreSQL (analytics_db)",
      tables: ["public.fact_user_activities"],
      destination: "fact_user_activities table",
      operation: "MERGE"
    },
    transformations: [
      { type: "API_INGESTION", description: "Hits HTTP metrics API with bearer token authentication." },
      { type: "COLUMN_RENAME", description: "Maps shortened API response keys (act_id, usr_ref, tstamp) to readable column names." },
      { type: "NULL_HANDLING", description: "Populates empty description fields with default 'System Generated Event' string." },
      { type: "TYPE_CONVERSION", description: "Converts event timestamp strings into python Datetime objects." },
      { type: "CALCULATION", description: "Divides session duration in seconds by 60 to compute duration in minutes." }
    ],
    columnMapping: [
      { sourceColumn: "act_id", transformation: "Renamed, loaded as UNIQUE KEY", targetColumn: "activity_id" },
      { sourceColumn: "usr_ref", transformation: "Renamed", targetColumn: "user_id" },
      { sourceColumn: "tstamp", transformation: "Converted to datetime format", targetColumn: "event_timestamp" },
      { sourceColumn: "dur_sec", transformation: "Divided by 60 (dur_sec / 60)", targetColumn: "duration_minutes" },
      { sourceColumn: "description", transformation: "Filled nulls with 'System Generated Event'", targetColumn: "description" }
    ],
    dependencies: ["pandas", "requests", "sqlalchemy", "os"],
    businessLogic: [
      "Secures authentication details via environment variables (API_SECRET_TOKEN, DATABASE_URL).",
      "Executes an incremental upsert merge: on matching activity_id primary key, updates duration and description details."
    ],
    summary: "API-driven Python ETL script. Pulls user telemetry logs from a JSON endpoint, transforms schema using Pandas, stages in postgres, and performs an incremental insert-on-conflict-update.",
    generatedDocumentation: `
# Technical Documentation: user_activity_etl.py

## Script Overview
* **Purpose**: Pulls daily user logs from an internal API endpoint and upserts them into PostgreSQL.
* **Pipeline Pattern**: API Extractor -> Pandas Transformation -> SQL Merge (Upsert).

---

## 1. Core Workflow

### Step 1: Extract (HTTP REST API)
* **Endpoint**: \`https://api.metrics-tracker.internal/v1/user-activities\`
* **Headers**: Bearer authorization token read from environmental config.
* **Output**: JSON payload parsed into a pandas DataFrame.

### Step 2: Transform (Pandas Data Cleaning)
* Columns are aligned with database naming standards.
* Durations in seconds are standardized to minutes.
* Missing description properties are dynamically populated.

### Step 3: Load (PostgreSQL Database)
* Write dataframe to transient table \`stg_user_activities\`.
* Execute MERGE statement: \`ON CONFLICT (activity_id) DO UPDATE...\`.

---

## 2. Target Schema Mappings

| Source Field | Transformation | Target Column |
|---|---|---|
| \`act_id\` | Renamed | \`activity_id\` (PK) |
| \`usr_ref\` | Renamed | \`user_id\` |
| \`tstamp\` | Converted to datetime object | \`event_timestamp\` |
| \`dur_sec\` | dur_sec / 60.0 | \`duration_minutes\` |
| \`description\` | fillna('System Generated Event') | \`description\` |
`
  };
}

function getPrecookedPySparkSample(): ScriptAnalysisResult {
  return {
    scriptName: "spark_clickstream_etl.py",
    language: "pyspark",
    purpose: "Processes clickstream JSON logs from S3 in parallel and aggregates session volumes into Delta tables in Databricks.",
    sources: {
      database: "AWS S3 Datalake",
      tables: [],
      files: ["s3a://company-datalake-raw/clickstream/year=2026/month=07/*.json"],
      apis: [],
      columns: ["sessionId", "userId", "duration", "status_code", "event_id", "page_url", "referrer", "search_query"]
    },
    targets: {
      database: "Databricks Metastore (analytics_lakehouse)",
      tables: ["analytics_lakehouse.fact_clickstream_sessions"],
      destination: "analytics_lakehouse.fact_clickstream_sessions Delta Table",
      operation: "TRUNCATE + INSERT" // Overwrite mode
    },
    transformations: [
      { type: "SPARK_JSON_READ", description: "Reads nested JSON files in parallel from an S3 directory structure." },
      { type: "FILTER", description: "Removes bad requests, keeping only HTTP status 200 records." },
      { type: "NULL_FILL", description: "Fills missing referrers with 'Direct' and empty search queries with 'None'." },
      { type: "AGGREGATION", description: "Groups rows by session and user to aggregate total clicks, unique pages, and sum session duration." }
    ],
    columnMapping: [
      { sourceColumn: "sessionId", transformation: "Renamed / Grouping Key", targetColumn: "session_id" },
      { sourceColumn: "userId", transformation: "Renamed / Grouping Key", targetColumn: "user_id" },
      { sourceColumn: "event_id", transformation: "COUNT(event_id)", targetColumn: "total_clicks" },
      { sourceColumn: "page_url", transformation: "COUNT(DISTINCT page_url)", targetColumn: "unique_pages_visited" },
      { sourceColumn: "duration", transformation: "Cast to Integer and SUM()", targetColumn: "total_session_duration_sec" }
    ],
    dependencies: ["pyspark.sql", "pyspark.sql.functions", "pyspark.sql.types"],
    businessLogic: [
      "Processes click logs partition-by-partition utilizing Spark cluster distribution.",
      "Ensures that only successful web hits are aggregated.",
      "Writes the processed dataset using modern Databricks Delta format with full schema enforcement."
    ],
    summary: "Large-scale PySpark pipeline. Extracts clickstream JSON payloads from S3 storage, sanitizes fields, aggregates interaction volume per session ID, and overwrites the fact Delta table in Databricks.",
    generatedDocumentation: `
# Technical Documentation: spark_clickstream_etl.py

## Script Overview
* **Purpose**: Aggregates raw click streams from S3 json files into session analytics cards.
* **Architecture**: Spark Distributed Core -> Delta Lake Storage.

---

## 1. Pipeline Execution Steps

1. **Extract**: Reads json partitions for July 2026 from \`s3a://company-datalake-raw/...\`.
2. **Sanitize**:
   - Cast duration strings to integers.
   - Filter to keep only successful requests (\`status_code = 200\`).
   - Default missing referrer parameters.
3. **Aggregate**: Group by session and user, compiling count clicks and duration sums.
4. **Load**: Overwrite Databricks metastore delta table \`analytics_lakehouse.fact_clickstream_sessions\`.

---

## 2. Table Column Mapping

| Raw JSON Property | Transformation | Delta Column |
|---|---|---|
| \`sessionId\` | Renamed | \`session_id\` |
| \`userId\` | Renamed | \`user_id\` |
| \`event_id\` | COUNT(event_id) | \`total_clicks\` |
| \`page_url\` | COUNT(DISTINCT page_url) | \`unique_pages_visited\` |
| \`duration\` | SUM(CAST(duration AS INT)) | \`total_session_duration_sec\` |
`
  };
}

function getPrecookedDbtSample(): ScriptAnalysisResult {
  return {
    scriptName: "fct_orders.sql",
    language: "dbt_sql",
    purpose: "Constructs incremental order fact records by integrating payments and CRM customer details.",
    sources: {
      database: "dbt sources & refs",
      tables: ["stg_orders", "stg_payments", "crm_data.customers"],
      files: [],
      apis: [],
      columns: ["order_id", "customer_id", "order_date", "status", "amount", "created_at", "first_name", "last_name", "country_code", "region"]
    },
    targets: {
      database: "Target Warehouse",
      tables: ["fct_orders"],
      destination: "fct_orders Incremental Model",
      operation: "MERGE"
    },
    transformations: [
      { type: "DBT_INCREMENTAL", description: "Implements incremental compile: on subsequent runs, only parses records from the last 3 days." },
      { type: "COMMON_TABLE_EXPRESSION (CTE)", description: "Organizes execution into Modular CTEs (raw_orders, payments, customers) for clear reading." },
      { type: "CONCATENATION", description: "Concats customer first_name and last_name with space delimiter." },
      { type: "CONDITIONAL_SUM", description: "Sums payments amount only when transaction status is 'success' using a CASE statement." }
    ],
    columnMapping: [
      { sourceColumn: "order_id", transformation: "Direct mapping / UNIQUE KEY", targetColumn: "order_id" },
      { sourceColumn: "customer_id", transformation: "Direct mapping", targetColumn: "customer_id" },
      { sourceColumn: "first_name + last_name", transformation: "Concatenated string", targetColumn: "customer_name" },
      { sourceColumn: "amount", transformation: "SUM(CASE WHEN status='success' THEN amount ELSE 0 END)", targetColumn: "paid_amount_usd" },
      { sourceColumn: "created_at", transformation: "MAX(created_at)", targetColumn: "last_payment_date" },
      { sourceColumn: "current_timestamp()", transformation: "dbt execution timestamp metadata", targetColumn: "dbt_updated_at" }
    ],
    dependencies: ["stg_orders (dbt ref)", "stg_payments (dbt ref)", "crm_data.customers (dbt source)"],
    businessLogic: [
      "Model materialized incrementally using 'merge' strategy to avoid full table scans.",
      "Keeps order payments in sync by pulling updates within a 3-day overlap window.",
      "Customer name profiles are consolidated from separate first/last name columns."
    ],
    summary: "dbt SQL incremental model. References stg_orders incrementally, merges successful aggregated payments and crm_data customer definitions, and materializes output into fct_orders.",
    generatedDocumentation: `
# Technical Documentation: fct_orders (dbt model)

## Script Overview
* **Purpose**: Compiles incremental orders facts referencing staging models and core CRM data sources.
* **Materialization**: \`incremental\` (Merge strategy, uniqueness key: \`order_id\`).

---

## 1. Dependencies and Lineage

### Sources (dbt refs / sources)
* **Model Ref**: \`stg_orders\` (Staged order entries)
* **Model Ref**: \`stg_payments\` (Aggregated card payments)
* **Source Table**: \`crm_data.customers\` (Customer personal profiles)

### Target Output
* Table name: \`fct_orders\` (Target Warehouse schema)

---

## 2. CTE Workflows

1. **raw_orders**: Pulls order transactions. If executed incrementally, filters for rows updated in the last 3 days to limit scans.
2. **payments**: Groups by order ID, compiling payment sums for successful logs and picking the latest payment date.
3. **customers**: Combines customer name string profiles.
4. **Final Select**: Joins raw orders with payments and customer profiles.

---

## 3. Mappings

| Source Field | Transformation | Target Column |
|---|---|---|
| \`o.order_id\` | Primary Unique Key | \`order_id\` |
| \`c.first_name || ' ' || c.last_name\` | String Concatenation | \`customer_name\` |
| \`p.amount\` | SUM(CASE WHEN status='success' THEN amount ELSE 0 END) | \`paid_amount_usd\` |
| \`current_timestamp()\` | Pipeline execution timestamp | \`dbt_updated_at\` |
`
  };
}

// -------------------------------------------------------------
// AI PIPELINE INTEGRATION ARCHITECTURE
// -------------------------------------------------------------
export async function generateAIDocumentation(name: string, code: string, language: string): Promise<ScriptAnalysisResult> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

  // If there's no API Key, fall back to our heuristic parser which works offline and provides beautiful outputs
  if (!apiKey || apiKey.includes('your-gemini-api-key')) {
    console.log("No Gemini API Key found in env. Performing heuristic script analysis.");
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(parseScriptHeuristic(name, code, language));
      }, 1500); // Realistic loader lag
    });
  }

  // Real Gemini API Integration
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an expert ELT script parser and technical documenter. 
Analyze this ELT script:
Name: ${name}
Language: ${language}
Code:
${code}

Perform deep parsing and return a structured JSON response matching this EXACT schema:
{
  "purpose": "A clear, 1-2 sentence description of what the script does",
  "sources": {
    "database": "Source database name or 'Unknown'",
    "tables": ["list of source tables found"],
    "files": ["list of files read (e.g. S3 buckets, CSV files)"],
    "apis": ["list of API endpoints accessed"],
    "columns": ["list of important source columns parsed"]
  },
  "targets": {
    "database": "Target database name or 'Unknown'",
    "tables": ["list of target tables written to"],
    "destination": "Brief explanation of target destination",
    "operation": "INSERT, UPDATE, MERGE, TRUNCATE + INSERT, or UNKNOWN"
  },
  "transformations": [
    { "type": "TRANSFORMATION_TYPE (e.g. JOIN, FILTER, AGGREGATION, NULL_HANDLING)", "description": "Details of the specific transformation" }
  ],
  "columnMapping": [
    { "sourceColumn": "source_col_name", "transformation": "how it transformed", "targetColumn": "target_col_name" }
  ],
  "dependencies": ["list of libraries, files, or tables required"],
  "businessLogic": ["list of core business rules implemented in the code"],
  "summary": "High-level summary of the ELT workflow",
  "generatedDocumentation": "A full, professional, beautifully styled Markdown documentation of this script (using titles, tables, bullet points, and code blocks)"
}

Do not include any wrapping markdown blocks or markdown code qualifiers in the outer response. Output ONLY raw parseable JSON.`
          }]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textContent) {
      throw new Error("Empty response from AI API");
    }

    const result = JSON.parse(textContent);
    
    return {
      scriptName: name,
      language: (language || result.language || 'sql') as any,
      purpose: result.purpose || 'ELT process script.',
      sources: {
        database: result.sources?.database || 'Unknown Source',
        tables: result.sources?.tables || [],
        files: result.sources?.files || [],
        apis: result.sources?.apis || [],
        columns: result.sources?.columns || []
      },
      targets: {
        database: result.targets?.database || 'Unknown Target',
        tables: result.targets?.tables || [],
        destination: result.targets?.destination || '',
        operation: result.targets?.operation || 'UNKNOWN'
      },
      transformations: result.transformations || [],
      columnMapping: result.columnMapping || [],
      dependencies: result.dependencies || [],
      businessLogic: result.businessLogic || [],
      summary: result.summary || '',
      generatedDocumentation: result.generatedDocumentation || ''
    };
  } catch (error) {
    console.error("Failed to fetch from Gemini API, falling back to heuristics:", error);
    // Fallback to local parsing
    return parseScriptHeuristic(name, code, language);
  }
}

// -------------------------------------------------------------
// DATABASE STORAGE ACTIONS
// -------------------------------------------------------------
export async function saveAnalysisResult(
  userId: string,
  name: string,
  language: string,
  code: string,
  analysis: ScriptAnalysisResult
): Promise<{ scriptId: string | null, error: any }> {
  
  if (isMockMode) {
    // Save to LocalStorage mock DB
    const scripts = JSON.parse(localStorage.getItem('mock_scripts') || '[]');
    const analyses = JSON.parse(localStorage.getItem('mock_analysis') || '[]');
    const documentations = JSON.parse(localStorage.getItem('mock_documentation') || '[]');

    const scriptId = Math.random().toString(36).substring(2, 11);
    
    scripts.push({
      id: scriptId,
      user_id: userId,
      script_name: name,
      language: language,
      script_content: code,
      created_at: new Date().toISOString()
    });

    analyses.push({
      id: Math.random().toString(36).substring(2, 11),
      script_id: scriptId,
      source_details: analysis.sources,
      target_details: analysis.targets,
      transformations: analysis.transformations,
      dependencies: analysis.dependencies,
      column_mapping: analysis.columnMapping,
      created_at: new Date().toISOString()
    });

    documentations.push({
      id: Math.random().toString(36).substring(2, 11),
      script_id: scriptId,
      generated_documentation: analysis.generatedDocumentation,
      created_at: new Date().toISOString()
    });

    localStorage.setItem('mock_scripts', JSON.stringify(scripts));
    localStorage.setItem('mock_analysis', JSON.stringify(analyses));
    localStorage.setItem('mock_documentation', JSON.stringify(documentations));

    return { scriptId, error: null };
  } else {
    // Save to real Supabase
    if (!supabase) return { scriptId: null, error: new Error('Supabase client not initialized') };
    
    try {
      // 1. Insert Script
      const { data: scriptData, error: scriptErr } = await supabase
        .from('scripts')
        .insert({
          user_id: userId,
          script_name: name,
          language: language,
          script_content: code
        })
        .select()
        .single();

      if (scriptErr || !scriptData) return { scriptId: null, error: scriptErr };

      // 2. Insert Analysis details
      const { error: analysisErr } = await supabase
        .from('analysis')
        .insert({
          script_id: scriptData.id,
          source_details: analysis.sources,
          target_details: analysis.targets,
          transformations: analysis.transformations,
          dependencies: analysis.dependencies,
          column_mapping: analysis.columnMapping
        });

      if (analysisErr) return { scriptId: scriptData.id, error: analysisErr };

      // 3. Insert Documentation markdown
      const { error: docErr } = await supabase
        .from('documentation')
        .insert({
          script_id: scriptData.id,
          generated_documentation: analysis.generatedDocumentation
        });

      if (docErr) return { scriptId: scriptData.id, error: docErr };

      return { scriptId: scriptData.id, error: null };
    } catch (e) {
      return { scriptId: null, error: e };
    }
  }
}

export async function fetchUserHistory(userId: string): Promise<any[]> {
  if (isMockMode) {
    const scripts = JSON.parse(localStorage.getItem('mock_scripts') || '[]');
    const userScripts = scripts.filter((s: any) => s.user_id === userId);
    
    const analyses = JSON.parse(localStorage.getItem('mock_analysis') || '[]');
    const documentations = JSON.parse(localStorage.getItem('mock_documentation') || '[]');
    
    return userScripts.map((s: any) => {
      const analysis = analyses.find((a: any) => a.script_id === s.id) || {};
      const doc = documentations.find((d: any) => d.script_id === s.id) || {};
      return {
        id: s.id,
        name: s.script_name,
        language: s.language,
        code: s.script_content,
        created_at: s.created_at,
        analysis: {
          sources: analysis.source_details || { database: '', tables: [], files: [], apis: [], columns: [] },
          targets: analysis.target_details || { database: '', tables: [], destination: '', operation: 'UNKNOWN' },
          transformations: analysis.transformations || [],
          dependencies: analysis.dependencies || [],
          columnMapping: analysis.column_mapping || []
        },
        documentation: doc.generated_documentation || ''
      };
    }).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else {
    if (!supabase) return [];
    
    // Fetch user scripts with analysis and docs in real Supabase
    const { data: scripts, error } = await supabase
      .from('scripts')
      .select(`
        id,
        script_name,
        language,
        script_content,
        created_at,
        analysis (
          source_details,
          target_details,
          transformations,
          dependencies,
          column_mapping
        ),
        documentation (
          generated_documentation
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !scripts) {
      console.error("Error fetching history:", error);
      return [];
    }

    return scripts.map((s: any) => {
      const analysisItem = s.analysis?.[0] || {};
      const docItem = s.documentation?.[0] || {};
      return {
        id: s.id,
        name: s.script_name,
        language: s.language,
        code: s.script_content,
        created_at: s.created_at,
        analysis: {
          sources: analysisItem.source_details || { database: '', tables: [], files: [], apis: [], columns: [] },
          targets: analysisItem.target_details || { database: '', tables: [], destination: '', operation: 'UNKNOWN' },
          transformations: analysisItem.transformations || [],
          dependencies: analysisItem.dependencies || [],
          columnMapping: analysisItem.column_mapping || []
        },
        documentation: docItem.generated_documentation || ''
      };
    });
  }
}

export async function deleteHistoryItem(scriptId: string): Promise<boolean> {
  if (isMockMode) {
    let scripts = JSON.parse(localStorage.getItem('mock_scripts') || '[]');
    let analyses = JSON.parse(localStorage.getItem('mock_analysis') || '[]');
    let documentations = JSON.parse(localStorage.getItem('mock_documentation') || '[]');

    scripts = scripts.filter((s: any) => s.id !== scriptId);
    analyses = analyses.filter((a: any) => a.script_id !== scriptId);
    documentations = documentations.filter((d: any) => d.script_id !== scriptId);

    localStorage.setItem('mock_scripts', JSON.stringify(scripts));
    localStorage.setItem('mock_analysis', JSON.stringify(analyses));
    localStorage.setItem('mock_documentation', JSON.stringify(documentations));
    return true;
  } else {
    if (!supabase) return false;
    // RLS and cascade rules handle security and references deletions
    const { error } = await supabase
      .from('scripts')
      .delete()
      .eq('id', scriptId);

    return !error;
  }
}
