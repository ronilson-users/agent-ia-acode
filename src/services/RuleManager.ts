export interface RuleSet {
    quality: {
        bestPractices: boolean;
        refactoring: boolean;
        complexityCheck: boolean;
    };
    security: {
        securityScan: boolean;
        inputValidation: boolean;
        secretsDetection: boolean;
    };
    performance: {
        optimizations: boolean;
        mobileOptimized: boolean;
    };
    acode: {
        themeAware: boolean;
        shortcuts: boolean;
    };
    custom: Record<string, any>;
}

export class RuleManager {
    private rules: RuleSet = {
        quality: {
            bestPractices: true,
            refactoring: true,
            complexityCheck: true
        },
        security: {
            securityScan: true,
            inputValidation: true,
            secretsDetection: true
        },
        performance: {
            optimizations: true,
            mobileOptimized: true
        },
        acode: {
            themeAware: true,
            shortcuts: true
        },
        custom: {}
    };

    applyRules(context: string, code: string): string {
        const suggestions: string[] = [];

        if (this.rules.quality.bestPractices) {
            suggestions.push(...this.checkBestPractices(code));
        }

        if (this.rules.security.securityScan) {
            suggestions.push(...this.securityScan(code));
        }

        return suggestions.join('\n');
    }

    private checkBestPractices(code: string): string[] {
        const issues: string[] = [];
        
        // Verificar funções muito longas
        if (code.split('\n').length > 50) {
            issues.push('⚠️ Função muito longa. Considere dividir em funções menores.');
        }
        
        // Verificar complexidade
        if (this.calculateComplexity(code) > 10) {
            issues.push('⚠️ Alta complexidade ciclomática. Considere simplificar a lógica.');
        }
        
        return issues;
    }

    private securityScan(code: string): string[] {
        const issues: string[] = [];
        
        // Detectar possíveis XSS
        if (code.includes('innerHTML') && !code.includes('DOMPurify') && !code.includes('textContent')) {
            issues.push('🔒 Possível vulnerabilidade XSS detectada. Use textContent ou sanitize inputs.');
        }
        
        // Detectar secrets
        const secretPatterns = [/api_key=/, /password=/, /token=/];
        secretPatterns.forEach(pattern => {
            if (pattern.test(code)) {
                issues.push('🔒 Possível secret hardcoded detectado. Use variáveis de ambiente.');
            }
        });
        
        return issues;
    }

    private calculateComplexity(code: string): number {
        const complexityIndicators = ['if', 'for', 'while', 'case', 'catch', '&&', '||', '?'];
        return complexityIndicators.reduce((count, indicator) => {
            return count + (code.split(indicator).length - 1);
        }, 0);
    }

    // Getters e setters
    getRules(): RuleSet {
        return this.rules;
    }

    updateRules(newRules: Partial<RuleSet>): void {
        this.rules = { ...this.rules, ...newRules };
    }

    saveToStorage(pluginId: string): void {
        if (typeof appSettings !== 'undefined') {
            appSettings.value[pluginId] = {
                ...appSettings.value[pluginId],
                rules: this.rules
            };
            appSettings.update();
        }
    }

    loadFromStorage(pluginId: string): void {
        if (typeof appSettings !== 'undefined' && appSettings.value[pluginId]?.rules) {
            this.rules = appSettings.value[pluginId].rules;
        }
    }
}