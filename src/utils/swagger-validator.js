// src/utils/swagger-validator.js
import fetch from 'node-fetch';
import colors from 'colors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Validador do Swagger
 * Verifica se a implementação da API corresponde à documentação Swagger
 */
export class SwaggerValidator {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.swaggerJson = null;
    this.endpoints = [];
  }

  /**
   * Fetch e parse do swagger.json
   */
  async fetchSwaggerSpec() {
    try {
      const response = await fetch(`${this.baseUrl}/api-docs.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch Swagger spec: ${response.status} ${response.statusText}`);
      }
      
      this.swaggerJson = await response.json();
      this.extractEndpoints();
      
      return this.swaggerJson;
    } catch (error) {
      console.error(colors.red('Error fetching Swagger spec:'), error);
      throw error;
    }
  }

  /**
   * Extrai endpoints do Swagger spec
   */
  extractEndpoints() {
    const paths = this.swaggerJson?.paths || {};
    
    this.endpoints = [];
    
    Object.entries(paths).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, spec]) => {
        this.endpoints.push({
          path,
          method: method.toUpperCase(),
          operationId: spec.operationId || `${method}${path}`,
          summary: spec.summary || '',
          tags: spec.tags || [],
          parameters: spec.parameters || [],
          requestBody: spec.requestBody,
          responses: spec.responses || {}
        });
      });
    });
    
    return this.endpoints;
  }

  /**
   * Testa endpoints GET básicos
   */
  async testBasicEndpoints() {
    console.log(colors.cyan('\n=== Testando endpoints básicos ==='));
    
    const getEndpoints = this.endpoints.filter(e => e.method === 'GET' && !e.path.includes('{'));
    
    for (const endpoint of getEndpoints) {
      const url = `${this.baseUrl}${endpoint.path}`;
      console.log(colors.yellow(`\nTestando ${endpoint.method} ${endpoint.path}`));
      
      try {
        const response = await fetch(url);
        
        if (response.ok) {
          console.log(colors.green(`✓ Status: ${response.status}`));
          
          // Verificar se a resposta tem HATEOAS links
          const json = await response.json();
          const hasLinks = json.links || json._links;
          
          if (hasLinks) {
            console.log(colors.green('✓ HATEOAS links encontrados'));
          } else {
            console.log(colors.yellow('⚠ Sem HATEOAS links na resposta'));
          }
        } else {
          console.log(colors.red(`✗ Status: ${response.status} ${response.statusText}`));
        }
      } catch (error) {
        console.error(colors.red(`✗ Erro ao testar ${url}:`), error.message);
      }
    }
  }

  /**
   * Salva o relatório em HTML
   */
  async saveReport(outputPath = '../public/swagger-report.html') {
    const filePath = path.resolve(__dirname, outputPath);
    
    const endpoints = this.endpoints.map(e => `
      <tr>
        <td><span class="method ${e.method.toLowerCase()}">${e.method}</span></td>
        <td>${e.path}</td>
        <td>${e.summary}</td>
        <td>${e.tags.join(', ')}</td>
      </tr>
    `).join('');
    
    const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório do Swagger - API de Notificações</title>
      <style>
        body { font-family: system-ui, sans-serif; line-height: 1.6; margin: 0; padding: 0; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        header { background-color: #2c3e50; color: white; padding: 20px; text-align: center; }
        h1 { margin: 0; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        tr:hover { background-color: #f5f5f5; }
        .method { padding: 5px 10px; border-radius: 4px; color: white; font-weight: bold; }
        .get { background-color: #61affe; }
        .post { background-color: #49cc90; }
        .put { background-color: #fca130; }
        .delete { background-color: #f93e3e; }
        .section { margin: 30px 0; }
        .timestamp { color: #666; font-style: italic; }
      </style>
    </head>
    <body>
      <header>
        <h1>Relatório do Swagger - API de Notificações</h1>
      </header>
      <div class="container">
        <div class="section">
          <h2>Informações da API</h2>
          <p><strong>Título:</strong> ${this.swaggerJson.info.title}</p>
          <p><strong>Versão:</strong> ${this.swaggerJson.info.version}</p>
          <p><strong>Descrição:</strong> ${this.swaggerJson.info.description}</p>
          <p class="timestamp">Relatório gerado em: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="section">
          <h2>Endpoints (${this.endpoints.length})</h2>
          <table>
            <thead>
              <tr>
                <th>Método</th>
                <th>Caminho</th>
                <th>Descrição</th>
                <th>Tags</th>
              </tr>
            </thead>
            <tbody>
              ${endpoints}
            </tbody>
          </table>
        </div>
      </div>
    </body>
    </html>
    `;
    
    fs.writeFileSync(filePath, html);
    console.log(colors.green(`\nRelatório salvo em: ${filePath}`));
    
    return filePath;
  }

  /**
   * Executa validação completa
   */
  async validateAll() {
    console.log(colors.cyan('=== Iniciando validação do Swagger ==='));
    
    await this.fetchSwaggerSpec();
    console.log(colors.green(`\n✓ Especificação Swagger obtida com sucesso`));
    console.log(colors.green(`✓ Versão da API: ${this.swaggerJson.info.version}`));
    console.log(colors.green(`✓ Endpoints encontrados: ${this.endpoints.length}`));
    
    await this.testBasicEndpoints();
    
    const reportPath = await this.saveReport();
    
    console.log(colors.cyan('\n=== Validação concluída ==='));
    return {
      success: true,
      endpointCount: this.endpoints.length,
      reportPath
    };
  }
}

// Função para executar a validação diretamente
export async function runValidation(baseUrl = 'http://localhost:3000') {
  const validator = new SwaggerValidator(baseUrl);
  return validator.validateAll();
}

// Permitir execução direta do arquivo
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runValidation()
    .then(() => console.log(colors.green('\nValidação concluída com sucesso!')))
    .catch(err => console.error(colors.red('\nErro durante a validação:'), err));
}
