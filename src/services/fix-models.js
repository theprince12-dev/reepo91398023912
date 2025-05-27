// src/services/fix-models.js
/**
 * Script para corrigir definições de modelos que estão causando erros
 * Este script modifica a definição do modelo DetalhesVenda para remover a coluna frete_validado
 * que está sendo referenciada mas não existe na tabela do banco de dados.
 */

const db = require('../../models');
const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Função principal
async function fixModels() {
    try {
        console.log('=== Corrigindo definições de modelos ===');
        
        // 1. Verificar modelo DetalhesVenda
        const DetalhesVenda = db.DetalhesVenda;
        console.log(`\n1. Analisando modelo DetalhesVenda`);
        
        // Obter atributos atuais do modelo
        const attributes = Object.keys(DetalhesVenda.rawAttributes);
        console.log(`   Atributos atuais: ${attributes.length}`);
        
        // Verificar se frete_validado está nos atributos
        const hasFreteValidado = attributes.includes('frete_validado');
        console.log(`   Possui atributo 'frete_validado': ${hasFreteValidado ? 'Sim' : 'Não'}`);
        
        // 2. Modificar arquivo de modelo
        const modelPath = path.join(__dirname, '..', '..', 'models', 'detalhesVendaModel.js');
        console.log(`\n2. Modificando arquivo de modelo: ${modelPath}`);
        
        // Ler arquivo
        let content = '';
        try {
            content = fs.readFileSync(modelPath, 'utf8');
            console.log(`   Arquivo lido com sucesso (${content.length} bytes)`);
        } catch (err) {
            console.error(`   Erro ao ler arquivo: ${err.message}`);
            throw err;
        }
        
        // Verificar se há referência a frete_validado
        const hasReference = content.includes('frete_validado');
        console.log(`   Contém referência a 'frete_validado': ${hasReference ? 'Sim' : 'Não'}`);
        
        if (hasReference) {
            // Criar backup antes de modificar
            const backupPath = `${modelPath}.bak`;
            fs.writeFileSync(backupPath, content);
            console.log(`   Backup criado em ${backupPath}`);
            
            // Remover bloco de definição de frete_validado
            const updated = content.replace(/\s*frete_validado:\s*{[\s\S]*?field:\s*'frete_validado'\s*}[,]?/g, '');
            
            // Verificar se houve alteração
            if (updated !== content) {
                fs.writeFileSync(modelPath, updated);
                console.log(`   Arquivo modificado com sucesso`);
            } else {
                console.log(`   Nenhuma alteração feita no arquivo`);
            }
        }

        // Similar para colfrete_validado se necessário
        const hasColFreteReference = content.includes('colfrete_validado');
        console.log(`   Contém referência a 'colfrete_validado': ${hasColFreteReference ? 'Sim' : 'Não'}`);
        
        if (hasColFreteReference) {
            // Criar backup antes de modificar (se ainda não tiver sido feito)
            if (!hasReference) {
                const backupPath = `${modelPath}.bak`;
                fs.writeFileSync(backupPath, content);
                console.log(`   Backup criado em ${backupPath}`);
            }
            
            // Ler o conteúdo novamente caso já tenha sido modificado
            content = fs.readFileSync(modelPath, 'utf8');
            
            // Remover bloco de definição de colfrete_validado
            const updated = content.replace(/\s*colfrete_validado:\s*{[\s\S]*?field:\s*'colfrete_validado'\s*}[,]?/g, '');
            
            // Verificar se houve alteração
            if (updated !== content) {
                fs.writeFileSync(modelPath, updated);
                console.log(`   Arquivo modificado para remover colfrete_validado`);
            } else {
                console.log(`   Nenhuma alteração feita para colfrete_validado`);
            }
        }
        
        console.log('\n3. Reiniciando sequelize...');
        // Aqui normalmente teríamos que reiniciar a aplicação para recarregar os modelos
        console.log('   Reinicialização necessária. Reinicie o servidor manualmente.');
        
        console.log('\n=== Correção concluída ===');
        console.log('Para aplicar as alterações, reinicie o servidor com: node app.js');
        
    } catch (error) {
        console.error('Erro durante a correção:', error);
    }
}

// Executar
fixModels();
